import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RadarRoundedIcon from '@mui/icons-material/RadarRounded';
import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useState } from 'react';

const stages = [
  'Resolving merchant identity',
  'Reading purchase conditions',
  'Inspecting pricing signals',
  'Checking return and renewal terms',
  'Building your evidence map',
];

export function ScanProgress() {
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(96, current + Math.floor(Math.random() * 9) + 4));
    }, 260);

    return () => window.clearInterval(timer);
  }, []);

  const completedCount = Math.min(stages.length, Math.floor((progress / 100) * (stages.length + 0.35)));

  return (
    <Box
      sx={{
        mt: 4,
        width: '100%',
        border: `1px solid ${alpha('#9D7BFF', 0.16)}`,
        borderRadius: 5,
        bgcolor: alpha('#0D1016', 0.72),
        boxShadow: '0 28px 90px rgba(0,0,0,.32)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(110deg, transparent 0%, rgba(157,123,255,.05) 43%, rgba(97,244,213,.08) 50%, rgba(157,123,255,.05) 57%, transparent 100%)',
          transform: 'translateX(-100%)',
          animation: 'scanSweep 1.7s linear infinite',
          '@keyframes scanSweep': {
            to: { transform: 'translateX(100%)' },
          },
        }}
      />

      <Stack spacing={3} sx={{ p: { xs: 2.4, sm: 3.2 }, position: 'relative' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha('#9D7BFF', 0.12),
                color: 'primary.main',
              }}
            >
              <RadarRoundedIcon sx={{ animation: 'pulseRadar 1.2s ease-in-out infinite' }} />
            </Box>
            <Box>
              <Typography fontWeight={700}>Analyzing transaction</Typography>
              <Typography variant="body2" color="text.secondary">
                Cross-checking the signals that matter
              </Typography>
            </Box>
          </Stack>
          <Typography sx={{ fontFamily: 'Manrope', fontWeight: 700, color: 'secondary.main' }}>
            {progress}%
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 999,
            bgcolor: alpha('#ffffff', 0.05),
            '& .MuiLinearProgress-bar': {
              borderRadius: 999,
              background: 'linear-gradient(90deg, #9D7BFF 0%, #61F4D5 100%)',
              boxShadow: '0 0 20px rgba(97,244,213,.28)',
            },
          }}
        />

        <Stack spacing={1.3}>
          {stages.map((stage, index) => {
            const complete = index < completedCount;
            return (
              <Stack key={stage} direction="row" alignItems="center" spacing={1.2}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '50%',
                    border: `1px solid ${complete ? alpha('#61F4D5', 0.35) : alpha('#ffffff', 0.08)}`,
                    bgcolor: complete ? alpha('#61F4D5', 0.08) : 'transparent',
                    color: complete ? 'secondary.main' : 'text.secondary',
                    transition: 'all .25s ease',
                  }}
                >
                  {complete ? <CheckRoundedIcon sx={{ fontSize: 15 }} /> : <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'currentColor' }} />}
                </Box>
                <Typography variant="body2" color={complete ? 'text.primary' : 'text.secondary'}>
                  {stage}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
}
