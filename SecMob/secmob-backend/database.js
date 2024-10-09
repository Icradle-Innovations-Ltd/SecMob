// database.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Initialize Database Schema
db.serialize(() => {
    // Create Users Table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            balance REAL DEFAULT 0,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table ready.');
        }
    });

    // Create Transactions Table
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL, -- 'credit' or 'debit'
            counterparty TEXT, -- Recipient's phone number or 'N/A' for deposits
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating transactions table:', err.message);
        } else {
            console.log('Transactions table ready.');
        }
    });

    // Create OTP Table for Authentication
    db.run(`
        CREATE TABLE IF NOT EXISTS otp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            code TEXT NOT NULL,
            expiresAt TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating OTP table:', err.message);
        } else {
            console.log('OTP table ready.');
        }
    });
});

module.exports = db;
