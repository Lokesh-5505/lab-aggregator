const mongoose = require('mongoose');

const labItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    provider_name: {
      type: String,
      required: true,
      trim: true
    },
    item_type: {
      type: String,
      required: true,
      enum: ['test', 'package']
    },
    item_name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    included_tests: {
      type: [String],
      default: [],
      index: true
    },
    available_pincodes: {
      type: [String],
      default: [],
      index: true
    },
    pricing: {
      mrp: {
        type: Number,
        required: true,
        min: 0
      },
      offer_price: {
        type: Number,
        required: true,
        min: 0
      }
    },
    logistics: {
      home_collection: {
        type: Boolean,
        default: false
      },
      home_collection_fee: {
        type: Number,
        default: 0,
        min: 0
      },
      report_tat_hours: {
        type: Number,
        default: 24,
        min: 0
      }
    },
    nabl_accredited: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Multikey compound indexes for optimized search performance
labItemSchema.index({ available_pincodes: 1, item_name: 1 });
labItemSchema.index({ available_pincodes: 1, included_tests: 1 });

const LabItem = mongoose.model('LabItem', labItemSchema);

module.exports = LabItem;
