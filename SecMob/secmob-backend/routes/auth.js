// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js'; // Ensure this is also updated for ES modules
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid'; // For generating unique OTP IDs

// Load environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail', // You can use other services like Outlook, Yahoo, etc.
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

// Utility function to send verification emails
function sendVerificationEmail(email, code) {
    const mailOptions = {
        from: EMAIL_USER,
        to: email,
        subject: 'SecMob - Your Verification Code',
        text: `Your verification code is: ${code}`,
    };

    return transporter.sendMail(mailOptions);
}

// User Registration
const router = express.Router();
router.post('/register', async (req, res) => {
    const { email, password, phone } = req.body;

    if (!email || !password || !phone) {
        return res.status(400).json({ success: false, message: 'Email, password, and phone are required.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const query = `INSERT INTO users (email, password, phone) VALUES (?, ?, ?)`;
    db.run(query, [email, hashedPassword, phone], function(err) {
        if (err) {
            console.error(err.message);
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ success: false, message: 'Email or phone number already exists.' });
            }
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
        res.status(201).json({ success: true, message: 'User registered successfully.' });
    });
});

// User Login - Initiate OTP
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find the user
    const query = `SELECT * FROM users WHERE email = ?`;
    db.get(query, [email], async (err, user) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }

        // Generate a 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Set OTP expiry to 10 minutes from now
        const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();

        // Insert OTP into the database
        const insertOtpQuery = `INSERT INTO otp (user_id, code, expiresAt) VALUES (?, ?, ?)`;
        db.run(insertOtpQuery, [user.id, otpCode, expiresAt], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ success: false, message: 'Failed to generate OTP.' });
            }

            // Send OTP via email
            sendVerificationEmail(user.email, otpCode)
                .then(() => {
                    res.json({ success: true, message: 'OTP sent to your email.' });
                })
                .catch(error => {
                    console.error('Error sending email:', error);
                    res.status(500).json({ success: false, message: 'Failed to send OTP email.' });
                });
        });
    });
});

// Verify OTP and Generate JWT
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    // Find the user
    const userQuery = `SELECT * FROM users WHERE email = ?`;
    db.get(userQuery, [email], (err, user) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or OTP.' });
        }

        // Check OTP validity
        const otpQuery = `SELECT * FROM otp WHERE user_id = ? AND code = ? AND expiresAt > ?`;
        db.get(otpQuery, [user.id, otp, new Date().toISOString()], (err, otpRecord) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ success: false, message: 'Internal server error.' });
            }

            if (!otpRecord) {
                return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
            }

            // Delete the OTP as it's no longer needed
            const deleteOtpQuery = `DELETE FROM otp WHERE id = ?`;
            db.run(deleteOtpQuery, [otpRecord.id], function(err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ success: false, message: 'Internal server error.' });
                }

                // Generate JWT
                const token = jwt.sign(
                    { id: user.id, email: user.email },
                    JWT_SECRET,
                    { expiresIn: process.env.TOKEN_EXPIRY || '1h' }
                );

                res.json({ success: true, token, message: 'Authentication successful.' });
            });
        });
    });
});

// Export the router as the default export
export default router;

