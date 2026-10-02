import React, { useState, useEffect } from 'react';
import { SearchIcon, MapPinIcon, XIcon, AlertCircleIcon } from './Icons';

export default function SearchForm({
  onSearch,
  isLoading,
  initialQuery = '',
  initialPincode = ''
}) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [pincode, setPincode] = useState(initialPincode);
  const [queryError, setQueryError] = useState('');
  const [pincodeError, setPincodeError] = useState('');

  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setPincode(initialPincode);
  }, [initialPincode]);

  const validate = () => {
    let isValid = true;

    // Validate search query
    if (!searchQuery.trim()) {
      setQueryError('Please enter a test or health package name.');
      isValid = false;
    } else if (searchQuery.trim().length > 100) {
      setQueryError('Search query must be 100 characters or fewer.');
      isValid = false;
    } else {
      setQueryError('');
    }

    // Validate pincode
    const cleanPin = pincode.trim();
    if (!cleanPin) {
      setPincodeError('Please enter your 6-digit pincode.');
      isValid = false;
    } else if (!/^\d{6}$/.test(cleanPin)) {
      setPincodeError('Pincode must be exactly 6 digits.');
      isValid = false;
    } else {
      setPincodeError('');
    }

    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSearch(searchQuery.trim(), pincode.trim());
    }
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value;
    // Only allow numbers, max 6 digits
    if (/^\d{0,6}$/.test(val)) {
      setPincode(val);
      if (pincodeError) setPincodeError('');
    }
  };

  const handleQueryChange = (e) => {
    setSearchQuery(e.target.value);
    if (queryError) setQueryError('');
  };

  const handleChipClick = (queryText, pinText) => {
    setSearchQuery(queryText);
    setPincode(pinText);
    setQueryError('');
    setPincodeError('');
    onSearch(queryText, pinText);
  };

  return (
    <div className="search-card">
      <form onSubmit={handleSubmit} className="search-form" noValidate>
        {/* Test Name Input */}
        <div className="form-field">
          <label htmlFor="search-query-input" className="field-label">
            Test Name
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <SearchIcon size={18} />
            </span>
            <input
              id="search-query-input"
              type="text"
              className={`form-input ${queryError ? 'has-error' : ''}`}
              placeholder="e.g. Lipid Profile, HbA1c, MRI Brain"
              value={searchQuery}
              onChange={handleQueryChange}
              maxLength={100}
              autoComplete="off"
              disabled={isLoading}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear test name"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
          {queryError && (
            <div className="field-error" role="alert">
              <AlertCircleIcon size={14} />
              <span>{queryError}</span>
            </div>
          )}
        </div>

        {/* Pincode Input */}
        <div className="form-field field-pincode">
          <label htmlFor="pincode-input" className="field-label">
            Pincode
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <MapPinIcon size={18} />
            </span>
            <input
              id="pincode-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`form-input ${pincodeError ? 'has-error' : ''}`}
              placeholder="e.g. 110001"
              value={pincode}
              onChange={handlePincodeChange}
              maxLength={6}
              autoComplete="postal-code"
              disabled={isLoading}
            />
            {pincode && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setPincode('')}
                aria-label="Clear pincode"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
          {pincodeError && (
            <div className="field-error" role="alert">
              <AlertCircleIcon size={14} />
              <span>{pincodeError}</span>
            </div>
          )}
        </div>

        {/* Search Submit CTA */}
        <button
          id="search-submit-btn"
          type="submit"
          className="btn-search"
          disabled={isLoading}
        >
          {isLoading ? (
            <span>Searching...</span>
          ) : (
            <>
              <SearchIcon size={18} />
              <span>Search</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Suggestion Chips */}
      <div className="quick-chips-wrapper">
        <span className="quick-chips-label">Popular Searches:</span>
        <button
          type="button"
          className="chip-btn"
          onClick={() => handleChipClick('Lipid Profile', '110001')}
        >
          Lipid Profile (110001)
        </button>
        <button
          type="button"
          className="chip-btn"
          onClick={() => handleChipClick('Lipid Profile', '110002')}
        >
          Lipid Profile (110002)
        </button>
        <button
          type="button"
          className="chip-btn"
          onClick={() => handleChipClick('HbA1c', '110001')}
        >
          HbA1c (110001)
        </button>
        <button
          type="button"
          className="chip-btn"
          onClick={() => handleChipClick('MRI Brain', '560034')}
        >
          MRI Brain (560034)
        </button>
      </div>
    </div>
  );
}
