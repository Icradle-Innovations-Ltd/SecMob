// index.js

import 'dotenv/config';  // Load environment variables
import express from 'express';
import cors from 'cors';
import mongoose from './database.js'; // Your MongoDB connection
import authRoutes from './routes/auth.js'; // Ensure .js extension
import transactionRoutes from './routes/transactions.js'; // Ensure .js extension

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON requests

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Root Route
app.get('/', (req, res) => {
    res.send('SecMob Backend API is running.');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
