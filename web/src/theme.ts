import { createTheme, type ThemeOptions } from '@mui/material/styles';

const baseOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: { fontSize: '2rem',    fontWeight: 700 },
    h2: { fontSize: '1.5rem',  fontWeight: 700 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1.125rem',fontWeight: 600 },
    h5: { fontSize: '1rem',    fontWeight: 600 },
    h6: { fontSize: '0.875rem',fontWeight: 600 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight:    600,
          borderRadius:  8,
        },
      },
      defaultProps: { disableElevation: true },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, fontSize: '0.8125rem' },
        body: { fontSize: '0.8125rem' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
  },
};

export const lightTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: 'light',
    primary:   { main: '#01696f', light: '#4f98a3', dark: '#0c4e54' },
    secondary: { main: '#437a22' },
    error:     { main: '#a12c7b' },
    warning:   { main: '#964219' },
    success:   { main: '#437a22' },
    background: {
      default: '#f7f6f2',
      paper:   '#ffffff',
    },
    text: {
      primary:   '#28251d',
      secondary: '#7a7974',
      disabled:  '#bab9b4',
    },
    divider: '#dcd9d5',
  },
});

export const darkTheme = createTheme({
  ...baseOptions,
  palette: {
    mode: 'dark',
    primary:   { main: '#4f98a3', light: '#7fc4cd', dark: '#227f8b' },
    secondary: { main: '#6daa45' },
    error:     { main: '#d163a7' },
    warning:   { main: '#bb653b' },
    success:   { main: '#6daa45' },
    background: {
      default: '#171614',
      paper:   '#1c1b19',
    },
    text: {
      primary:   '#cdccca',
      secondary: '#797876',
      disabled:  '#5a5957',
    },
    divider: '#262523',
  },
});