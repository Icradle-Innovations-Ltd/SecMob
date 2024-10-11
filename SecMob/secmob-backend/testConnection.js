// testConnection.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error('❌ MONGODB_URI is not defined in the environment variables.');
    process.exit(1); // Exit process with failure
}

mongoose.connect(mongoURI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        mongoose.disconnect();
    })
    .catch(err => {
        console.error('❌ Error connecting to MongoDB:', err.message);
    });
