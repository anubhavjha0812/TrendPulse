import React from 'react';

// Same bar-loader animation as the full-page Loading state, sized to sit
// inline wherever a spinner is needed — buttons, modals, inline hints.
export const InlineLoader = ({ size = 18, label = 'Loading' }) => (
  <span className="loader-bars loader-bars-inline" style={{ width: size }} role="status" aria-label={label} />
);

const Loading = ({ label = 'Loading...' }) => (
  <div className="loading-state">
    <div className="loader-bars" role="status" aria-label={label} />
    <span>{label}</span>
  </div>
);

export default Loading;
