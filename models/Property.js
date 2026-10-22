const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  line1: { type: String, required: true, trim: true },
  line2: { type: String, trim: true, default: '' },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, trim: true, default: 'India' }
}, { _id: false });

const propertySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  name: { type: String, required: true, trim: true, maxlength: 120 },
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'commercial', 'land', 'other'],
    default: 'apartment'
  },
  address: { type: addressSchema, required: true },
  monthlyRent: { type: Number, min: 0, default: 0 },
  listingPurpose: { type: String, enum: ['rent', 'sale'], default: 'rent' },
  askingPrice: { type: Number, min: 0, default: 0 },
  bedrooms: { type: Number, min: 0, max: 30, default: 0 },
  bathrooms: { type: Number, min: 0, max: 30, default: 0 },
  areaSqFt: { type: Number, min: 0, default: 0 },
  listingDescription: { type: String, trim: true, maxlength: 4000, default: '' },
  imageUrls: [{ type: String, trim: true, match: /^https?:\/\/.+/ }],
  amenities: [{ type: String, trim: true }],
  isPublished: { type: Boolean, default: false, index: true },
  isFeatured: { type: Boolean, default: false },
  currency: { type: String, enum: ['INR', 'USD', 'AED', 'GBP'], default: 'INR' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  status: { type: String, enum: ['vacant', 'occupied', 'maintenance'], default: 'vacant' },
  notes: { type: String, trim: true, maxlength: 2000, default: '' }
}, { timestamps: true });

propertySchema.pre('validate', function () {
  if (!this.isPublished) return;
  if (this.listingPurpose === 'sale' && !(this.askingPrice > 0)) {
    this.invalidate('askingPrice', 'A sale listing requires an asking price');
  }
  if (this.listingPurpose === 'rent' && !(this.monthlyRent > 0)) {
    this.invalidate('monthlyRent', 'A rental listing requires a monthly rent');
  }
  if (!this.listingDescription?.trim()) {
    this.invalidate('listingDescription', 'A public listing requires a description');
  }
});

module.exports = mongoose.models.Property || mongoose.model('Property', propertySchema);