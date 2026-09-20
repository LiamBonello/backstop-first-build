import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditCalendarRoundedIcon from '@mui/icons-material/EditCalendarRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import KeyboardReturnRoundedIcon from '@mui/icons-material/KeyboardReturnRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import {
  useEffect,
  useState,
} from 'react';

import type {
  ProtectedPurchase,
  ProtectionInput,
  PurchaseLifecycleStatus,
} from '../types/purchase';

import {
  FindingCard,
} from './FindingCard';

interface ProtectedPurchaseDetailProps {
  purchase: ProtectedPurchase;
  onBack: () => void;
  onUpdateDates: (
    input: ProtectionInput,
  ) => void;
  onLifecycleChange: (
    status: PurchaseLifecycleStatus,
  ) => void;
  onDelete: () => void;
}

const lifecycleTone: Record<
  PurchaseLifecycleStatus,
  {
    label: string;
    color: string;
  }
> = {
  active: {
    label: 'Active protection',
    color: '#61F4D5',
  },
  kept: {
    label: 'Kept',
    color: '#9D7BFF',
  },
  returned: {
    label: 'Returned',
    color: '#FFCA68',
  },
  refunded: {
    label: 'Refunded',
    color: '#61F4D5',
  },
};

export function ProtectedPurchaseDetail({
  purchase,
  onBack,
  onUpdateDates,
  onLifecycleChange,
  onDelete,
}: ProtectedPurchaseDetailProps) {
  const [
    editOpen,
    setEditOpen,
  ] = useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    purchaseDate,
    setPurchaseDate,
  ] = useState(
    purchase.purchaseDate,
  );

  const [
    deliveryDate,
    setDeliveryDate,
  ] = useState(
    purchase.deliveryDate ??
      '',
  );

  useEffect(() => {
    if (!editOpen) {
      return;
    }

    setPurchaseDate(
      purchase.purchaseDate,
    );

    setDeliveryDate(
      purchase.deliveryDate ??
        '',
    );
  }, [
    editOpen,
    purchase.deliveryDate,
    purchase.purchaseDate,
  ]);

  const deliveryDateInvalid =
    Boolean(
      deliveryDate &&
      deliveryDate <
        purchaseDate,
    );

  const lifecycle =
    lifecycleTone[
      purchase.lifecycleStatus
    ];

  const timelineColor = (
    state:
      ProtectedPurchase['timeline'][number]['state'],
  ): string => {
    switch (state) {
      case 'complete':
        return '#61F4D5';

      case 'upcoming':
        return '#9D7BFF';

      case 'expired':
        return '#FFCA68';

      default:
        return '#93A2B8';
    }
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
        Back to protection
      </Button>

      <Box
        sx={{
          mt: 3,
          p: {
            xs: 2.7,
            md: 4,
          },
          borderRadius:
            5,
          border:
            `1px solid ${alpha(
              '#ffffff',
              0.08,
            )}`,
          background:
            'linear-gradient(145deg, rgba(18,20,28,.92), rgba(10,12,17,.84))',
          boxShadow:
            '0 35px 110px rgba(0,0,0,.28)',
        }}
      >
        <Stack
          direction={{
            xs: 'column',
            md: 'row',
          }}
          sx={{
            justifyContent:
              'space-between',
            gap: 3,
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
                label={
                  lifecycle.label
                }
                sx={{
                  color:
                    lifecycle.color,
                  bgcolor:
                    alpha(
                      lifecycle.color,
                      0.07,
                    ),
                }}
              />

              <Chip
                size="small"
                label={
                  purchase.domain
                }
                sx={{
                  color:
                    'text.secondary',
                }}
              />
            </Stack>

            <Typography
              variant="caption"
              sx={{
                mt: 2.4,
                display:
                  'block',
                color:
                  'text.secondary',
              }}
            >
              {purchase.merchant}
            </Typography>

            <Typography
              variant="h2"
              sx={{
                mt: 0.4,
                fontSize: {
                  xs:
                    '2.2rem',
                  md:
                    '3.2rem',
                },
              }}
            >
              {purchase.product}
            </Typography>

            <Typography
              sx={{
                mt: 1,
                color:
                  'text.secondary',
              }}
            >
              {purchase.amountLabel} · Purchased {purchase.purchaseDateLabel}
              {purchase.deliveryDateLabel
                ? ` · Delivered ${purchase.deliveryDateLabel}`
                : ''}
            </Typography>
          </Box>

          <Box
            sx={{
              minWidth: {
                md: 280,
              },
              p: 2.3,
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
                  0.065,
                )}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color:
                  'text.secondary',
              }}
            >
              NEXT TRACKED EVENT
            </Typography>

            <Typography
              sx={{
                mt: 0.65,
                fontWeight:
                  700,
                fontSize:
                  '1.05rem',
              }}
            >
              {purchase.nextDeadlineLabel}
            </Typography>

            {purchase.lifecycleUpdatedLabel && (
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  display:
                    'block',
                  color:
                    'text.secondary',
                }}
              >
                Status updated {purchase.lifecycleUpdatedLabel}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack
          direction={{
            xs: 'column',
            sm: 'row',
          }}
          spacing={1}
          useFlexGap
          sx={{
            mt: 3.2,
            flexWrap:
              'wrap',
          }}
        >
          <Button
            variant="outlined"
            startIcon={
              <EditCalendarRoundedIcon />
            }
            onClick={() =>
              setEditOpen(
                true,
              )
            }
          >
            Edit dates
          </Button>

          {purchase.lifecycleStatus !==
            'kept' && (
            <Button
              variant="outlined"
              startIcon={
                <Inventory2RoundedIcon />
              }
              onClick={() =>
                onLifecycleChange(
                  'kept',
                )
              }
            >
              Mark kept
            </Button>
          )}

          {purchase.lifecycleStatus !==
            'returned' && (
            <Button
              variant="outlined"
              startIcon={
                <KeyboardReturnRoundedIcon />
              }
              onClick={() =>
                onLifecycleChange(
                  'returned',
                )
              }
            >
              Mark returned
            </Button>
          )}

          {purchase.lifecycleStatus !==
            'refunded' && (
            <Button
              variant="outlined"
              startIcon={
                <PaidRoundedIcon />
              }
              onClick={() =>
                onLifecycleChange(
                  'refunded',
                )
              }
            >
              Mark refunded
            </Button>
          )}

          {purchase.lifecycleStatus !==
            'active' && (
            <Button
              variant="text"
              startIcon={
                <ReplayRoundedIcon />
              }
              onClick={() =>
                onLifecycleChange(
                  'active',
                )
              }
              sx={{
                color:
                  'text.secondary',
              }}
            >
              Restore active tracking
            </Button>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          mt: 4,
          display:
            'grid',
          gridTemplateColumns: {
            xs:
              '1fr',
            lg:
              'minmax(0, .9fr) minmax(0, 1.5fr)',
          },
          gap: 3,
          alignItems:
            'start',
        }}
      >
        <Box
          sx={{
            p: 2.7,
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
                0.065,
              )}`,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontSize:
                '1.45rem',
            }}
          >
            Purchase timeline
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.6,
              color:
                'text.secondary',
            }}
          >
            The purchase events and deadlines Backstop is tracking.
          </Typography>

          <Stack
            spacing={0}
            sx={{
              mt: 2.5,
            }}
          >
            {purchase.timeline.map(
              (
                item,
                index,
              ) => {
                const color =
                  timelineColor(
                    item.state,
                  );

                return (
                  <Stack
                    key={
                      item.id
                    }
                    direction="row"
                    spacing={1.5}
                    sx={{
                      position:
                        'relative',
                      pb:
                        index ===
                        purchase.timeline.length -
                          1
                          ? 0
                          : 2.4,
                    }}
                  >
                    <Box
                      sx={{
                        position:
                          'relative',
                        zIndex:
                          1,
                        width:
                          30,
                        height:
                          30,
                        display:
                          'grid',
                        placeItems:
                          'center',
                        flexShrink:
                          0,
                        borderRadius:
                          '50%',
                        color,
                        bgcolor:
                          alpha(
                            color,
                            0.09,
                          ),
                        border:
                          `1px solid ${alpha(
                            color,
                            0.18,
                          )}`,
                      }}
                    >
                      {item.state ===
                      'expired' ? (
                        <WarningAmberRoundedIcon
                          sx={{
                            fontSize:
                              16,
                          }}
                        />
                      ) : (
                        <CheckCircleRoundedIcon
                          sx={{
                            fontSize:
                              16,
                          }}
                        />
                      )}
                    </Box>

                    {index <
                      purchase.timeline.length -
                        1 && (
                      <Box
                        sx={{
                          position:
                            'absolute',
                          left:
                            14.5,
                          top:
                            30,
                          bottom:
                            0,
                          width:
                            '1px',
                          bgcolor:
                            alpha(
                              '#ffffff',
                              0.08,
                            ),
                        }}
                      />
                    )}

                    <Box
                      sx={{
                        minWidth:
                          0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight:
                            700,
                        }}
                      >
                        {item.label}
                      </Typography>

                      {item.dateLabel && (
                        <Typography
                          variant="caption"
                          sx={{
                            mt: 0.15,
                            display:
                              'block',
                            color,
                          }}
                        >
                          {item.dateLabel}
                        </Typography>
                      )}

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
                        {item.detail}
                      </Typography>
                    </Box>
                  </Stack>
                );
              },
            )}
          </Stack>
        </Box>

        <Box>
          <Stack
            direction={{
              xs:
                'column',
              sm:
                'row',
            }}
            sx={{
              justifyContent:
                'space-between',
              alignItems: {
                xs:
                  'flex-start',
                sm:
                  'flex-end',
              },
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontSize:
                    '1.45rem',
                }}
              >
                Saved evidence
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 0.6,
                  color:
                    'text.secondary',
                }}
              >
                Evidence preserved when this purchase was protected.
              </Typography>
            </Box>

            {purchase.evidenceSnapshot && (
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
                  label={`Risk ${purchase.evidenceSnapshot.risk}`}
                />

                <Chip
                  size="small"
                  label={`${purchase.evidenceSnapshot.evidenceCoverage}% coverage`}
                />
              </Stack>
            )}
          </Stack>

          {purchase.evidenceSnapshot ? (
            <>
              <Box
                sx={{
                  mb: 1.3,
                  p: 2,
                  borderRadius:
                    4,
                  bgcolor:
                    alpha(
                      '#9D7BFF',
                      0.045,
                    ),
                  border:
                    `1px solid ${alpha(
                      '#9D7BFF',
                      0.11,
                    )}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color:
                      'text.secondary',
                  }}
                >
                  SCAN SNAPSHOT · {purchase.evidenceSnapshot.scannedAtLabel}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    fontWeight:
                      700,
                  }}
                >
                  {purchase.evidenceSnapshot.verdict}
                </Typography>
              </Box>

              <Stack
                spacing={1.2}
              >
                {purchase.evidenceSnapshot.findings.map(
                  (
                    finding,
                    index,
                  ) => (
                    <FindingCard
                      key={
                        finding.id
                      }
                      finding={
                        finding
                      }
                      index={
                        index
                      }
                    />
                  ),
                )}
              </Stack>
            </>
          ) : (
            <Box
              sx={{
                p: 2.5,
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
                    0.065,
                  )}`,
              }}
            >
              <Typography
                sx={{
                  fontWeight:
                    700,
                }}
              >
                Evidence snapshot unavailable
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 0.7,
                  color:
                    'text.secondary',
                  lineHeight:
                    1.65,
                }}
              >
                This purchase was protected before Backstop started preserving scan snapshots. Its saved dates and calculated deadlines were migrated without inventing missing evidence.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          mt: 3,
          p: 2.5,
          borderRadius:
            4,
          border:
            `1px solid ${alpha(
              '#FF6B81',
              0.1,
            )}`,
          bgcolor:
            alpha(
              '#FF6B81',
              0.025,
            ),
        }}
      >
        <Stack
          direction={{
            xs:
              'column',
            sm:
              'row',
          }}
          sx={{
            justifyContent:
              'space-between',
            alignItems: {
              xs:
                'flex-start',
              sm:
                'center',
            },
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
              Stop protecting this purchase
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.35,
                color:
                  'text.secondary',
              }}
            >
              Removes the local protection record and its saved evidence from this device.
            </Typography>
          </Box>

          <Button
            color="error"
            startIcon={
              <DeleteOutlineRoundedIcon />
            }
            onClick={() =>
              setDeleteOpen(
                true,
              )
            }
          >
            Delete protection
          </Button>
        </Stack>
      </Box>

      <Dialog
        open={
          editOpen
        }
        onClose={() =>
          setEditOpen(
            false,
          )
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Edit purchase dates
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{
              pt: 1,
            }}
          >
            <TextField
              label="Purchase date"
              type="date"
              value={
                purchaseDate
              }
              onChange={(
                event,
              ) =>
                setPurchaseDate(
                  event.target.value,
                )
              }
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              label="Delivery date (optional)"
              type="date"
              value={
                deliveryDate
              }
              onChange={(
                event,
              ) =>
                setDeliveryDate(
                  event.target.value,
                )
              }
              error={
                deliveryDateInvalid
              }
              helperText={
                deliveryDateInvalid
                  ? 'Delivery date cannot be earlier than purchase date.'
                  : 'Changing dates recalculates tracked deadlines from the saved terms.'
              }
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                htmlInput: {
                  min:
                    purchaseDate,
                },
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setEditOpen(
                false,
              )
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={
              !purchaseDate ||
              deliveryDateInvalid
            }
            onClick={() => {
              onUpdateDates({
                purchaseDate,
                deliveryDate:
                  deliveryDate ||
                  null,
              });

              setEditOpen(
                false,
              );
            }}
          >
            Save dates
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={
          deleteOpen
        }
        onClose={() =>
          setDeleteOpen(
            false,
          )
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Delete protection?
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            sx={{
              color:
                'text.secondary',
              lineHeight:
                1.65,
            }}
          >
            This removes the saved purchase, calculated deadlines and evidence snapshot from this device.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setDeleteOpen(
                false,
              )
            }
          >
            Cancel
          </Button>

          <Button
            color="error"
            onClick={() => {
              setDeleteOpen(
                false,
              );

              onDelete();
            }}
          >
            Delete protection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
