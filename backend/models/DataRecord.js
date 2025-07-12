const mongoose = require('mongoose');

const dataRecordSchema = new mongoose.Schema({
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
dataRecordSchema.index({ datasetId: 1 });

module.exports = mongoose.model('DataRecord', dataRecordSchema);
