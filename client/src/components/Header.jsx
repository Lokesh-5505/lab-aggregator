import React from 'react';
import { FlaskIcon } from './Icons';

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="/" className="brand-wrapper">
          <div className="brand-icon">
            <FlaskIcon size={22} />
          </div>
          <div className="brand-info">
            <h1>LabAggregator</h1>
            <p>True Lowest Price Diagnostics</p>
          </div>
        </a>
      </div>
    </header>
  );
}
