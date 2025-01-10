const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse');
const fs = require('fs');
const path = require('path');
const Campaign = require('../models/Campaign');
const { auth } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB limit
    }
});

// Get all campaigns for a user
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const campaigns = await Campaign.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Campaign.countDocuments({ userId: req.user.userId });

        res.json({
            campaigns,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
});

// Upload new campaign
router.post('/', auth, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.body.name) {
        return res.status(400).json({ message: 'Campaign name is required' });
    }

    const results = [];
    const headers = [];
    let hasError = false;

    try {
        const parser = fs
            .createReadStream(req.file.path)
            .pipe(parse({
                delimiter: ',',
                columns: true,
                skip_empty_lines: true,
                trim: true
            }));

        for await (const record of parser) {
            results.push(record);
        }

        const campaign = new Campaign({
            name: req.body.name,
            description: req.body.description,
            userId: req.user.userId,
            fileName: req.file.filename,
            filePath: req.file.path,
            status: 'pending',
            data: results
        });

        await campaign.save();

        res.status(201).json({
            message: 'Campaign created successfully',
            campaign: {
                id: campaign._id,
                name: campaign.name,
                description: campaign.description,
                status: campaign.status,
                createdAt: campaign.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating campaign:', error);
        hasError = true;
        res.status(500).json({ message: 'Failed to process CSV file' });
    } finally {
        // Clean up the uploaded file if there was an error
        if (hasError && req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
    }
});

// Update campaign
router.put('/:id', auth, async (req, res) => {
    try {
        const campaign = await Campaign.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        Object.assign(campaign, req.body);
        await campaign.save();

        res.json(campaign);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete campaign
router.delete('/:id', auth, async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ 
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        // Delete the associated file
        if (campaign.filePath) {
            fs.unlink(campaign.filePath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }

        await campaign.deleteOne();
        res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ message: 'Failed to delete campaign' });
    }
});

module.exports = router;
