import HubRoundedIcon from '@mui/icons-material/HubRounded';

import {
  Box,
  Stack,
  Typography,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import type {
  ScanSignal,
} from '../types/purchase';

interface TransactionProfileProps {
  signals: ScanSignal[];
}

const signalColor = (
  score: number,
): string => {
  if (score >= 70) {
    return '#61F4D5';
  }

  if (score >= 45) {
    return '#FFCA68';
  }

  return '#FF6B81';
};

export function TransactionProfile({
  signals,
}: TransactionProfileProps) {
  return (
    <Box
      sx={{
        p: 2.5,

        borderRadius:
          4,

        border:
          `1px solid ${alpha(
            '#9D7BFF',
            0.13,
          )}`,

        background:
          'linear-gradient(145deg, rgba(157,123,255,.075), rgba(9,12,17,.82) 42%, rgba(97,244,213,.025))',

        overflow:
          'hidden',

        position:
          'relative',
      }}
    >
      <Stack
        direction="row"
        spacing={1.1}
        sx={{
          alignItems: "center"
        }}
      >
        <HubRoundedIcon
          sx={{
            color:
              'primary.main',

            fontSize:
              20,
          }}
        />

        <Box>
          <Typography
            sx={{
              fontWeight: 700
            }}
          >
            Transaction profile
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: "text.secondary"
            }}
          >
            Stronger bars mean clearer or more favourable evidence.
          </Typography>
        </Box>
      </Stack>

      <Stack
        spacing={1.75}
        sx={{
          mt: 2.5,
        }}
      >
        {signals.map(
          (
            signal,
            index,
          ) => {
            const color =
              signalColor(
                signal.score,
              );

            return (
              <Box
                key={
                  signal.id
                }
                sx={{
                  animation:
                    `profileRowIn .45s ${
                      120 +
                      index *
                        70
                    }ms both ease`,

                  '@keyframes profileRowIn':
                    {
                      from: {
                        opacity:
                          0,

                        transform:
                          'translateX(8px)',
                      },

                      to: {
                        opacity:
                          1,

                        transform:
                          'translateX(0)',
                      },
                    },
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    gap: 2,
                    mb: 0.7
                  }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700
                    }}
                  >
                    {
                      signal.label
                    }
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color,

                      textAlign:
                        'right',
                    }}
                  >
                    {
                      signal.statusLabel
                    }
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    height:
                      5,

                    borderRadius:
                      999,

                    bgcolor:
                      alpha(
                        '#ffffff',
                        0.055,
                      ),

                    overflow:
                      'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width:
                        `${signal.score}%`,

                      height:
                        '100%',

                      borderRadius:
                        999,

                      bgcolor:
                        color,

                      boxShadow:
                        `0 0 16px ${alpha(
                          color,
                          0.22,
                        )}`,

                      transformOrigin:
                        'left',

                      animation:
                        `signalFill .8s ${
                          160 +
                          index *
                            60
                        }ms both cubic-bezier(.2,.8,.2,1)`,

                      '@keyframes signalFill':
                        {
                          from:
                            {
                              transform:
                                'scaleX(0)',
                            },

                          to:
                            {
                              transform:
                                'scaleX(1)',
                            },
                        },
                    }}
                  />
                </Box>
              </Box>
            );
          },
        )}
      </Stack>
    </Box>
  );
}