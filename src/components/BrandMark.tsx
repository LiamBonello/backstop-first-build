import { Box } from '@mui/material';

interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 34 }: BrandMarkProps) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: size,
        height: size,
        borderRadius: '11px',
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(145deg, rgba(157,123,255,.95), rgba(97,244,213,.88))',
        boxShadow:
          '0 0 28px rgba(157,123,255,.28), inset 0 1px 0 rgba(255,255,255,.55)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '6px',
          borderRadius: '7px',
          background: '#0A0C10',
          clipPath: 'polygon(0 0, 100% 0, 100% 45%, 50% 100%, 0 45%)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '35%',
          height: '35%',
          top: '24%',
          left: '32.5%',
          borderRadius: '50%',
          background: '#F7F8FB',
          boxShadow: '0 0 16px rgba(255,255,255,.65)',
        },
      }}
    />
  );
}
