const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, required: true, trim: true },
  leaseStart: { type: Date, required: true },
  leaseEnd: { type: Date, required: true },
  monthlyRent: { type: Number, required: true, min: 0 },
  securityDeposit: { type: Number, min: 0, default: 0 },
  currency: { type: String, enum: ['INR', 'USD', 'AED', 'GBP'], default: 'INR' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

tenantSchema.pre('validate', function () {
  if (this.leaseStart && this.leaseEnd && this.leaseEnd <= this.leaseStart) {
    this.invalidate('leaseEnd', 'Lease end must be after lease start');
  }
});

module.exports = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);