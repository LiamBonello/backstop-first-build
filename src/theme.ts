import { alpha, createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#06070A',
      paper: '#0D1016',
    },
    primary: {
      main: '#9D7BFF',
    },
    secondary: {
      main: '#61F4D5',
    },
    text: {
      primary: '#F7F8FB',
      secondary: '#9DA6B5',
    },
    success: {
      main: '#60E6B7',
    },
    warning: {
      main: '#FFCA68',
    },
    error: {
      main: '#FF6B81',
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: 'DM Sans, system-ui, sans-serif',
    h1: {
      fontFamily: 'Manrope, DM Sans, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.055em',
    },
    h2: {
      fontFamily: 'Manrope, DM Sans, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h3: {
      fontFamily: 'Manrope, DM Sans, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.035em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { scrollBehavior: 'smooth' },
        body: { overflowX: 'hidden' },
        '*': { boxSizing: 'border-box' },
        '@media (prefers-reduced-motion: reduce)': {
          '*': {
            animationDuration: '0.001ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.001ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          border: `1px solid ${alpha('#ffffff', 0.08)}`,
        },
      },
    },
  },
});
