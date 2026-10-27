import React from 'react';
import ReactDOM from 'react-dom/client';
import CabinApp from './App';
import './styles/cabinTheme.css';

ReactDOM.createRoot(document.getElementById('driver-root')).render(
  <React.StrictMode>
    <CabinApp />
  </React.StrictMode>
);
