const mongoose = require('mongoose');

const plotSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Plot title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  plotType: {
    type: String,
    required: true,
    enum: ['scatter', 'line', 'bar', 'histogram'],
    lowercase: true
  },
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    required: true
  },
  xAxis: {
    type: String,
    required: [true, 'X-axis column is required']
  },
  yAxis: {
    type: String,
    required: function() {
      return ['scatter', 'line'].includes(this.plotType);
    }
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
plotSchema.index({ createdBy: 1, createdAt: -1 });
plotSchema.index({ datasetId: 1 });

module.exports = mongoose.model('Plot', plotSchema);
