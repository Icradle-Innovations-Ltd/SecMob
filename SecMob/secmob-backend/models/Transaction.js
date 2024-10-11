// models/Transaction.js

import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

const transactionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required.']
    },
    amount: {
        type: Number,
        required: [true, 'Transaction amount is required.'],
        min: [0, 'Transaction amount must be positive.']
    },
    type: {
        type: String,
        enum: ['deposit', 'withdraw', 'debit', 'credit', 'buy_airtime'],
        required: [true, 'Transaction type is required.']
    },
    counterparty: {
        type: String,
        default: 'N/A',
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Optional: Add timestamps
transactionSchema.set('timestamps', true);

// Optional: Add indexes for faster queries
transactionSchema.index({ user: 1, createdAt: -1 });

export default model('Transaction', transactionSchema);
