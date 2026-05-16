import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#141414',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6b7280',
      contrastText: '#ffffff',
    },
    brand: {
      main: '#e31837',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#111111',
      secondary: '#525252',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    hero: {
      fontSize: 'clamp(2rem, 4vw, 3.25rem)',
      fontWeight: 700,
      lineHeight: 1.08,
      letterSpacing: '-0.03em',
      color: '#111111',
    },
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.12,
    },
    h2: {
      fontSize: '1.375rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#000000',
          },
        },
        outlined: {
          borderWidth: 1.5,
          borderColor: '#141414',
          color: '#141414',
          '&:hover': {
            borderWidth: 1.5,
            borderColor: '#000000',
            backgroundColor: 'rgba(0,0,0,0.04)',
          },
        },
        outlinedInherit: {
          borderColor: 'rgba(0,0,0,0.22)',
          color: '#141414',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
  },
})
