const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse');
const fs = require('fs');
const Campaign = require('../models/Campaign');
const Invoice = require('../models/Invoice');
const { adminAuth } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get all pending campaigns
router.get('/campaigns/pending', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const campaigns = await Campaign.find({ status: 'pending' })
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Campaign.countDocuments({ status: 'pending' });

        res.json({
            campaigns,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve or reject campaign
router.put('/campaigns/:id/review', adminAuth, async (req, res) => {
    try {
        const { status, reason } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        campaign.status = status;
        if (reason) campaign.rejectionReason = reason;
        await campaign.save();

        res.json(campaign);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Bulk approve campaigns
router.post('/campaigns/bulk-approve', adminAuth, async (req, res) => {
    try {
        const { campaignIds } = req.body;
        if (!Array.isArray(campaignIds)) {
            return res.status(400).json({ message: 'Campaign IDs must be an array' });
        }

        await Campaign.updateMany(
            { _id: { $in: campaignIds } },
            { $set: { status: 'approved' } }
        );

        res.json({ message: 'Campaigns approved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Download all campaign data as CSV
router.get('/campaigns/download', adminAuth, async (req, res) => {
    try {
        const campaigns = await Campaign.find()
            .populate('userId', 'firstName lastName email');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=campaigns.csv');

        // Write CSV header
        res.write('Campaign ID,Name,Description,User,Status,Created At\n');

        // Write campaign data
        campaigns.forEach(campaign => {
            const row = [
                campaign._id,
                campaign.name,
                campaign.description,
                `${campaign.userId.firstName} ${campaign.userId.lastName}`,
                campaign.status,
                campaign.createdAt
            ].join(',');
            res.write(row + '\n');
        });

        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload invoices via CSV
router.post('/invoices/upload', adminAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const results = [];
        const errors = [];

        fs.createReadStream(req.file.path)
            .pipe(parse({ columns: true, skip_empty_lines: true }))
            .on('data', async (data) => {
                try {
                    const invoice = new Invoice(data);
                    await invoice.save();
                    results.push(invoice);
                } catch (error) {
                    errors.push({ row: data, error: error.message });
                }
            })
            .on('end', () => {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });

                res.json({
                    message: 'Invoice upload completed',
                    success: results.length,
                    errors: errors.length,
                    errorDetails: errors
                });
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
