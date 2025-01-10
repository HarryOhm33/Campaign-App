const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    panCardNumber: {
        type: String,
        required: false
    },
    amount: {
        type: Number,
        default: 0
    },
    items: [{
        description: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        amount: {
            type: Number,
            min: 0
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'cancelled'],
        default: 'pending'
    },
    dueDate: {
        type: Date,
        required: true
    },
    notes: {
        type: String,
        required: false
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

// Pre-validate middleware to calculate amounts
invoiceSchema.pre('validate', function(next) {
    // Calculate item amounts
    if (this.items && Array.isArray(this.items)) {
        this.items.forEach(item => {
            item.amount = item.quantity * item.price;
        });
        
        // Calculate total amount
        this.amount = this.items.reduce((total, item) => total + item.amount, 0);
    }

    // Update status based on due date
    const now = new Date();
    if (this.dueDate < now && this.status === 'pending') {
        this.status = 'overdue';
    }
    
    next();
});

// Pre-save middleware to update timestamp
invoiceSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to update overdue invoices
invoiceSchema.statics.updateOverdueInvoices = async function() {
    const now = new Date();
    await this.updateMany(
        {
            status: 'pending',
            dueDate: { $lt: now }
        },
        {
            $set: { status: 'overdue' }
        }
    );
};

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
