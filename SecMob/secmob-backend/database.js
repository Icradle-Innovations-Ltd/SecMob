// database.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// MongoDB Connection URI from environment variables
const mongoURI = process.env.MONGODB_URI;

// Check if MONGODB_URI is defined
if (!mongoURI) {
    console.error('❌ MONGODB_URI is not defined in the environment variables.');
    process.exit(1); // Exit process with failure
}

// Connect to MongoDB without deprecated options
mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB Atlas.'))
    .catch((err) => {
        console.error('❌ Error connecting to MongoDB:', err.message);
        process.exit(1); // Exit process with failure
    });

// Optional: Handle connection events
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB.');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB.');
});

// Export the Mongoose instance for use in other parts of the application
export default mongoose;
