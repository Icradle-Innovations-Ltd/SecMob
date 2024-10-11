// models/Otp.js

import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

const otpSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required.']
    },
    code: {
        type: String,
        required: [true, 'OTP code is required.'],
        minlength: [6, 'OTP code must be at least 6 characters long.'],
        maxlength: [6, 'OTP code must be at most 6 characters long.']
    },
    expiresAt: {
        type: Date,
        required: [true, 'OTP expiration time is required.']
    }
});

// Optional: Add indexes
otpSchema.index({ user: 1, code: 1 }, { unique: true });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Automatically delete expired OTPs

export default model('Otp', otpSchema);
