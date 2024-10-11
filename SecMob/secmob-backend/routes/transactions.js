// routes/transactions.js

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Ensure .js extension
import Transaction from '../models/Transaction.js'; // Ensure .js extension
import dotenv from 'dotenv';

dotenv.config();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const router = express.Router();

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
 * @route   GET /api/transactions/check-balance
 * @desc    Retrieves the current balance of the authenticated user.
 * @access  Private
 */
router.get('/check-balance', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('balance');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.json({ success: true, balance: user.balance });
    } catch (err) {
        console.error('Error in /check-balance:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

/**
 * @route   POST /api/transactions/deposit
 * @desc    Allows the authenticated user to deposit funds into their account.
 * @access  Private
 * @body    { amount: Number }
 */
router.post('/deposit', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { amount } = req.body;

    // Validate the deposit amount
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid deposit amount.' });
    }

    try {
        // Update user's balance
        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { balance: amount } },
            { new: true }
        ).select('balance');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Log the transaction
        const transaction = new Transaction({
            user: userId,
            amount,
            type: 'deposit',
            counterparty: 'N/A', // For deposits, no counterparty
        });

        await transaction.save();

        res.json({ success: true, message: 'Deposit successful.', newBalance: user.balance });
    } catch (err) {
        console.error('Error in /deposit:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

/**
 * @route   POST /api/transactions/send-money
 * @desc    Allows the authenticated user to send money to another user.
 * @access  Private
 * @body    { recipientEmail: String, amount: Number }
 */
router.post('/send-money', authenticateToken, async (req, res) => {
    const senderId = req.user.id;
    const { recipientEmail, amount } = req.body;

    // Validate input
    if (!recipientEmail || typeof recipientEmail !== 'string') {
        return res.status(400).json({ success: false, message: 'Recipient email is required.' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid transfer amount.' });
    }

    try {
        const sender = await User.findById(senderId);
        const recipient = await User.findOne({ email: recipientEmail });

        if (!recipient) {
            return res.status(404).json({ success: false, message: 'Recipient not found.' });
        }

        if (sender.balance < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance.' });
        }

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Deduct amount from sender
            sender.balance -= amount;
            await sender.save({ session });

            // Add amount to recipient
            recipient.balance += amount;
            await recipient.save({ session });

            // Create transaction records for both sender and recipient
            const senderTransaction = new Transaction({
                user: sender._id,
                amount,
                type: 'debit',
                counterparty: recipient.email,
            });

            const recipientTransaction = new Transaction({
                user: recipient._id,
                amount,
                type: 'credit',
                counterparty: sender.email,
            });

            await senderTransaction.save({ session });
            await recipientTransaction.save({ session });

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            res.json({ success: true, message: 'Money sent successfully.', newBalance: sender.balance });
        } catch (err) {
            // Abort the transaction on error
            await session.abortTransaction();
            session.endSession();
            console.error('Transaction error:', err.message);
            res.status(500).json({ success: false, message: 'Failed to send money.' });
        }
    } catch (err) {
        console.error('Error in /send-money:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

/**
 * @route   POST /api/transactions/buy-airtime
 * @desc    Allows the authenticated user to buy airtime.
 * @access  Private
 * @body    { amount: Number, provider: String }
 */
router.post('/buy-airtime', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { amount, provider } = req.body;

    // Validate airtime purchase details
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid airtime amount.' });
    }
    if (!provider || typeof provider !== 'string') {
        return res.status(400).json({ success: false, message: 'Airtime provider is required.' });
    }

    try {
        // Fetch user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance.' });
        }

        // Deduct amount from user's balance
        user.balance -= amount;
        await user.save();

        // Log the transaction
        const transaction = new Transaction({
            user: userId,
            amount,
            type: 'debit',
            counterparty: provider,
        });

        await transaction.save();

        res.json({ success: true, message: 'Airtime purchased successfully.', newBalance: user.balance });
    } catch (err) {
        console.error('Error in /buy-airtime:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

/**
 * @route   GET /api/transactions/transaction-history
 * @desc    Retrieves the transaction history of the authenticated user.
 * @access  Private
 */
router.get('/transaction-history', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 });

        res.json({ success: true, transactions });
    } catch (err) {
        console.error('Error in /transaction-history:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

/**
 * @route   POST /api/transactions/withdraw
 * @desc    Allows the authenticated user to withdraw funds.
 * @access  Private
 * @body    { amount: Number }
 */
router.post('/withdraw', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { amount } = req.body;

    // Validate withdrawal amount
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
    }

    try {
        // Fetch user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance.' });
        }

        // Deduct withdrawal amount
        user.balance -= amount;
        await user.save();

        // Log the withdrawal transaction
        const transaction = new Transaction({
            user: userId,
            amount,
            type: 'withdraw',
            counterparty: 'N/A', // No counterparty for withdrawals
        });

        await transaction.save();

        res.json({ success: true, message: 'Withdrawal successful.', newBalance: user.balance });
    } catch (err) {
        console.error('Error in /withdraw:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

/**
 * @route   GET /api/transactions/summary
 * @desc    Provides a summary of the user's transactions, including total deposits, withdrawals, and current balance.
 * @access  Private
 */
router.get('/summary', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId).select('balance');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const totalDeposits = await Transaction.aggregate([
            { $match: { user: user._id, type: 'deposit' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalWithdrawals = await Transaction.aggregate([
            { $match: { user: user._id, type: 'withdraw' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalSent = await Transaction.aggregate([
            { $match: { user: user._id, type: 'debit' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalReceived = await Transaction.aggregate([
            { $match: { user: user._id, type: 'credit' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            summary: {
                balance: user.balance,
                totalDeposits: totalDeposits[0] ? totalDeposits[0].total : 0,
                totalWithdrawals: totalWithdrawals[0] ? totalWithdrawals[0].total : 0,
                totalSent: totalSent[0] ? totalSent[0].total : 0,
                totalReceived: totalReceived[0] ? totalReceived[0].total : 0
            }
        });
    } catch (err) {
        console.error('Error in /summary:', err.message);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

export default router;
