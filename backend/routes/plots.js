const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Generate plot data
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { fileId, xAxis, yAxis, plotType = 'scatter' } = req.body;

    if (!fileId || !xAxis || !yAxis) {
      return res.status(400).json({ 
        error: { message: 'fileId, xAxis, and yAxis are required' } 
      });
    }

    // Get file metadata
    const metadataPath = path.join(process.env.UPLOAD_DIR || './uploads', 'metadata.json');
    let allMetadata = [];
    
    try {
      const existingData = fs.readFileSync(metadataPath, 'utf8');
      allMetadata = JSON.parse(existingData);
    } catch (error) {
      return res.status(404).json({ error: { message: 'File metadata not found' } });
    }

    const fileMetadata = allMetadata.find(file => file.id === fileId && file.userId === req.user.userId);
    
    if (!fileMetadata) {
      return res.status(404).json({ error: { message: 'File not found or access denied' } });
    }

    // Validate columns exist
    if (!fileMetadata.headers.includes(xAxis) || !fileMetadata.headers.includes(yAxis)) {
      return res.status(400).json({ 
        error: { message: 'Invalid column names' } 
      });
    }

    // Read CSV data
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

    // Process data for plotting
    const plotData = results.map(row => {
      let xValue = row[xAxis];
      let yValue = row[yAxis];

      // Convert to numbers if possible
      if (!isNaN(xValue) && !isNaN(parseFloat(xValue))) {
        xValue = parseFloat(xValue);
      }
      if (!isNaN(yValue) && !isNaN(parseFloat(yValue))) {
        yValue = parseFloat(yValue);
      }

      return { x: xValue, y: yValue };
    }).filter(point => point.x !== '' && point.y !== '' && point.x !== null && point.y !== null);

    // Generate plot configuration based on data types
    const xColumnInfo = fileMetadata.columnInfo[xAxis];
    const yColumnInfo = fileMetadata.columnInfo[yAxis];

    let plotConfig = {
      type: plotType,
      data: plotData,
      xAxis: {
        column: xAxis,
        type: xColumnInfo.type,
        label: xAxis
      },
      yAxis: {
        column: yAxis,
        type: yColumnInfo.type,
        label: yAxis
      }
    };

    // Add specific configurations based on plot type and data types
    if (plotType === 'bar' && xColumnInfo.type === 'categorical') {
      // Group data for bar chart
      const groupedData = {};
      plotData.forEach(point => {
        if (!groupedData[point.x]) {
          groupedData[point.x] = [];
        }
        groupedData[point.x].push(point.y);
      });

      // Calculate aggregated values (mean for numeric, count for categorical)
      const aggregatedData = Object.keys(groupedData).map(key => ({
        x: key,
        y: yColumnInfo.type === 'numeric' 
          ? groupedData[key].reduce((sum, val) => sum + val, 0) / groupedData[key].length
          : groupedData[key].length
      }));

      plotConfig.data = aggregatedData;
      plotConfig.aggregation = yColumnInfo.type === 'numeric' ? 'mean' : 'count';
    }

    res.json({
      message: 'Plot data generated successfully',
      plotConfig,
      dataPoints: plotData.length
    });

  } catch (error) {
    console.error('Plot generation error:', error);
    res.status(500).json({ error: { message: 'Failed to generate plot data' } });
  }
});

// Get available plot types based on column types
router.get('/types/:fileId', authMiddleware, (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get file metadata
    const metadataPath = path.join(process.env.UPLOAD_DIR || './uploads', 'metadata.json');
    let allMetadata = [];
    
    try {
      const existingData = fs.readFileSync(metadataPath, 'utf8');
      allMetadata = JSON.parse(existingData);
    } catch (error) {
      return res.status(404).json({ error: { message: 'File metadata not found' } });
    }

    const fileMetadata = allMetadata.find(file => file.id === fileId && file.userId === req.user.userId);
    
    if (!fileMetadata) {
      return res.status(404).json({ error: { message: 'File not found or access denied' } });
    }

    const numericColumns = fileMetadata.headers.filter(header => 
      fileMetadata.columnInfo[header].type === 'numeric'
    );
    const categoricalColumns = fileMetadata.headers.filter(header => 
      fileMetadata.columnInfo[header].type === 'categorical'
    );

    const availableTypes = [
      {
        type: 'scatter',
        name: 'Scatter Plot',
        description: 'Shows relationship between two numeric variables',
        requirements: 'Two numeric columns',
        enabled: numericColumns.length >= 2
      },
      {
        type: 'line',
        name: 'Line Chart',
        description: 'Shows trends over time or ordered data',
        requirements: 'Two numeric columns (x-axis should be ordered)',
        enabled: numericColumns.length >= 2
      },
      {
        type: 'bar',
        name: 'Bar Chart',
        description: 'Compares categories or shows distribution',
        requirements: 'One categorical and one numeric column',
        enabled: categoricalColumns.length >= 1 && numericColumns.length >= 1
      },
      {
        type: 'histogram',
        name: 'Histogram',
        description: 'Shows distribution of a numeric variable',
        requirements: 'One numeric column',
        enabled: numericColumns.length >= 1
      }
    ];

    res.json({
      availableTypes,
      columnInfo: {
        numeric: numericColumns,
        categorical: categoricalColumns,
        all: fileMetadata.headers
      }
    });

  } catch (error) {
    console.error('Get plot types error:', error);
    res.status(500).json({ error: { message: 'Failed to get available plot types' } });
  }
});

module.exports = router;
