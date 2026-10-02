import React from 'react';
import ResultCard from './ResultCard';

export default function ResultsList({ results = [], query = '', pincode = '' }) {
  if (!results || results.length === 0) return null;

  return (
    <section className="results-container" aria-label="Search Results">
      <div className="results-header">
        <div className="results-summary">
          <h2>
            Available Options
            <span className="count-pill">{results.length} found</span>
          </h2>
          <p className="results-sub">
            Showing tests and packages for <strong>&ldquo;{query}&rdquo;</strong> in pincode{' '}
            <strong>{pincode}</strong>
          </p>
        </div>

        <div className="results-sort-indicator">
          <span>Sorted by:</span>
          <strong>True Lowest Final Price (Ascending)</strong>
        </div>
      </div>

      <div className="cards-grid">
        {results.map((item, index) => (
          <ResultCard
            key={item.id || index}
            item={item}
            isLowest={index === 0}
            searchedQuery={query}
          />
        ))}
      </div>
    </section>
  );
}
