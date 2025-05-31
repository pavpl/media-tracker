import React, { useMemo, useState, createContext, useContext, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';

const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const colorMode = useMemo(() => ({
    toggleColorMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
  }), []);
  const theme = useMemo(() => createTheme({
    palette: { mode },
    shape: { borderRadius: 12 },
  }), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}; 