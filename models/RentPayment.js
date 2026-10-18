const mongoose = require('mongoose');

const rentPaymentSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  period: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, enum: ['INR', 'USD', 'AED', 'GBP'], default: 'INR' },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'paid', 'late'], default: 'pending' },
  paidAt: { type: Date, default: null },
  paymentReference: { type: String, trim: true, maxlength: 120, default: '' }
}, { timestamps: true });

rentPaymentSchema.index({ tenant: 1, period: 1 }, { unique: true });

module.exports = mongoose.models.RentPayment || mongoose.model('RentPayment', rentPaymentSchema);