const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const PDFDocument = require('pdfkit');

// Update overdue invoices before handling any request
router.use(async (req, res, next) => {
    try {
        await Invoice.updateOverdueInvoices();
        next();
    } catch (error) {
        next(error);
    }
});

// Get all invoices
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, startDate, endDate, status } = req.query;
        const query = { userId: req.user.userId };

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (status) {
            query.status = status;
        }

        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Invoice.countDocuments(query);

        res.json({
            invoices,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error getting invoices:', error);
        res.status(500).json({ message: 'Error getting invoices' });
    }
});

// Create new invoice
router.post('/', auth, async (req, res) => {
    try {
        const { items, dueDate, notes } = req.body;

        // Validate items array
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required' });
        }

        // Validate each item
        for (const item of items) {
            if (!item.description || !item.quantity || !item.price) {
                return res.status(400).json({ message: 'Each item must have description, quantity, and price' });
            }
            if (item.quantity < 1) {
                return res.status(400).json({ message: 'Quantity must be at least 1' });
            }
            if (item.price < 0) {
                return res.status(400).json({ message: 'Price cannot be negative' });
            }
        }

        // Generate invoice number
        const invoiceCount = await Invoice.countDocuments();
        const invoiceNumber = `INV${(invoiceCount + 1).toString().padStart(5, '0')}`;

        const invoice = new Invoice({
            invoiceNumber,
            userId: req.user.userId,
            items,
            dueDate,
            notes
        });

        await invoice.save();
        res.status(201).json(invoice);
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Error creating invoice' });
    }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Error getting invoice:', error);
        res.status(500).json({ message: 'Error getting invoice' });
    }
});

// Update invoice status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const invoice = await Invoice.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { status },
            { new: true }
        );

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Error updating invoice status:', error);
        res.status(500).json({ message: 'Error updating invoice status' });
    }
});

// Delete invoice
router.delete('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ message: 'Error deleting invoice' });
    }
});

// Download invoice as PDF
router.get('/:id/download', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
        doc.pipe(res);

        // Add content to PDF
        doc.fontSize(25).text('Invoice', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
        doc.text(`Date: ${invoice.createdAt.toLocaleDateString()}`);
        doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`);
        doc.text(`Status: ${invoice.status}`);
        doc.moveDown();

        // Add items table
        doc.text('Items:', { underline: true });
        invoice.items.forEach(item => {
            doc.moveDown();
            doc.text(`Description: ${item.description}`);
            doc.text(`Quantity: ${item.quantity}`);
            doc.text(`Price: $${item.price}`);
            doc.text(`Amount: $${item.amount}`);
        });

        doc.moveDown();
        doc.fontSize(14).text(`Total Amount: $${invoice.amount}`, { align: 'right' });

        if (invoice.notes) {
            doc.moveDown();
            doc.fontSize(12).text('Notes:', { underline: true });
            doc.text(invoice.notes);
        }

        doc.end();
    } catch (error) {
        console.error('Error downloading invoice:', error);
        res.status(500).json({ message: 'Error downloading invoice' });
    }
});

module.exports = router;
