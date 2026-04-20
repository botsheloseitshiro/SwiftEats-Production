import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Find the root DOM element (defined in public/index.html)
const root = ReactDOM.createRoot(document.getElementById('root'));

// Mount the entire React application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
