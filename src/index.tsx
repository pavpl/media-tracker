import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
const basename = pathname.startsWith('/media-tracker') ? '/media-tracker' : '/';

root.render(
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
); 