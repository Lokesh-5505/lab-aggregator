import React from 'react';
import { AlertCircleIcon, SearchIcon, FlaskIcon } from './Icons';

export default function StatusMessage({
  state = 'initial',
  query = '',
  pincode = '',
  errorMessage = '',
  onRetry
}) {
  if (state === 'loading') {
    return (
      <div className="cards-grid" aria-busy="true" aria-label="Loading search results">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="skeleton-card">
            <div className="skeleton-shimmer skeleton-line w-30" />
            <div className="skeleton-shimmer skeleton-line w-70 h-24" />
            <div className="skeleton-shimmer skeleton-line w-90" />
            <div className="skeleton-shimmer skeleton-line w-50" />
            <div className="skeleton-shimmer skeleton-line w-50 h-36" style={{ marginTop: 'auto' }} />
          </div>
        ))}
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div className="state-box" role="status">
        <div className="state-icon-wrapper empty">
          <SearchIcon size={28} />
        </div>
        <h3 className="state-title">No Labs Found</h3>
        <p className="state-desc">
          No labs found for <strong>&ldquo;{query}&rdquo;</strong> serving pincode{' '}
          <strong>{pincode}</strong>.<br />
          Try checking another pincode or search for broader tests like <em>Lipid Profile</em> or <em>HbA1c</em>.
        </p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="state-box" role="alert">
        <div className="state-icon-wrapper error">
          <AlertCircleIcon size={28} />
        </div>
        <h3 className="state-title">Search Error</h3>
        <p className="state-desc">
          {errorMessage || 'Unable to fetch lab test results. Please check your network and try again.'}
        </p>
        {onRetry && (
          <button type="button" className="btn-retry" onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Initial State
  return (
    <div className="state-box">
      <div className="state-icon-wrapper initial">
        <FlaskIcon size={28} />
      </div>
      <h3 className="state-title">Search Diagnostic Tests & Packages</h3>
      <p className="state-desc">
        Enter a test name (e.g. <em>Lipid Profile</em>, <em>HbA1c</em>, <em>MRI Brain</em>) and your 6-digit pincode above to discover all available providers ranked by their true lowest final price.
      </p>
    </div>
  );
}
