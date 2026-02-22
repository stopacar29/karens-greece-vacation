import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TripProvider } from './context/TripContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <TripProvider>
        <App />
      </TripProvider>
    </BrowserRouter>
  </React.StrictMode>
);
