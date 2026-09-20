import { Box } from '@mui/material';

export function AmbientBackground() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -2,
        overflow: 'hidden',
        pointerEvents: 'none',
        background:
          'radial-gradient(circle at 50% -20%, rgba(78,62,118,.28), transparent 34%), #06070A',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '-20%',
          background:
            'radial-gradient(circle at 27% 32%, rgba(157,123,255,.16), transparent 20%), radial-gradient(circle at 73% 24%, rgba(97,244,213,.10), transparent 18%), radial-gradient(circle at 55% 74%, rgba(58,127,255,.08), transparent 24%)',
          filter: 'blur(12px)',
          animation: 'drift 16s ease-in-out infinite alternate',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          opacity: 0.28,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,.9), transparent 92%)',
        },
        '@keyframes drift': {
          '0%': { transform: 'translate3d(-2%, -2%, 0) scale(1)' },
          '100%': { transform: 'translate3d(2%, 2%, 0) scale(1.06)' },
        },
      }}
    />
  );
}
