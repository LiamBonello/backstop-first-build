import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import type {
  DashboardMetric,
  ProtectedPurchase,
} from '../types/purchase';

interface DashboardProps {
  purchases:
    ProtectedPurchase[];

  metrics:
    DashboardMetric[];

  onBack:
    () => void;

  onScanNew:
    () => void;

  onRemovePurchase:
    (
      id: string,
    ) => void;
}

export function Dashboard({
  purchases,
  metrics,
  onBack,
  onScanNew,
  onRemovePurchase,
}: DashboardProps) {
  const metricIcons: Record<
    DashboardMetric['icon'],
    typeof ShieldRoundedIcon
  > = {
    shield:
      ShieldRoundedIcon,

    value:
      SavingsOutlinedIcon,

    deadline:
      CalendarMonthRoundedIcon,

    attention:
      WarningAmberRoundedIcon,
  };

  return (
    <Box
      sx={{
        maxWidth:
          1180,

        mx:
          'auto',

        px: {
          xs: 2,
          md: 4,
        },

        py: {
          xs: 5,
          md: 8,
        },
      }}
    >
      <Button
        startIcon={
          <ArrowBackRoundedIcon />
        }
        onClick={
          onBack
        }
        sx={{
          color:
            'text.secondary',

          ml: -1,
        }}
      >
        Back
      </Button>

      <Stack
        direction={{
          xs: 'column',
          sm: 'row',
        }}
        sx={{
          justifyContent:
            'space-between',

          alignItems: {
            xs: 'stretch',
            sm: 'flex-end',
          },

          gap: 2,

          mt: 3,
        }}
      >
        <Box>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              flexWrap:
                'wrap',
            }}
          >
            <Chip
              size="small"
              icon={
                <ShieldRoundedIcon />
              }
              label="Protection center"
              sx={{
                color:
                  '#A8F4DF',

                bgcolor:
                  alpha(
                    '#61F4D5',
                    0.055,
                  ),
              }}
            />

            <Chip
              size="small"
              label="Saved on this device"
              sx={{
                color:
                  'text.secondary',
              }}
            />
          </Stack>

          <Typography
            variant="h2"
            sx={{
              mt: 2,

              fontSize: {
                xs:
                  '2.5rem',

                md:
                  '3.7rem',
              },
            }}
          >
            Your money has a memory now.
          </Typography>

          <Typography
            sx={{
              color:
                'text.secondary',

              mt: 1,

              maxWidth:
                640,
            }}
          >
            Exact return, warranty and renewal deadlines calculated from the purchase details you saved.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={
            <AddRoundedIcon />
          }
          onClick={
            onScanNew
          }
          sx={{
            height: 48,

            color:
              '#07100D',

            background:
              'linear-gradient(110deg, #B89EFF, #6AF3D7)',
          }}
        >
          Scan a purchase
        </Button>
      </Stack>

      <Box
        sx={{
          mt: 5,

          display:
            'grid',

          gridTemplateColumns: {
            xs:
              '1fr 1fr',

            lg:
              'repeat(4, 1fr)',
          },

          gap: 1.4,
        }}
      >
        {metrics.map(
          (stat) => {
            const Icon =
              metricIcons[
                stat.icon
              ];

            return (
              <Box
                key={
                  stat.id
                }
                sx={{
                  p: {
                    xs: 2,
                    md: 2.4,
                  },

                  borderRadius:
                    4,

                  bgcolor:
                    alpha(
                      '#0D1016',
                      0.72,
                    ),

                  border:
                    `1px solid ${alpha(
                      '#ffffff',
                      0.07,
                    )}`,
                }}
              >
                <Icon
                  sx={{
                    color:
                      stat.icon ===
                      'attention'
                        ? 'warning.main'
                        : 'primary.main',

                    fontSize:
                      20,
                  }}
                />

                <Typography
                  sx={{
                    mt: 2,

                    fontFamily:
                      'Manrope',

                    fontWeight:
                      700,

                    fontSize: {
                      xs:
                        '1.6rem',

                      md:
                        '2rem',
                    },
                  }}
                >
                  {stat.value}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color:
                      'text.secondary',
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            );
          },
        )}
      </Box>

      <Stack
        direction="row"
        sx={{
          justifyContent:
            'space-between',

          alignItems:
            'center',

          mt: 6,

          mb: 2,
        }}
      >
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontSize:
                '1.6rem',
            }}
          >
            Protected purchases
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color:
                'text.secondary',

              mt: 0.5,
            }}
          >
            Sorted by the next exact deadline Backstop can calculate.
          </Typography>
        </Box>
      </Stack>

      {purchases.length ===
      0 ? (
        <Box
          sx={{
            mt: 2,

            p: {
              xs: 3,
              md: 5,
            },

            textAlign:
              'center',

            borderRadius:
              5,

            border:
              `1px dashed ${alpha(
                '#9D7BFF',
                0.22,
              )}`,

            bgcolor:
              alpha(
                '#0D1016',
                0.5,
              ),
          }}
        >
          <ShieldRoundedIcon
            sx={{
              color:
                'primary.main',

              fontSize:
                34,
            }}
          />

          <Typography
            variant="h3"
            sx={{
              mt: 1.5,

              fontSize:
                '1.45rem',
            }}
          >
            No protected purchases yet
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.8,

              mx: 'auto',

              maxWidth:
                480,

              color:
                'text.secondary',

              lineHeight:
                1.65,
            }}
          >
            Scan a product, protect the purchase, and Backstop will calculate the deadlines it can track from the terms it found.
          </Typography>

          <Button
            variant="contained"
            startIcon={
              <AddRoundedIcon />
            }
            onClick={
              onScanNew
            }
            sx={{
              mt: 2.5,

              color:
                '#07100D',

              background:
                'linear-gradient(110deg, #B89EFF, #6AF3D7)',
            }}
          >
            Scan a purchase
          </Button>
        </Box>
      ) : (
        <Stack
          spacing={1.2}
        >
          {purchases.map(
            (purchase) => (
              <Stack
                key={
                  purchase.id
                }

                direction={{
                  xs:
                    'column',

                  sm:
                    'row',
                }}

                spacing={2}

                sx={{
                  alignItems: {
                    xs:
                      'flex-start',

                    sm:
                      'center',
                  },

                  p: 2.2,

                  borderRadius:
                    4,

                  bgcolor:
                    alpha(
                      '#0D1016',
                      0.68,
                    ),

                  border:
                    `1px solid ${alpha(
                      purchase.status ===
                        'attention'
                        ? '#FFCA68'
                        : '#ffffff',
                      purchase.status ===
                        'attention'
                        ? 0.15
                        : 0.065,
                    )}`,

                  transition:
                    'transform .2s ease, border-color .2s ease',

                  '&:hover': {
                    transform:
                      'translateY(-2px)',

                    borderColor:
                      alpha(
                        '#9D7BFF',
                        0.18,
                      ),
                  },
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,

                    borderRadius:
                      '14px',

                    display:
                      'grid',

                    placeItems:
                      'center',

                    color:
                      purchase.status ===
                      'attention'
                        ? 'warning.main'
                        : 'secondary.main',

                    bgcolor:
                      purchase.status ===
                      'attention'
                        ? alpha(
                            '#FFCA68',
                            0.07,
                          )
                        : alpha(
                            '#61F4D5',
                            0.07,
                          ),
                  }}
                >
                  {purchase.status ===
                  'attention' ? (
                    <CalendarMonthRoundedIcon />
                  ) : (
                    <CheckCircleRoundedIcon />
                  )}
                </Box>

                <Box
                  sx={{
                    flex: 1,

                    minWidth:
                      0,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color:
                        'text.secondary',
                    }}
                  >
                    {purchase.merchant} · {purchase.domain}
                  </Typography>

                  <Typography
                    sx={{
                      fontWeight:
                        700,
                    }}
                  >
                    {purchase.product}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.35,

                      display:
                        'block',

                      color:
                        'text.secondary',
                    }}
                  >
                    Purchased {purchase.purchaseDateLabel}
                    {purchase.deliveryDateLabel
                      ? ` · Delivered ${purchase.deliveryDateLabel}`
                      : ''}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    textAlign: {
                      xs:
                        'left',

                      sm:
                        'right',
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight:
                        700,
                    }}
                  >
                    {purchase.amountLabel}
                  </Typography>

                  <Typography
                    variant="caption"
                    color={
                      purchase.status ===
                      'attention'
                        ? 'warning.main'
                        : 'text.secondary'
                    }
                  >
                    {purchase.nextDeadlineLabel}
                  </Typography>
                </Box>

                <Tooltip
                  title="Remove protection"
                >
                  <IconButton
                    aria-label={`Remove protection for ${purchase.product}`}
                    onClick={(
                      event,
                    ) => {
                      event.stopPropagation();

                      onRemovePurchase(
                        purchase.id,
                      );
                    }}
                    sx={{
                      color:
                        'text.secondary',

                      alignSelf: {
                        xs:
                          'flex-end',

                        sm:
                          'center',
                      },

                      '&:hover': {
                        color:
                          'error.light',

                        bgcolor:
                          alpha(
                            '#FF6B81',
                            0.07,
                          ),
                      },
                    }}
                  >
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            ),
          )}
        </Stack>
      )}
    </Box>
  );
}
