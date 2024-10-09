// routes/transactions.js

const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

// Load environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Middleware to authenticate JWT tokens
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // The token is expected to be in the format "Bearer TOKEN"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err);
            return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
        }

        req.user = user; // Contains user ID and other relevant info
        next();
    });
}

/**
 * Route: GET /api/transactions/check-balance
 * Description: Retrieves the current balance of the authenticated user.
 */
router.get('/check-balance', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const query = `SELECT balance FROM users WHERE id = ?`;
    db.get(query, [userId], (err, row) => {
        if (err) {
            console.error('Error fetching balance:', err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }

        if (!row) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.json({ success: true, balance: row.balance });
    });
});

/**
 * Route: POST /api/transactions/deposit
 * Description: Allows the authenticated user to deposit funds into their account.
 * Body Parameters:
 * - amount: Number (required)
 */
router.post('/deposit', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { amount } = req.body;

    // Validate the deposit amount
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid deposit amount.' });
    }

    // Begin transaction
    db.serialize(() => {
        // Update user's balance
        const updateBalanceQuery = `UPDATE users SET balance = balance + ? WHERE id = ?`;
        db.run(updateBalanceQuery, [amount, userId], function(err) {
            if (err) {
                console.error('Error updating balance:', err.message);
                return res.status(500).json({ success: false, message: 'Failed to deposit funds.' });
            }

            // Log the transaction
            const logTransactionQuery = `INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)`;
            db.run(logTransactionQuery, [userId, amount, 'deposit'], function(err) {
                if (err) {
                    console.error('Error logging transaction:', err.message);
                    return res.status(500).json({ success: false, message: 'Failed to log transaction.' });
                }

                res.json({ success: true, message: 'Deposit successful.', newBalance: undefined }); // You can fetch the new balance if needed
            });
        });
    });
});

/**
 * Route: POST /api/transactions/send-money
 * Description: Allows the authenticated user to send money to another user.
 * Body Parameters:
 * - recipientPhone: String (required)
 * - amount: Number (required)
 */
router.post('/send-money', authenticateToken, (req, res) => {
    const senderId = req.user.id;
    const { recipientPhone, amount } = req.body;

    // Validate input
    if (!recipientPhone || typeof recipientPhone !== 'string') {
        return res.status(400).json({ success: false, message: 'Recipient phone number is required.' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount.' });
    }

    // Start a serialized transaction
    db.serialize(() => {
        // Fetch sender's current balance
        const fetchSenderBalance = `SELECT balance FROM users WHERE id = ?`;
        db.get(fetchSenderBalance, [senderId], (err, sender) => {
            if (err) {
                console.error('Error fetching sender balance:', err.message);
                return res.status(500).json({ success: false, message: 'Internal server error.' });
            }

            if (!sender) {
                return res.status(404).json({ success: false, message: 'Sender not found.' });
            }

            if (sender.balance < amount) {
                return res.status(400).json({ success: false, message: 'Insufficient balance.' });
            }

            // Fetch recipient's ID
            const fetchRecipientId = `SELECT id FROM users WHERE phone = ?`;
            db.get(fetchRecipientId, [recipientPhone], (err, recipient) => {
                if (err) {
                    console.error('Error fetching recipient:', err.message);
                    return res.status(500).json({ success: false, message: 'Internal server error.' });
                }

                if (!recipient) {
                    return res.status(404).json({ success: false, message: 'Recipient not found.' });
                }

                const recipientId = recipient.id;

                // Deduct amount from sender
                const deductAmount = `UPDATE users SET balance = balance - ? WHERE id = ?`;
                db.run(deductAmount, [amount, senderId], function(err) {
                    if (err) {
                        console.error('Error deducting amount:', err.message);
                        return res.status(500).json({ success: false, message: 'Failed to send money.' });
                    }

                    // Add amount to recipient
                    const addAmount = `UPDATE users SET balance = balance + ? WHERE id = ?`;
                    db.run(addAmount, [amount, recipientId], function(err) {
                        if (err) {
                            console.error('Error adding amount to recipient:', err.message);
                            return res.status(500).json({ success: false, message: 'Failed to send money.' });
                        }

                        // Log sender's transaction
                        const logSenderTransaction = `INSERT INTO transactions (user_id, amount, type, counterparty) VALUES (?, ?, ?, ?)`;
                        db.run(logSenderTransaction, [senderId, amount, 'debit', recipientPhone], function(err) {
                            if (err) {
                                console.error('Error logging sender transaction:', err.message);
                                return res.status(500).json({ success: false, message: 'Failed to log transaction.' });
                            }

                            // Log recipient's transaction
                            const logRecipientTransaction = `INSERT INTO transactions (user_id, amount, type, counterparty) VALUES (?, ?, ?, ?)`;
                            db.run(logRecipientTransaction, [recipientId, amount, 'credit', req.user.phone], function(err) {
                                if (err) {
                                    console.error('Error logging recipient transaction:', err.message);
                                    // Not failing the request since money has been transferred
                                }

                                res.json({ success: true, message: 'Money sent successfully.' });
                            });
                        });
                    });
                });
            });
        });
    });
});

/**
 * Route: POST /api/transactions/buy-airtime
 * Description: Allows the authenticated user to buy airtime.
 * Body Parameters:
 * - amount: Number (required)
 */
router.post('/buy-airtime', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { amount } = req.body;

    // Validate the airtime amount
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid airtime amount.' });
    }

    // Start transaction
    db.serialize(() => {
        // Fetch user's current balance
        const fetchBalance = `SELECT balance FROM users WHERE id = ?`;
        db.get(fetchBalance, [userId], (err, user) => {
            if (err) {
                console.error('Error fetching user balance:', err.message);
                return res.status(500).json({ success: false, message: 'Internal server error.' });
            }

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            if (user.balance < amount) {
                return res.status(400).json({ success: false, message: 'Insufficient balance.' });
            }

            // Deduct airtime amount
            const deductAmount = `UPDATE users SET balance = balance - ? WHERE id = ?`;
            db.run(deductAmount, [amount, userId], function(err) {
                if (err) {
                    console.error('Error deducting airtime amount:', err.message);
                    return res.status(500).json({ success: false, message: 'Failed to buy airtime.' });
                }

                // Log the transaction
                const logTransaction = `INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)`;
                db.run(logTransaction, [userId, amount, 'buy_airtime'], function(err) {
                    if (err) {
                        console.error('Error logging airtime transaction:', err.message);
                        return res.status(500).json({ success: false, message: 'Failed to log transaction.' });
                    }

                    res.json({ success: true, message: 'Airtime purchased successfully.', newBalance: user.balance - amount });
                });
            });
        });
    });
});

/**
 * Route: GET /api/transactions/transaction-history
 * Description: Retrieves the transaction history of the authenticated user.
 */
router.get('/transaction-history', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT 
            amount, 
            type, 
            counterparty, 
            createdAt 
        FROM transactions 
        WHERE user_id = ?
        ORDER BY datetime(createdAt) DESC
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching transaction history:', err.message);
            return res.status(500).json({ success: false, message: 'Failed to retrieve transaction history.' });
        }

        res.json({ success: true, transactions: rows });
    });
});

/**
 * Route: POST /api/transactions/withdraw
 * Description: Allows the authenticated user to withdraw funds.
 * Body Parameters:
 * - amount: Number (required)
 */
router.post('/withdraw', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { amount } = req.body;

    // Validate withdrawal amount
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
    }

    // Start transaction
    db.serialize(() => {
        // Fetch user's current balance
        const fetchBalance = `SELECT balance FROM users WHERE id = ?`;
        db.get(fetchBalance, [userId], (err, user) => {
            if (err) {
                console.error('Error fetching user balance:', err.message);
                return res.status(500).json({ success: false, message: 'Internal server error.' });
            }

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            if (user.balance < amount) {
                return res.status(400).json({ success: false, message: 'Insufficient balance.' });
            }

            // Deduct withdrawal amount
            const deductAmount = `UPDATE users SET balance = balance - ? WHERE id = ?`;
            db.run(deductAmount, [amount, userId], function(err) {
                if (err) {
                    console.error('Error deducting withdrawal amount:', err.message);
                    return res.status(500).json({ success: false, message: 'Failed to withdraw funds.' });
                }

                // Log the transaction
                const logTransaction = `INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)`;
                db.run(logTransaction, [userId, amount, 'withdraw'], function(err) {
                    if (err) {
                        console.error('Error logging withdrawal transaction:', err.message);
                        return res.status(500).json({ success: false, message: 'Failed to log transaction.' });
                    }

                    res.json({ success: true, message: 'Withdrawal successful.', newBalance: user.balance - amount });
                });
            });
        });
    });
});

/**
 * Route: GET /api/transactions/summary
 * Description: Provides a summary of the user's transactions, including total deposits, withdrawals, and current balance.
 */
router.get('/summary', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const queries = {
        balance: `SELECT balance FROM users WHERE id = ?`,
        totalDeposits: `SELECT SUM(amount) as totalDeposits FROM transactions WHERE user_id = ? AND type = 'deposit'`,
        totalWithdrawals: `SELECT SUM(amount) as totalWithdrawals FROM transactions WHERE user_id = ? AND type = 'withdraw'`,
        totalSent: `SELECT SUM(amount) as totalSent FROM transactions WHERE user_id = ? AND type = 'debit'`,
        totalReceived: `SELECT SUM(amount) as totalReceived FROM transactions WHERE user_id = ? AND type = 'credit'`
    };

    db.serialize(() => {
        db.get(queries.balance, [userId], (err, balanceRow) => {
            if (err) {
                console.error('Error fetching balance:', err.message);
                return res.status(500).json({ success: false, message: 'Internal server error.' });
            }

            db.get(queries.totalDeposits, [userId], (err, depositRow) => {
                if (err) {
                    console.error('Error fetching total deposits:', err.message);
                    return res.status(500).json({ success: false, message: 'Internal server error.' });
                }

                db.get(queries.totalWithdrawals, [userId], (err, withdrawalRow) => {
                    if (err) {
                        console.error('Error fetching total withdrawals:', err.message);
                        return res.status(500).json({ success: false, message: 'Internal server error.' });
                    }

                    db.get(queries.totalSent, [userId], (err, sentRow) => {
                        if (err) {
                            console.error('Error fetching total sent:', err.message);
                            return res.status(500).json({ success: false, message: 'Internal server error.' });
                        }

                        db.get(queries.totalReceived, [userId], (err, receivedRow) => {
                            if (err) {
                                console.error('Error fetching total received:', err.message);
                                return res.status(500).json({ success: false, message: 'Internal server error.' });
                            }

                            res.json({
                                success: true,
                                summary: {
                                    balance: balanceRow.balance || 0,
                                    totalDeposits: depositRow.totalDeposits || 0,
                                    totalWithdrawals: withdrawalRow.totalWithdrawals || 0,
                                    totalSent: sentRow.totalSent || 0,
                                    totalReceived: receivedRow.totalReceived || 0
                                }
                            });
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;
