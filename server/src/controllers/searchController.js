const LabItem = require('../models/LabItem');

/**
 * Escapes regex special characters to prevent ReDoS and query syntax injection.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Search lab items by test name / package content and pincode.
 * Ranks results by true lowest final price: offer_price + (home_collection ? home_collection_fee : 0)
 */
async function searchLabs(req, res) {
  try {
    const { search_query, pincode } = req.query;

    // Validate search_query
    if (!search_query || typeof search_query !== 'string' || search_query.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required and cannot be empty.'
      });
    }

    const trimmedQuery = search_query.trim();
    if (trimmedQuery.length > 100) {
      return res.status(400).json({
        error: 'Search query cannot exceed 100 characters.'
      });
    }

    // Validate pincode: exactly 6 digits
    if (!pincode || typeof pincode !== 'string') {
      return res.status(400).json({
        error: 'Pincode is required.'
      });
    }

    const trimmedPincode = pincode.trim();
    if (!/^\d{6}$/.test(trimmedPincode)) {
      return res.status(400).json({
        error: 'Pincode must be exactly 6 digits.'
      });
    }

    const sanitizedQuery = escapeRegex(trimmedQuery);
    const searchRegex = new RegExp(sanitizedQuery, 'i');

    // MongoDB Aggregation Pipeline matching PRD specification
    const pipeline = [
      {
        $match: {
          available_pincodes: trimmedPincode,
          $or: [
            { item_name: { $regex: searchRegex } },
            { included_tests: { $regex: searchRegex } }
          ]
        }
      },
      {
        $addFields: {
          total_final_price: {
            $add: [
              '$pricing.offer_price',
              {
                $cond: [
                  {
                    $and: [
                      '$logistics.home_collection',
                      { $gt: ['$logistics.home_collection_fee', 0] }
                    ]
                  },
                  '$logistics.home_collection_fee',
                  0
                ]
              }
            ]
          }
        }
      },
      {
        $sort: {
          total_final_price: 1,
          'logistics.report_tat_hours': 1,
          provider_name: 1
        }
      },
      {
        $project: {
          _id: 0,
          __v: 0
        }
      }
    ];

    const results = await LabItem.aggregate(pipeline);

    return res.status(200).json({
      query: trimmedQuery,
      pincode: trimmedPincode,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Error during lab search:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred while processing your search.'
    });
  }
}

module.exports = {
  searchLabs,
  escapeRegex
};
