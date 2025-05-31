import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme.tsx';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <ThemeProvider>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <BrowserRouter basename="/media-tracker">
        <App />
      </BrowserRouter>
    </LocalizationProvider>
  </ThemeProvider>
); 