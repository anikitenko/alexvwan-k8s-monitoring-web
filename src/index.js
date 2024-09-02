import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios';

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-flow-renderer/dist/style.css';
import ErrorHandlingToast from "./ErrorHandlingToast";

axios.defaults.baseURL = 'https://localhost';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'xmlhttprequest';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
      <ErrorHandlingToast>
        <App />
      </ErrorHandlingToast>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);
