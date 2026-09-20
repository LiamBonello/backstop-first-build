import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';

import {
  Box,
  ButtonBase,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import {
  useEffect,
  useState,
} from 'react';

import type {
  RiskBreakdown,
} from '../types/purchase';

interface RiskMeterProps {
  risk: number;
  verdict: string;
  breakdown: RiskBreakdown;
}

const RADIUS = 52;

const CIRCUMFERENCE =
  2 *
  Math.PI *
  RADIUS;

export function RiskMeter({
  risk,
  verdict,
  breakdown,
}: RiskMeterProps) {
  const reduceMotion =
    useMediaQuery(
      '(prefers-reduced-motion: reduce)',
    );

  const [
    breakdownOpen,
    setBreakdownOpen,
  ] = useState(false);

  const [
    ringRisk,
    setRingRisk,
  ] = useState(
    reduceMotion
      ? risk
      : 0,
  );

  const [
    displayRisk,
    setDisplayRisk,
  ] = useState(
    reduceMotion
      ? risk
      : 0,
  );

  useEffect(() => {
    if (reduceMotion) {
      setRingRisk(risk);
      setDisplayRisk(risk);

      return;
    }

    setRingRisk(0);
    setDisplayRisk(0);

    const ringFrame =
      window.requestAnimationFrame(
        () =>
          setRingRisk(
            risk,
          ),
      );

    const startedAt =
      performance.now();

    let countFrame = 0;

    const tick = (
      time: number,
    ) => {
      const elapsed =
        time - startedAt;

      const progress =
        Math.min(
          1,
          elapsed / 900,
        );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3,
        );

      setDisplayRisk(
        Math.round(
          risk * eased,
        ),
      );

      if (progress < 1) {
        countFrame =
          window.requestAnimationFrame(
            tick,
          );
      }
    };

    countFrame =
      window.requestAnimationFrame(
        tick,
      );

    return () => {
      window.cancelAnimationFrame(
        ringFrame,
      );

      window.cancelAnimationFrame(
        countFrame,
      );
    };
  }, [
    reduceMotion,
    risk,
  ]);

  const offset =
    CIRCUMFERENCE *
    (
      1 -
      ringRisk / 100
    );

  const verdictColor =
    risk < 32
      ? '#61F4D5'
      : risk < 55
        ? '#FFCA68'
        : '#FF7C91';

  return (
    <>
      <ButtonBase
        onClick={() =>
          setBreakdownOpen(
            true,
          )
        }

        aria-label={`Explain risk score ${risk}`}

        sx={{
          width: 230,
          height: 230,

          position:
            'relative',

          display:
            'grid',

          placeItems:
            'center',

          borderRadius:
            '50%',

          overflow:
            'visible',

          filter:
            'drop-shadow(0 0 34px rgba(255,122,137,.08))',

          transition:
            'transform 180ms ease, filter 180ms ease',

          '&:hover':
            {
              transform:
                'scale(1.025)',

              filter:
                'drop-shadow(0 0 42px rgba(157,123,255,.14))',
            },

          '&:focus-visible':
            {
              outline:
                '2px solid',

              outlineColor:
                'primary.main',

              outlineOffset:
                5,
            },
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 120 120"
          sx={{
            position:
              'absolute',

            inset: 0,

            width:
              '100%',

            height:
              '100%',

            transform:
              'rotate(-90deg)',

            pointerEvents:
              'none',
          }}
        >
          <defs>
            <linearGradient
              id="backstop-risk-gradient"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#FFCA68"
              />

              <stop
                offset="100%"
                stopColor="#FF6B81"
              />
            </linearGradient>
          </defs>

          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,.055)"
            strokeWidth="7"
          />

          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="url(#backstop-risk-gradient)"
            strokeWidth="7"
            strokeLinecap="round"

            strokeDasharray={
              CIRCUMFERENCE
            }

            strokeDashoffset={
              offset
            }

            style={{
              transition:
                reduceMotion
                  ? 'none'
                  : 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)',
            }}
          />
        </Box>

        <Box
          sx={{
            position:
              'absolute',

            inset:
              20,

            borderRadius:
              '50%',

            bgcolor:
              alpha(
                '#090C11',
                0.96,
              ),

            border:
              `1px solid ${alpha(
                '#ffffff',
                0.055,
              )}`,

            boxShadow:
              'inset 0 0 50px rgba(157,123,255,.035)',
          }}
        />

        <Stack
          sx={{
            alignItems:
              'center',

            position:
              'relative',

            zIndex: 1,
          }}
        >
          <Typography
            sx={{
              fontFamily:
                'Manrope',

              fontWeight:
                800,

              fontSize:
                '3.4rem',

              lineHeight:
                1,

              fontVariantNumeric:
                'tabular-nums',
            }}
          >
            {displayRisk}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color:
                'text.secondary',

              mt: 0.7,

              letterSpacing:
                '.08em',
            }}
          >
            RISK SIGNAL
          </Typography>

          <Typography
            sx={{
              mt: 1.2,

              color:
                verdictColor,

              fontWeight:
                700,

              textAlign:
                'center',
            }}
          >
            {verdict}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              mt: 0.55,

              color:
                alpha(
                  '#ffffff',
                  0.46,
                ),

              fontSize:
                '0.66rem',
            }}
          >
            Click to explain
          </Typography>
        </Stack>
      </ButtonBase>

      <Dialog
        open={
          breakdownOpen
        }

        onClose={() =>
          setBreakdownOpen(
            false,
          )
        }

        maxWidth="xs"

        fullWidth

        slotProps={{
          paper: {
            sx: {
              borderRadius:
                4,

              border:
                `1px solid ${alpha(
                  '#ffffff',
                  0.09,
                )}`,

              background:
                'linear-gradient(145deg, rgba(18,20,28,.98), rgba(8,10,15,.98))',

              boxShadow:
                '0 30px 100px rgba(0,0,0,.58)',
            },
          },
        }}
      >
        <DialogTitle
          component="div"

          sx={{
            pb: 1,
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems:
                'flex-start',

              justifyContent:
                'space-between',

              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color:
                    'text.secondary',

                  letterSpacing:
                    '.08em',
                }}
              >
                RISK MODEL
              </Typography>

              <Typography
                variant="h3"
                sx={{
                  mt: 0.5,

                  fontSize:
                    '1.6rem',
                }}
              >
                Why this score is {risk}
              </Typography>
            </Box>

            <IconButton
              onClick={() =>
                setBreakdownOpen(
                  false,
                )
              }

              aria-label="Close risk breakdown"

              size="small"
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            pt:
              '12px !important',
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.6,

              borderRadius:
                3,

              bgcolor:
                alpha(
                  '#9D7BFF',
                  0.055,
                ),

              border:
                `1px solid ${alpha(
                  '#9D7BFF',
                  0.11,
                )}`,
            }}
          >
            <Typography
              sx={{
                fontFamily:
                  'monospace',

                fontWeight:
                  700,

                fontSize:
                  '1rem',

                letterSpacing:
                  '.02em',
              }}
            >
              {breakdown.calculationLabel}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                mt: 0.5,

                display:
                  'block',

                color:
                  'text.secondary',
              }}
            >
              Final scores are bounded between 0 and 100.
            </Typography>
          </Box>

          <Stack
            spacing={1.25}
            sx={{
              mt: 2,
            }}
          >
            <Box
              sx={{
                p: 1.5,

                borderRadius:
                  3,

                bgcolor:
                  alpha(
                    '#ffffff',
                    0.025,
                  ),
              }}
            >
              <Stack
                direction="row"
                sx={{
                  alignItems:
                    'flex-start',

                  justifyContent:
                    'space-between',

                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight:
                        700,
                    }}
                  >
                    {breakdown.baselineLabel}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.35,

                      display:
                        'block',

                      color:
                        'text.secondary',

                      lineHeight:
                        1.5,
                    }}
                  >
                    {breakdown.baselineDetail}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color:
                      'text.secondary',

                    fontWeight:
                      800,

                    fontVariantNumeric:
                      'tabular-nums',
                  }}
                >
                  {breakdown.baselinePoints}
                </Typography>
              </Stack>
            </Box>

            {breakdown.factors.map(
              (
                factor,
              ) => {
                const decreasesRisk =
                  factor.tone ===
                  'decrease';

                const color =
                  decreasesRisk
                    ? '#61F4D5'
                    : '#FFCA68';

                return (
                  <Box
                    key={
                      factor.id
                    }

                    sx={{
                      p: 1.5,

                      borderRadius:
                        3,

                      bgcolor:
                        alpha(
                          color,
                          0.035,
                        ),

                      border:
                        `1px solid ${alpha(
                          color,
                          0.08,
                        )}`,
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{
                        alignItems:
                          'flex-start',

                        justifyContent:
                          'space-between',

                        gap: 2,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems:
                            'flex-start',

                          minWidth:
                            0,
                        }}
                      >
                        <Box
                          sx={{
                            width: 24,
                            height: 24,

                            display:
                              'grid',

                            placeItems:
                              'center',

                            flexShrink:
                              0,

                            borderRadius:
                              '8px',

                            color,

                            bgcolor:
                              alpha(
                                color,
                                0.08,
                              ),
                          }}
                        >
                          {decreasesRisk ? (
                            <RemoveRoundedIcon
                              sx={{
                                fontSize:
                                  15,
                              }}
                            />
                          ) : (
                            <AddRoundedIcon
                              sx={{
                                fontSize:
                                  15,
                              }}
                            />
                          )}
                        </Box>

                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight:
                                700,
                            }}
                          >
                            {factor.label}
                          </Typography>

                          <Typography
                            variant="caption"
                            sx={{
                              mt: 0.35,

                              display:
                                'block',

                              color:
                                'text.secondary',

                              lineHeight:
                                1.5,
                            }}
                          >
                            {factor.detail}
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography
                        sx={{
                          color,

                          fontWeight:
                            800,

                          fontVariantNumeric:
                            'tabular-nums',

                          flexShrink:
                            0,
                        }}
                      >
                        {factor.impactLabel}
                      </Typography>
                    </Stack>
                  </Box>
                );
              },
            )}

            {breakdown.factors.length === 0 && (
              <Typography
                variant="body2"
                sx={{
                  color:
                    'text.secondary',

                  py: 1,
                }}
              >
                No non-zero evidence adjustments were applied to the baseline.
              </Typography>
            )}
          </Stack>

          <Divider
            sx={{
              my: 2,
            }}
          />

          <Stack
            direction="row"
            sx={{
              alignItems:
                'center',

              justifyContent:
                'space-between',

              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight:
                    700,
                }}
              >
                Final risk signal
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color:
                    'text.secondary',
                }}
              >
                Heuristic transaction signal, not a probability of fraud.
              </Typography>
            </Box>

            <Typography
              sx={{
                color:
                  verdictColor,

                fontWeight:
                  800,

                fontSize:
                  '1.55rem',

                fontVariantNumeric:
                  'tabular-nums',
              }}
            >
              {risk}
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
