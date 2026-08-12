import React from 'react';
import { RefreshCw } from 'lucide-react';

const Loading = ({ label = 'Loading...' }) => (
  <div className="loading-state">
    <RefreshCw size={22} className="animate-spin text-primary" />
    <span>{label}</span>
  </div>
);

export default Loading;
