import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
// eslint-disable-next-line import/order
import ReactGA from 'react-ga';

// Initialize Google Analytics
const initializeAnalytics = () => {
  const trackingId = process.env.REACT_APP_GA_TRACKING_ID;
  if (trackingId) { // Ensure the tracking ID is present
    ReactGA.initialize(trackingId);
  } else {
    // eslint-disable-next-line no-console
    console.error('Google Analytics Tracking ID not found');
  }
};

initializeAnalytics();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
document.body.classList.add('background-color');

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
