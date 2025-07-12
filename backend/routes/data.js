const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');
const Dataset = require('../models/Dataset');
const DataRecord = require('../models/DataRecord');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}.csv`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @desc    Upload CSV file
// @route   POST /api/data/upload
// @access  Private
router.post('/upload', protect, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { datasetName, description } = req.body;
    const filePath = req.file.path;
    const results = [];
    let headers = [];

    // Parse CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headerList) => {
        headers = headerList;
      })
      .on('data', (data) => {
        // Convert string numbers to actual numbers where possible
        const processedData = {};
        for (const [key, value] of Object.entries(data)) {
          const numValue = parseFloat(value);
          processedData[key] = isNaN(numValue) ? value : numValue;
        }
        results.push(processedData);
      })
      .on('end', async () => {
        try {
          // Create dataset record
          const dataset = await Dataset.create({
            name: datasetName || req.file.originalname,
            description: description || 'Uploaded CSV dataset',
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: filePath,
            columns: headers,
            rowCount: results.length,
            uploadedBy: req.user.id
          });

          // Save data records
          const dataRecords = results.map(record => ({
            datasetId: dataset._id,
            data: record
          }));

          await DataRecord.insertMany(dataRecords);

          // Clean up uploaded file
          fs.unlinkSync(filePath);

          res.status(201).json({
            success: true,
            message: 'CSV file uploaded and processed successfully',
            dataset: {
              id: dataset._id,
              name: dataset.name,
              columns: dataset.columns,
              rowCount: dataset.rowCount,
              createdAt: dataset.createdAt
            }
          });
        } catch (error) {
          console.error('Database save error:', error);
          res.status(500).json({
            success: false,
            message: 'Error saving data to database'
          });
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(400).json({
          success: false,
          message: 'Error parsing CSV file'
        });
      });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload'
    });
  }
});

// @desc    Get all datasets
// @route   GET /api/data/datasets
// @access  Private
router.get('/datasets', protect, async (req, res) => {
  try {
    const datasets = await Dataset.find({ uploadedBy: req.user.id })
      .select('-filePath')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: datasets.length,
      datasets
    });
  } catch (error) {
    console.error('Get datasets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get dataset data
// @route   GET /api/data/datasets/:id
// @access  Private
router.get('/datasets/:id', protect, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id
    });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    const { page = 1, limit = 100 } = req.query;
    const skip = (page - 1) * limit;

    const dataRecords = await DataRecord.find({ datasetId: dataset._id })
      .skip(skip)
      .limit(parseInt(limit))
      .select('data');

    const totalRecords = await DataRecord.countDocuments({ datasetId: dataset._id });

    res.status(200).json({
      success: true,
      dataset: {
        id: dataset._id,
        name: dataset.name,
        description: dataset.description,
        columns: dataset.columns,
        rowCount: dataset.rowCount,
        createdAt: dataset.createdAt
      },
      data: dataRecords.map(record => record.data),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        hasNext: skip + dataRecords.length < totalRecords,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get dataset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete dataset
// @route   DELETE /api/data/datasets/:id
// @access  Private
router.delete('/datasets/:id', protect, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id
    });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    // Delete associated data records
    await DataRecord.deleteMany({ datasetId: dataset._id });

    // Delete dataset
    await Dataset.findByIdAndDelete(dataset._id);

    res.status(200).json({
      success: true,
      message: 'Dataset deleted successfully'
    });
  } catch (error) {
    console.error('Delete dataset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
