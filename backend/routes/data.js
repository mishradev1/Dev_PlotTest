const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.userId}-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Upload CSV file
router.post('/upload', authMiddleware, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const filePath = req.file.path;
    const results = [];
    let headers = [];

    // Parse CSV
    const parsePromise = new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers = headerList;
        })
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    await parsePromise;

    // Analyze data types for each column
    const columnInfo = {};
    headers.forEach(header => {
      const values = results.map(row => row[header]).filter(val => val !== '' && val !== null);
      const numericValues = values.filter(val => !isNaN(val) && !isNaN(parseFloat(val)));
      
      columnInfo[header] = {
        type: numericValues.length === values.length && values.length > 0 ? 'numeric' : 'categorical',
        sampleValues: values.slice(0, 5),
        totalValues: values.length,
        uniqueValues: [...new Set(values)].length
      };
    });

    // Store file metadata
    const fileMetadata = {
      id: Date.now().toString(),
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: filePath,
      uploadedAt: new Date().toISOString(),
      userId: req.user.userId,
      rowCount: results.length,
      columnCount: headers.length,
      headers,
      columnInfo
    };

    // Save metadata to file (in production, use a database)
    const metadataPath = path.join(process.env.UPLOAD_DIR || './uploads', 'metadata.json');
    let allMetadata = [];
    
    try {
      const existingData = fs.readFileSync(metadataPath, 'utf8');
      allMetadata = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist yet
    }

    allMetadata.push(fileMetadata);
    fs.writeFileSync(metadataPath, JSON.stringify(allMetadata, null, 2));

    res.json({
      message: 'File uploaded successfully',
      fileId: fileMetadata.id,
      filename: fileMetadata.originalName,
      rowCount: fileMetadata.rowCount,
      columnCount: fileMetadata.columnCount,
      headers: fileMetadata.headers,
      columnInfo: fileMetadata.columnInfo
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: { message: 'Failed to process CSV file' } });
  }
});

// Get uploaded files for user
router.get('/files', authMiddleware, (req, res) => {
  try {
    const metadataPath = path.join(process.env.UPLOAD_DIR || './uploads', 'metadata.json');
    
    let allMetadata = [];
    try {
      const existingData = fs.readFileSync(metadataPath, 'utf8');
      allMetadata = JSON.parse(existingData);
    } catch (error) {
      return res.json({ files: [] });
    }

    const userFiles = allMetadata.filter(file => file.userId === req.user.userId);
    
    res.json({
      files: userFiles.map(file => ({
        id: file.id,
        originalName: file.originalName,
        uploadedAt: file.uploadedAt,
        rowCount: file.rowCount,
        columnCount: file.columnCount,
        headers: file.headers,
        columnInfo: file.columnInfo
      }))
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve files' } });
  }
});

// Get specific file data
router.get('/files/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const metadataPath = path.join(process.env.UPLOAD_DIR || './uploads', 'metadata.json');
    
    let allMetadata = [];
    try {
      const existingData = fs.readFileSync(metadataPath, 'utf8');
      allMetadata = JSON.parse(existingData);
    } catch (error) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    const fileMetadata = allMetadata.find(file => file.id === fileId && file.userId === req.user.userId);
    
    if (!fileMetadata) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    // Read and parse the CSV data
    const results = [];
    const parsePromise = new Promise((resolve, reject) => {
      fs.createReadStream(fileMetadata.path)
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    await parsePromise;

    res.json({
      fileInfo: {
        id: fileMetadata.id,
        originalName: fileMetadata.originalName,
        uploadedAt: fileMetadata.uploadedAt,
        rowCount: fileMetadata.rowCount,
        columnCount: fileMetadata.columnCount,
        headers: fileMetadata.headers,
        columnInfo: fileMetadata.columnInfo
      },
      data: results
    });

  } catch (error) {
    console.error('Get file data error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve file data' } });
  }
});

module.exports = router;
