import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RadarRoundedIcon from '@mui/icons-material/RadarRounded';

import {
  Box,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import {
  useEffect,
  useState,
} from 'react';

const stages = [
  'Resolving merchant identity',
  'Inspecting page structure',
  'Extracting product and pricing data',
  'Discovering policy pages',
  'Reading return and warranty terms',
  'Checking recurring commitments',
  'Building evidence profile',
];

export function ScanProgress() {
  const [
    progress,
    setProgress,
  ] = useState(6);

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setProgress(
            (current) => {
              if (
                current >= 94
              ) {
                return 94;
              }

              const remaining =
                94 -
                current;

              return Math.min(
                94,

                current +
                  Math.max(
                    1,

                    Math.ceil(
                      remaining *
                        0.09,
                    ),
                  ),
              );
            },
          );
        },

        240,
      );

    return () =>
      window.clearInterval(
        timer,
      );
  }, []);

  const completedCount =
    Math.min(
      stages.length - 1,

      Math.floor(
        (
          progress /
          100
        ) *
          stages.length,
      ),
    );

  const activeStage =
    Math.min(
      stages.length - 1,
      completedCount,
    );

  return (
    <Box
      sx={{
        mt: 4,

        width:
          '100%',

        border:
          `1px solid ${alpha(
            '#9D7BFF',
            0.17,
          )}`,

        borderRadius:
          5,

        bgcolor:
          alpha(
            '#090C12',
            0.82,
          ),

        boxShadow:
          '0 32px 110px rgba(0,0,0,.38), 0 0 90px rgba(157,123,255,.05)',

        overflow:
          'hidden',

        position:
          'relative',
      }}
    >
      <Box
        sx={{
          position:
            'absolute',

          inset: 0,

          opacity:
            0.4,

          backgroundImage:
            'linear-gradient(rgba(157,123,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(157,123,255,.035) 1px, transparent 1px)',

          backgroundSize:
            '34px 34px',

          maskImage:
            'linear-gradient(to bottom, black, transparent 88%)',
        }}
      />

      <Box
        sx={{
          position:
            'absolute',

          top: 0,
          bottom: 0,

          width:
            '32%',

          background:
            'linear-gradient(90deg, transparent, rgba(97,244,213,.07), transparent)',

          transform:
            'translateX(-120%)',

          animation:
            'intelligenceSweep 2.25s linear infinite',

          '@keyframes intelligenceSweep':
            {
              to: {
                transform:
                  'translateX(420%)',
              },
            },
        }}
      />

      <Stack
        spacing={3}
        sx={{
          p: {
            xs: 2.4,
            sm: 3.2,
          },

          position:
            'relative',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
        >
          <Stack
            direction="row"
            spacing={1.4}
            alignItems="center"
          >
            <Box
              sx={{
                width:
                  48,

                height:
                  48,

                borderRadius:
                  '16px',

                display:
                  'grid',

                placeItems:
                  'center',

                bgcolor:
                  alpha(
                    '#9D7BFF',
                    0.105,
                  ),

                color:
                  'primary.main',

                border:
                  `1px solid ${alpha(
                    '#9D7BFF',
                    0.18,
                  )}`,

                position:
                  'relative',

                '&::before':
                  {
                    content:
                      '""',

                    position:
                      'absolute',

                    inset:
                      -7,

                    borderRadius:
                      '20px',

                    border:
                      `1px solid ${alpha(
                        '#61F4D5',
                        0.12,
                      )}`,

                    animation:
                      'scannerPulse 1.7s ease-out infinite',
                  },

                '@keyframes scannerPulse':
                  {
                    '0%': {
                      transform:
                        'scale(.82)',

                      opacity:
                        0,
                    },

                    '45%': {
                      opacity:
                        1,
                    },

                    '100%': {
                      transform:
                        'scale(1.24)',

                      opacity:
                        0,
                    },
                  },

                '@keyframes radarTurn':
                  {
                    to: {
                      transform:
                        'rotate(360deg)',
                    },
                  },
              }}
            >
              <RadarRoundedIcon
                sx={{
                  animation:
                    'radarTurn 2.4s linear infinite',
                }}
              />
            </Box>

            <Box
              sx={{
                textAlign:
                  'left',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color:
                    'secondary.main',

                  letterSpacing:
                    '.12em',
                }}
              >
                BACKSTOP INTELLIGENCE ENGINE
              </Typography>

              <Typography
                fontWeight={
                  700
                }
                sx={{
                  mt: 0.2,
                }}
              >
                Investigating the transaction
              </Typography>
            </Box>
          </Stack>

          <Typography
            sx={{
              fontFamily:
                'Manrope',

              fontWeight:
                700,

              color:
                'secondary.main',

              fontVariantNumeric:
                'tabular-nums',
            }}
          >
            {String(
              progress,
            ).padStart(
              2,
              '0',
            )}
            %
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height:
              5,

            borderRadius:
              999,

            bgcolor:
              alpha(
                '#ffffff',
                0.045,
              ),

            '& .MuiLinearProgress-bar':
              {
                borderRadius:
                  999,

                background:
                  'linear-gradient(90deg, #9D7BFF 0%, #61F4D5 100%)',

                boxShadow:
                  '0 0 24px rgba(97,244,213,.3)',
              },
          }}
        />

        <Stack
          spacing={1.15}
        >
          {stages.map(
            (
              stage,
              index,
            ) => {
              const complete =
                index <
                completedCount;

              const active =
                index ===
                activeStage;

              return (
                <Stack
                  key={
                    stage
                  }
                  direction="row"
                  alignItems="center"
                  spacing={
                    1.2
                  }
                  sx={{
                    opacity:
                      complete ||
                      active
                        ? 1
                        : 0.48,

                    transition:
                      'opacity .25s ease',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      width:
                        22,

                      color:
                        active
                          ? 'primary.main'
                          : 'text.secondary',

                      fontVariantNumeric:
                        'tabular-nums',
                    }}
                  >
                    {String(
                      index +
                        1,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </Typography>

                  <Box
                    sx={{
                      width:
                        24,

                      height:
                        24,

                      display:
                        'grid',

                      placeItems:
                        'center',

                      borderRadius:
                        '50%',

                      border:
                        `1px solid ${
                          complete
                            ? alpha(
                                '#61F4D5',
                                0.34,
                              )
                            : active
                              ? alpha(
                                  '#9D7BFF',
                                  0.42,
                                )
                              : alpha(
                                  '#ffffff',
                                  0.08,
                                )
                        }`,

                      bgcolor:
                        complete
                          ? alpha(
                              '#61F4D5',
                              0.08,
                            )
                          : active
                            ? alpha(
                                '#9D7BFF',
                                0.08,
                              )
                            : 'transparent',

                      color:
                        complete
                          ? 'secondary.main'
                          : active
                            ? 'primary.main'
                            : 'text.secondary',

                      transition:
                        'all .25s ease',
                    }}
                  >
                    {complete ? (
                      <CheckRoundedIcon
                        sx={{
                          fontSize:
                            15,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width:
                            active
                              ? 6
                              : 4,

                          height:
                            active
                              ? 6
                              : 4,

                          borderRadius:
                            '50%',

                          bgcolor:
                            'currentColor',

                          boxShadow:
                            active
                              ? '0 0 12px currentColor'
                              : 'none',
                        }}
                      />
                    )}
                  </Box>

                  <Typography
                    variant="body2"
                    color={
                      complete ||
                      active
                        ? 'text.primary'
                        : 'text.secondary'
                    }
                  >
                    {stage}
                  </Typography>
                </Stack>
              );
            },
          )}
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            textAlign:
              'left',
          }}
        >
          Some stores block automated inspection or render checkout data only inside a browser. Backstop will tell you when evidence is incomplete.
        </Typography>
      </Stack>
    </Box>
  );
}