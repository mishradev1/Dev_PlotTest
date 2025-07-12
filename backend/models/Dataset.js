const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Dataset name is required'],
    trim: true,
    maxlength: [100, 'Dataset name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  columns: [{
    type: String,
    required: true
  }],
  rowCount: {
    type: Number,
    required: true,
    min: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
datasetSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Dataset', datasetSchema);
