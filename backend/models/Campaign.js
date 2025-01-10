const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    data: [{
        type: Map,
        of: String
    }],
    fileName: {
        type: String
    },
    filePath: {
        type: String
    },
    totalRecords: {
        type: Number,
        default: 0
    },
    processedRecords: {
        type: Number,
        default: 0
    },
    errorRecords: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
campaignSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.data) {
        this.totalRecords = this.data.length;
    }
    next();
});

module.exports = mongoose.model('Campaign', campaignSchema);
