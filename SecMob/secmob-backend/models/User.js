// models/User.js

import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: [true, 'Email address is required.'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, 'Email address is invalid.']
    },
    password: {
        type: String,
        required: [true, 'Password is required.'],
        minlength: [6, 'Password must be at least 6 characters long.']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required.'],
        unique: true,
        match: [/^\d{10,15}$/, 'Phone number is invalid.'] // Adjust regex as per your requirements
    },
    balance: {
        type: Number,
        default: 0,
        min: [0, 'Balance cannot be negative.']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Optional: Add timestamps (createdAt and updatedAt)
userSchema.set('timestamps', true);

// Optional: Add indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

export default model('User', userSchema);
