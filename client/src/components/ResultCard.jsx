import React from 'react';
import {
  ShieldCheckIcon,
  HomeCollectionIcon,
  BuildingIcon,
  ClockIcon,
  SparklesIcon,
  PackageIcon,
  FlaskIcon
} from './Icons';

/**
 * Format currency with Indian grouping standard
 */
function formatCurrency(amount) {
  if (amount == null) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function ResultCard({ item, isLowest = false, searchedQuery = '' }) {
  const {
    provider_name,
    item_type,
    item_name,
    included_tests = [],
    pricing = {},
    logistics = {},
    nabl_accredited,
    total_final_price
  } = item;

  const { mrp = 0, offer_price = 0 } = pricing;
  const {
    home_collection = false,
    home_collection_fee = 0,
    report_tat_hours = 24
  } = logistics;

  // Calculate discount percentage
  const discountPercent =
    mrp > offer_price ? Math.round(((mrp - offer_price) / mrp) * 100) : 0;

  // Breakdown text determination
  let breakdownText = '';
  if (!home_collection) {
    breakdownText = 'Lab visit only (No home collection)';
  } else if (home_collection_fee === 0) {
    breakdownText = `${formatCurrency(offer_price)} + Free Home Collection`;
  } else {
    breakdownText = `${formatCurrency(offer_price)} + ${formatCurrency(home_collection_fee)} Home Collection`;
  }

  // Check if a tag in package matches the search query
  const cleanQuery = searchedQuery.trim().toLowerCase();
  const isTagMatch = (tag) => {
    if (!cleanQuery) return false;
    return tag.toLowerCase().includes(cleanQuery);
  };

  return (
    <article
      className={`result-card ${isLowest ? 'is-lowest' : ''}`}
      aria-label={`${item_name} by ${provider_name}`}
    >
      {/* Lowest Price Callout Badge */}
      {isLowest && (
        <div className="lowest-price-badge">
          <SparklesIcon size={12} />
          <span>Lowest Price</span>
        </div>
      )}

      {/* Top Badges Row */}
      <div className="card-top-row">
        <div className="card-badges">
          {item_type === 'package' ? (
            <span className="badge badge-package">
              <PackageIcon size={12} />
              Package
            </span>
          ) : (
            <span className="badge badge-test">
              <FlaskIcon size={12} />
              Single Test
            </span>
          )}

          {nabl_accredited && (
            <span className="badge badge-nabl" title="National Accreditation Board for Testing and Calibration Laboratories">
              <ShieldCheckIcon size={12} />
              NABL Certified
            </span>
          )}
        </div>
      </div>

      {/* Header Info: Provider & Item Name */}
      <div className="card-header-info">
        <div className="provider-name">
          <BuildingIcon size={15} />
          <span>{provider_name}</span>
        </div>
        <h3 className="item-title">{item_name}</h3>
      </div>

      {/* Package Included Tests (if package) */}
      {item_type === 'package' && included_tests.length > 0 && (
        <div className="included-tests-container">
          <span className="included-tests-label">
            Includes {included_tests.length} tests:
          </span>
          <div className="tests-tag-list">
            {included_tests.map((test, idx) => {
              const matched = isTagMatch(test);
              return (
                <span
                  key={idx}
                  className={`test-tag ${matched ? 'highlighted-tag' : ''}`}
                  title={matched ? `Matches your search for "${searchedQuery}"` : undefined}
                >
                  {test}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Logistics Row: Home Collection & TAT */}
      <div className="logistics-bar">
        <div className={`logistic-item ${home_collection ? 'active' : ''}`}>
          {home_collection ? (
            <>
              <HomeCollectionIcon size={16} />
              <span>
                {home_collection_fee === 0
                  ? 'Free Home Collection'
                  : `Home Collection: ${formatCurrency(home_collection_fee)}`}
              </span>
            </>
          ) : (
            <>
              <BuildingIcon size={16} />
              <span>Lab Visit Only</span>
            </>
          )}
        </div>

        <div className="logistic-item active">
          <ClockIcon size={15} />
          <span>Report in {report_tat_hours} hrs</span>
        </div>
      </div>

      {/* Pricing Matrix */}
      <div className="pricing-footer">
        <div className="price-row-top">
          {mrp > offer_price && (
            <span className="mrp-strikethrough">{formatCurrency(mrp)}</span>
          )}
          <span className="offer-price">Offer: {formatCurrency(offer_price)}</span>
          {discountPercent > 0 && (
            <span className="discount-pill">{discountPercent}% OFF</span>
          )}
        </div>

        <div className="total-price-box">
          <div>
            <div className="total-price-value">
              {formatCurrency(total_final_price)}
            </div>
            <div className="price-breakdown-caption">{breakdownText}</div>
          </div>
        </div>
      </div>
    </article>
  );
}
