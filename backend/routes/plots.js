const express = require('express');
const { protect } = require('../middleware/auth');
const Dataset = require('../models/Dataset');
const DataRecord = require('../models/DataRecord');
const Plot = require('../models/Plot');

const router = express.Router();

// @desc    Generate plot data
// @route   POST /api/plots/generate
// @access  Private
router.post('/generate', protect, async (req, res) => {
  try {
    const { datasetId, plotType, xAxis, yAxis, title, filters } = req.body;

    // Validate input
    if (!datasetId || !plotType || !xAxis) {
      return res.status(400).json({
        success: false,
        message: 'Dataset ID, plot type, and X-axis are required'
      });
    }

    // Verify dataset ownership
    const dataset = await Dataset.findOne({
      _id: datasetId,
      uploadedBy: req.user.id
    });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'Dataset not found'
      });
    }

    // Build query for data filtering
    let query = { datasetId };
    if (filters && Object.keys(filters).length > 0) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined && value !== '') {
          query[`data.${key}`] = value;
        }
      }
    }

    // Fetch data records
    const dataRecords = await DataRecord.find(query).select('data');
    const data = dataRecords.map(record => record.data);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data found for the specified criteria'
      });
    }

    // Process data based on plot type
    let plotData;
    switch (plotType) {
      case 'scatter':
        if (!yAxis) {
          return res.status(400).json({
            success: false,
            message: 'Y-axis is required for scatter plot'
          });
        }
        plotData = data
          .filter(row => row[xAxis] !== null && row[yAxis] !== null)
          .map(row => ({
            x: row[xAxis],
            y: row[yAxis]
          }));
        break;

      case 'line':
        if (!yAxis) {
          return res.status(400).json({
            success: false,
            message: 'Y-axis is required for line plot'
          });
        }
        plotData = data
          .filter(row => row[xAxis] !== null && row[yAxis] !== null)
          .sort((a, b) => a[xAxis] - b[xAxis])
          .map(row => ({
            x: row[xAxis],
            y: row[yAxis]
          }));
        break;

      case 'bar':
        // Group data by x-axis values and count or sum
        const groupedData = {};
        data.forEach(row => {
          const key = row[xAxis];
          if (key !== null && key !== undefined) {
            if (!groupedData[key]) {
              groupedData[key] = yAxis ? [] : 0;
            }
            if (yAxis) {
              if (row[yAxis] !== null) groupedData[key].push(row[yAxis]);
            } else {
              groupedData[key]++;
            }
          }
        });

        plotData = Object.entries(groupedData).map(([key, values]) => ({
          x: key,
          y: yAxis ? 
            (values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0) :
            values
        }));
        break;

      case 'histogram':
        const values = data
          .map(row => row[xAxis])
          .filter(val => typeof val === 'number' && !isNaN(val));
        
        if (values.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No numeric data found for histogram'
          });
        }

        // Create histogram bins
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
        const binWidth = (max - min) / binCount;
        
        const bins = Array(binCount).fill(0);
        values.forEach(value => {
          const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
          bins[binIndex]++;
        });

        plotData = bins.map((count, index) => ({
          x: min + (index + 0.5) * binWidth,
          y: count
        }));
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported plot type'
        });
    }

    // Save plot configuration
    const plot = await Plot.create({
      title: title || `${plotType} plot of ${xAxis}${yAxis ? ` vs ${yAxis}` : ''}`,
      plotType,
      datasetId,
      xAxis,
      yAxis,
      filters,
      createdBy: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Plot data generated successfully',
      plot: {
        id: plot._id,
        title: plot.title,
        plotType: plot.plotType,
        xAxis: plot.xAxis,
        yAxis: plot.yAxis,
        createdAt: plot.createdAt
      },
      data: plotData,
      dataCount: data.length
    });
  } catch (error) {
    console.error('Generate plot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating plot'
    });
  }
});

// @desc    Get saved plots
// @route   GET /api/plots
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const plots = await Plot.find({ createdBy: req.user.id })
      .populate('datasetId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plots.length,
      plots: plots.map(plot => ({
        id: plot._id,
        title: plot.title,
        plotType: plot.plotType,
        xAxis: plot.xAxis,
        yAxis: plot.yAxis,
        dataset: plot.datasetId.name,
        createdAt: plot.createdAt
      }))
    });
  } catch (error) {
    console.error('Get plots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete plot
// @route   DELETE /api/plots/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const plot = await Plot.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!plot) {
      return res.status(404).json({
        success: false,
        message: 'Plot not found'
      });
    }

    await Plot.findByIdAndDelete(plot._id);

    res.status(200).json({
      success: true,
      message: 'Plot deleted successfully'
    });
  } catch (error) {
    console.error('Delete plot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
