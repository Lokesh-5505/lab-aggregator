import React, { useState, useRef } from 'react';
import Header from './components/Header';
import SearchForm from './components/SearchForm';
import ResultsList from './components/ResultsList';
import StatusMessage from './components/StatusMessage';
import { searchLabItems } from './api';
import './styles.css';

export default function App() {
  const [results, setResults] = useState([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentPincode, setCurrentPincode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const abortControllerRef = useRef(null);

  const handleSearch = async (query, pincode) => {
    // Abort previous inflight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setCurrentQuery(query);
    setCurrentPincode(pincode);
    setIsLoading(true);
    setErrorMessage('');
    setHasSearched(true);

    try {
      const data = await searchLabItems(query, pincode, abortController.signal);
      setResults(data.results || []);
    } catch (err) {
      if (err.name === 'AbortError') {
        // Silently ignore aborted requests
        return;
      }
      console.error('Search request failed:', err);
      setErrorMessage(err.message || 'Failed to fetch search results.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (currentQuery && currentPincode) {
      handleSearch(currentQuery, currentPincode);
    }
  };

  // Determine current UI status state
  let uiState = 'initial';
  if (isLoading) {
    uiState = 'loading';
  } else if (errorMessage) {
    uiState = 'error';
  } else if (hasSearched && results.length === 0) {
    uiState = 'empty';
  }

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-tag">
            <span>Transparent Lab Pricing</span>
          </div>
          <h2 className="hero-title">
            Find the <span className="highlight">True Lowest Price</span> for Your Lab Test
          </h2>
          <p className="hero-subtitle">
            Compare standalone tests and health packages across accredited diagnostic centres.
            Prices always include home collection fees.
          </p>
        </section>

        {/* Search Form */}
        <SearchForm
          onSearch={handleSearch}
          isLoading={isLoading}
          initialQuery={currentQuery}
          initialPincode={currentPincode}
        />

        {/* Results Area */}
        {hasSearched && !isLoading && !errorMessage && results.length > 0 ? (
          <ResultsList
            results={results}
            query={currentQuery}
            pincode={currentPincode}
          />
        ) : (
          <StatusMessage
            state={uiState}
            query={currentQuery}
            pincode={currentPincode}
            errorMessage={errorMessage}
            onRetry={handleRetry}
          />
        )}
      </main>
    </div>
  );
}
