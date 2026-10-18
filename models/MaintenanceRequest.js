const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 4000 },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'cancelled'], default: 'open' },
  cost: { type: Number, min: 0, default: 0 },
  currency: { type: String, enum: ['INR', 'USD', 'AED', 'GBP'], default: 'INR' },
  vendorName: { type: String, trim: true, maxlength: 120, default: '' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resolvedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.models.MaintenanceRequest || mongoose.model('MaintenanceRequest', maintenanceRequestSchema);