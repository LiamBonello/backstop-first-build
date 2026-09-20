import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

export function CursorGlow() {
  const [point, setPoint] = useState<Point>({ x: -500, y: -500 });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      setPoint({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        left: point.x,
        top: point.y,
        width: 420,
        height: 420,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: -1,
        background:
          'radial-gradient(circle, rgba(157,123,255,.085), rgba(97,244,213,.025) 38%, transparent 68%)',
        transition: 'left 80ms linear, top 80ms linear',
        '@media (pointer: coarse)': { display: 'none' },
      }}
    />
  );
}
