const readline = require("readline");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Initialize readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Initialize SQLite database
const db = new sqlite3.Database("secure_mobile_money.db", (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to the Secure Mobile Money Services database.");
        createTables();
    }
});

// Function to create tables if they don't exist
function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone_number TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            pin TEXT NOT NULL,
            balance REAL DEFAULT 0,
            network TEXT NOT NULL,
            is_verified INTEGER DEFAULT 0,
            verification_token TEXT,
            security_question1 TEXT,
            security_answer1 TEXT,
            security_question2 TEXT,
            security_answer2 TEXT,
            security_question3 TEXT,
            security_answer3 TEXT
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER,
            recipient_id INTEGER,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (recipient_id) REFERENCES users(id)
        );
    `);
}

// Nodemailer configuration for sending verification emails
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'asecmob@gmail.com',
        pass: 'essl gqor fxhn bnqx', // Replace with your actual app password
    },
});

// Generate a 6-digit verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send email with the verification code
function sendVerificationCode(email, code) {
    const mailOptions = {
        from: 'asecmob@gmail.com',
        to: email,
        subject: 'Verification Code for Secure Mobile Money Services',
        text: `Your verification code is: ${code}`,
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            console.error("Error sending verification email:", err);
        } else {
            console.log("Verification code sent to your email.");
        }
    });
}

// Main menu
function mainMenu() {
    console.log("\n=== Secure Mobile Money Services ===");
    console.log("1. Create Account");
    console.log("2. Login");
    console.log("3. Reset PIN");
    console.log("4. Exit");
    rl.question("Choose an option: ", (option) => {
        switch (option) {
            case "1":
                createAccount();
                break;
            case "2":
                login();
                break;
            case "3":
                resetPin();
                break;
            case "4":
                console.log("Exiting application.");
                rl.close();
                db.close();
                break;
            default:
                console.log("Invalid option. Please try again.");
                mainMenu();
                break;
        }
    });
}

// Create account function
function createAccount() {
    console.log("\n=== Create a New Account ===");
    rl.question("Enter your first name: ", (firstName) => {
        rl.question("Enter your last name: ", (lastName) => {
            rl.question("Enter your mobile money phone number: ", (phoneNumber) => {
                if (!validatePhoneNumber(phoneNumber)) {
                    console.log("Invalid phone number. Must start with MTN (077/078) or Airtel (070/075) and be 10 digits.");
                    return createAccount();
                }
                const network = determineNetwork(phoneNumber);
                rl.question("Enter your email: ", (email) => {
                    rl.question("Set your 4-digit PIN: ", (pin) => {
                        if (!validatePin(pin)) {
                            console.log("PIN must be exactly 4 digits.");
                            return createAccount();
                        }
                        rl.question("Set your security question 1: ", (question1) => {
                            rl.question("Answer: ", (answer1) => {
                                rl.question("Set your security question 2: ", (question2) => {
                                    rl.question("Answer: ", (answer2) => {
                                        rl.question("Set your security question 3: ", (question3) => {
                                            rl.question("Answer: ", (answer3) => {
                                                const hashedPin = bcrypt.hashSync(pin, 10);
                                                const verificationToken = generateVerificationCode();
                                                db.run(
                                                    `INSERT INTO users (first_name, last_name, phone_number, email, pin, network, verification_token, security_question1, security_answer1, security_question2, security_answer2, security_question3, security_answer3) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                                                    [firstName, lastName, phoneNumber, email, hashedPin, network, verificationToken, question1, answer1, question2, answer2, question3, answer3],
                                                    function (err) {
                                                        if (err) {
                                                            if (err.message.includes("UNIQUE constraint failed")) {
                                                                console.log("Phone number or email already exists. Please try again with different credentials.");
                                                            } else {
                                                                console.error("Error creating account:", err.message);
                                                            }
                                                        } else {
                                                            console.log("Account created successfully! Please check your email for the verification code.");
                                                            sendVerificationCode(email, verificationToken);
                                                            verifyCode(email, verificationToken);
                                                        }
                                                        mainMenu();
                                                    }
                                                );
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

// Verify code function
function verifyCode(email, expectedToken) {
    rl.question("Enter the verification code sent to your email: ", (code) => {
        if (code === expectedToken) {
            db.run(`UPDATE users SET is_verified = 1 WHERE email = ?`, [email], function (err) {
                if (err) {
                    console.error("Error verifying email:", err.message);
                } else {
                    console.log("Email verified successfully!");
                }
                mainMenu();
            });
        } else {
            console.log("Invalid verification code. Please try again.");
            verifyCode(email, expectedToken); // Retry verification
        }
    });
}

// Validate phone number for MTN and Airtel
function validatePhoneNumber(phoneNumber) {
    const mtnPattern = /^07[78]\d{7}$/;
    const airtelPattern = /^07[05]\d{7}$/;
    return mtnPattern.test(phoneNumber) || airtelPattern.test(phoneNumber);
}

// Validate PIN
function validatePin(pin) {
    const pinPattern = /^\d{4}$/; // 4 digits
    return pinPattern.test(pin);
}

// Determine the network
function determineNetwork(phoneNumber) {
    if (phoneNumber.startsWith("077") || phoneNumber.startsWith("078")) {
        return "MTN";
    } else if (phoneNumber.startsWith("070") || phoneNumber.startsWith("075")) {
        return "Airtel";
    }
    return "Unknown";
}

// Login function
function login() {
    rl.question("Enter your mobile money phone number: ", (phoneNumber) => {
        db.get("SELECT * FROM users WHERE phone_number = ?", [phoneNumber], (err, user) => {
            if (err) {
                console.error("Error fetching user:", err.message);
                return mainMenu();
            }
            if (!user) {
                console.log("Account not found.");
                return mainMenu();
            }
            if (!user.is_verified) {
                console.log("Your account is not verified. Please verify your email.");
                return mainMenu();
            }
            rl.question("Enter your email: ", (email) => {
                if (email !== user.email) {
                    console.log("Email does not match our records.");
                    return mainMenu();
                }

                // Generate and send verification code for login
                const verificationCode = generateVerificationCode();
                sendVerificationCode(email, verificationCode);

                // Ask for the verification code
                rl.question("Enter the verification code sent to your email: ", (code) => {
                    if (code !== verificationCode) {
                        console.log("Invalid verification code.");
                        rl.question("Would you like to resend the code? (y/n): ", (answer) => {
                            if (answer.toLowerCase() === 'y') {
                                sendVerificationCode(email, verificationCode);
                                login(); // Retry login process
                            } else {
                                mainMenu();
                            }
                        });
                    } else {
                        rl.question("Enter your PIN: ", (pin) => {
                            if (bcrypt.compareSync(pin, user.pin)) {
                                console.log(`\nWelcome ${user.first_name} ${user.last_name}`);
                                accountMenu(user);
                            } else {
                                console.log("Incorrect PIN.");
                                mainMenu();
                            }
                        });
                    }
                });
            });
        });
    });
}

// Account menu
function accountMenu(user) {
    console.log(`\n=== Welcome to Secure Mobile Money Services, ${user.first_name} ${user.last_name} ===`);
    console.log("1. Check Balance");
    console.log("2. Deposit");
    console.log("3. Send Money");
    console.log("4. Buy Airtime");
    console.log("5. Transaction History");
    console.log("6. Logout");
    rl.question("Choose an option: ", (option) => {
        switch (option) {
            case "1":
                checkBalance(user);
                break;
            case "2":
                deposit(user);
                break;
            case "3":
                sendMoney(user);
                break;
            case "4":
                buyAirtime(user);
                break;
            case "5":
                transactionHistory(user);
                break;
            case "6":
                console.log("Logging out...");
                mainMenu();
                break;
            default:
                console.log("Invalid option. Please try again.");
                accountMenu(user);
                break;
        }
    });
}

// Check balance function
function checkBalance(user) {
    db.get("SELECT balance FROM users WHERE id = ?", [user.id], (err, row) => {
        if (err) {
            console.error("Error retrieving balance:", err.message);
            return accountMenu(user);
        }
        console.log(`Your current balance is: UGX ${row.balance.toFixed(2)}`);
        accountMenu(user); // Return to account menu
    });
}

// Deposit function
function deposit(user) {
    rl.question("Enter the amount to deposit (UGX): ", (amount) => {
        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            console.log("Invalid amount. Please enter a positive number.");
            return deposit(user); // Retry deposit process
        }
        db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [depositAmount, user.id], function (err) {
            if (err) {
                console.error("Error during deposit:", err.message);
            } else {
                // Retrieve updated balance
                db.get("SELECT balance FROM users WHERE id = ?", [user.id], (err, row) => {
                    if (err) {
                        console.error("Error retrieving updated balance:", err.message);
                    } else {
                        console.log(`Successfully deposited UGX ${depositAmount.toFixed(2)}. Your new balance is UGX ${row.balance.toFixed(2)}.`);
                        // Log the deposit transaction
                        db.run(
                            "INSERT INTO transactions (sender_id, type, amount) VALUES (?, ?, ?)",
                            [user.id, 'Deposit', depositAmount],
                            (err) => {
                                if (err) {
                                    console.error("Error logging transaction:", err.message);
                                }
                                accountMenu(user);
                            }
                        );
                    }
                });
            }
        });
    });
}

// Send money function
function sendMoney(sender) {
    rl.question("Enter the recipient's phone number: ", (recipientPhone) => {
        if (recipientPhone === sender.phone_number) {
            console.log("You cannot send money to yourself.");
            return accountMenu(sender);
        }
        db.get("SELECT * FROM users WHERE phone_number = ?", [recipientPhone], (err, recipient) => {
            if (err) {
                console.error("Error fetching recipient:", err.message);
                return accountMenu(sender);
            }
            if (!recipient) {
                console.log("Recipient not found.");
                return accountMenu(sender);
            }

            rl.question("Enter the amount to send (UGX): ", (amount) => {
                const sendAmount = parseFloat(amount);
                if (isNaN(sendAmount) || sendAmount <= 0) {
                    console.log("Invalid amount. Please enter a positive number.");
                    return sendMoney(sender); // Retry send money process
                }

                // Check if sender has sufficient balance
                db.get("SELECT balance FROM users WHERE id = ?", [sender.id], (err, row) => {
                    if (err) {
                        console.error("Error retrieving balance:", err.message);
                        return accountMenu(sender);
                    }
                    if (row.balance < sendAmount) {
                        console.log("Insufficient balance.");
                        return accountMenu(sender);
                    }

                    // Deduct amount from sender
                    db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [sendAmount, sender.id], function (err) {
                        if (err) {
                            console.error("Error sending money:", err.message);
                            return accountMenu(sender);
                        }

                        // Add amount to recipient
                        db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [sendAmount, recipient.id], function (err) {
                            if (err) {
                                console.error("Error receiving money:", err.message);
                                // Attempt to rollback sender's balance
                                db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [sendAmount, sender.id]);
                                return accountMenu(sender);
                            }

                            console.log(`Successfully sent UGX ${sendAmount.toFixed(2)} to ${recipient.first_name} ${recipient.last_name} (${recipient.phone_number}).`);

                            // Log the transaction
                            db.run(
                                "INSERT INTO transactions (sender_id, recipient_id, type, amount) VALUES (?, ?, ?, ?)",
                                [sender.id, recipient.id, 'Send Money', sendAmount],
                                (err) => {
                                    if (err) {
                                        console.error("Error logging transaction:", err.message);
                                    }
                                    accountMenu(sender);
                                }
                            );
                        });
                    });
                });
            });
        });
    });
}

// Buy airtime function
function buyAirtime(user) {
    rl.question("Enter the amount of airtime to purchase (UGX): ", (amount) => {
        const airtimeAmount = parseFloat(amount);
        if (isNaN(airtimeAmount) || airtimeAmount <= 0) {
            console.log("Invalid amount. Please enter a positive number.");
            return buyAirtime(user); // Retry buy airtime process
        }

        // Check if user has sufficient balance
        db.get("SELECT balance FROM users WHERE id = ?", [user.id], (err, row) => {
            if (err) {
                console.error("Error retrieving balance:", err.message);
                return accountMenu(user);
            }
            if (row.balance < airtimeAmount) {
                console.log("Insufficient balance.");
                return accountMenu(user);
            }

            // Deduct airtime amount from balance
            db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [airtimeAmount, user.id], function (err) {
                if (err) {
                    console.error("Error purchasing airtime:", err.message);
                } else {
                    console.log(`Successfully purchased airtime worth UGX ${airtimeAmount.toFixed(2)}. Your new balance is UGX ${row.balance - airtimeAmount}.`);

                    // Log the airtime purchase transaction
                    db.run(
                        "INSERT INTO transactions (sender_id, type, amount) VALUES (?, ?, ?)",
                        [user.id, 'Buy Airtime', airtimeAmount],
                        (err) => {
                            if (err) {
                                console.error("Error logging transaction:", err.message);
                            }
                            accountMenu(user);
                        }
                    );
                }
            });
        });
    });
}

// Transaction history function
function transactionHistory(user) {
    db.all("SELECT * FROM transactions WHERE sender_id = ? OR recipient_id = ? ORDER BY timestamp DESC", [user.id, user.id], (err, transactions) => {
        if (err) {
            console.error("Error retrieving transactions:", err.message);
            return accountMenu(user);
        }
        console.log("\n=== Transaction History (UGX) ===");
        if (transactions.length === 0) {
            console.log("No transactions found.");
        } else {
            transactions.forEach((transaction) => {
                let type = transaction.type;
                let amount = transaction.amount;
                let date = new Date(transaction.timestamp).toLocaleString();

                if (type === 'Send Money') {
                    db.get("SELECT first_name, last_name FROM users WHERE id = ?", [transaction.recipient_id], (err, recipient) => {
                        if (recipient) {
                            console.log(`- ${type} UGX ${amount.toFixed(2)} to ${recipient.first_name} ${recipient.last_name} on ${date}`);
                        } else {
                            console.log(`- ${type} UGX ${amount.toFixed(2)} to Unknown on ${date}`);
                        }
                    });
                } else if (type === 'Receive Money') {
                    db.get("SELECT first_name, last_name FROM users WHERE id = ?", [transaction.sender_id], (err, sender) => {
                        if (sender) {
                            console.log(`- ${type} UGX ${amount.toFixed(2)} from ${sender.first_name} ${sender.last_name} on ${date}`);
                        } else {
                            console.log(`- ${type} UGX ${amount.toFixed(2)} from Unknown on ${date}`);
                        }
                    });
                } else {
                    console.log(`- ${type} UGX ${amount.toFixed(2)} on ${date}`);
                }
            });
        }
        // Delay to allow async DB calls to complete
        setTimeout(() => {
            accountMenu(user);
        }, 1000);
    });
}

// Reset PIN function
function resetPin() {
    rl.question("Enter your mobile money phone number: ", (phoneNumber) => {
        db.get("SELECT * FROM users WHERE phone_number = ?", [phoneNumber], (err, user) => {
            if (err || !user) {
                console.log("Account not found.");
                return mainMenu();
            }
            rl.question("Enter your email: ", (email) => {
                if (email !== user.email) {
                    console.log("Email does not match our records.");
                    return mainMenu();
                }

                // Generate and send verification code
                const verificationCode = generateVerificationCode();
                sendVerificationCode(email, verificationCode);

                // Ask for the verification code
                rl.question("Enter the verification code sent to your email: ", (code) => {
                    if (code !== verificationCode) {
                        console.log("Invalid verification code.");
                        rl.question("Would you like to resend the code? (y/n): ", (answer) => {
                            if (answer.toLowerCase() === 'y') {
                                sendVerificationCode(email, verificationCode);
                                resetPin(); // Retry reset PIN process
                            } else {
                                mainMenu();
                            }
                        });
                    } else {
                        rl.question("Enter your new 4-digit PIN: ", (newPin) => {
                            if (!validatePin(newPin)) {
                                console.log("PIN must be exactly 4 digits.");
                                return resetPin(); // Retry reset PIN process
                            }
                            const hashedPin = bcrypt.hashSync(newPin, 10);
                            db.run("UPDATE users SET pin = ? WHERE id = ?", [hashedPin, user.id], (err) => {
                                if (err) {
                                    console.error("Error resetting PIN:", err.message);
                                } else {
                                    console.log("PIN reset successfully.");
                                }
                                mainMenu();
                            });
                        });
                    }
                });
            });
        });
    });
}

// Start the application
mainMenu();
