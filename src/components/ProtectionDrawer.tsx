import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';

import {
  Box,
  Button,
  Drawer,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  calculateProtectionPreview,
  todayDateValue,
} from '../services/protectionService';

import type {
  ProtectionInput,
  PurchaseScan,
} from '../types/purchase';

interface ProtectionDrawerProps {
  open: boolean;
  scan: PurchaseScan;
  onClose: () => void;
  onProtect: (
    input: ProtectionInput,
  ) => void;
}

export function ProtectionDrawer({
  open,
  scan,
  onClose,
  onProtect,
}: ProtectionDrawerProps) {
  const [
    purchaseDate,
    setPurchaseDate,
  ] = useState(
    todayDateValue,
  );

  const [
    deliveryDate,
    setDeliveryDate,
  ] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setPurchaseDate(
      todayDateValue(),
    );

    setDeliveryDate('');
  }, [
    open,
    scan.id,
  ]);

  const deliveryDateInvalid =
    Boolean(
      deliveryDate &&
      deliveryDate <
        purchaseDate,
    );

  const preview =
    useMemo(
      () =>
        !purchaseDate ||
        deliveryDateInvalid
          ? null
          : calculateProtectionPreview(
              scan,
              {
                purchaseDate,
                deliveryDate:
                  deliveryDate ||
                  null,
              },
            ),
      [
        deliveryDate,
        deliveryDateInvalid,
        purchaseDate,
        scan,
      ],
    );

  const rows = [
    {
      icon:
        CalendarMonthRoundedIcon,
      label:
        'Detected return window',
      value:
        scan.protection
          .returnWindowLabel,
    },
    {
      icon:
        SecurityRoundedIcon,
      label:
        'Detected warranty',
      value:
        scan.protection
          .warrantyLabel,
    },
    {
      icon:
        NotificationsActiveRoundedIcon,
      label:
        'Detected renewal',
      value:
        scan.protection
          .renewalLabel ??
        'None detected',
    },
  ];

  const deadlineRows = [
    {
      label:
        'Return deadline',
      value:
        preview
          ?.returnDeadlineLabel ??
        'Not calculated',
    },
    {
      label:
        'Warranty deadline',
      value:
        preview
          ?.warrantyDeadlineLabel ??
        'Not calculated',
    },
    {
      label:
        'Next renewal',
      value:
        preview
          ?.renewalDeadlineLabel ??
        'Not calculated',
    },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: {
              xs: '100%',
              sm: 480,
            },

            bgcolor:
              '#090B10',

            backgroundImage:
              'radial-gradient(circle at 100% 0%, rgba(157,123,255,.14), transparent 30%)',

            borderLeft:
              `1px solid ${alpha(
                '#ffffff',
                0.07,
              )}`,

            p: {
              xs: 2.5,
              sm: 4,
            },
          },
        },
      }}
    >
      <Stack
        sx={{
          minHeight:
            '100%',
        }}
      >
        <Box
          sx={{
            width: 54,
            height: 54,

            display:
              'grid',

            placeItems:
              'center',

            borderRadius:
              '17px',

            bgcolor:
              alpha(
                '#9D7BFF',
                0.11,
              ),

            color:
              'primary.main',

            border:
              `1px solid ${alpha(
                '#9D7BFF',
                0.18,
              )}`,
          }}
        >
          <ShieldRoundedIcon />
        </Box>

        <Typography
          variant="h3"
          sx={{
            mt: 3,
            fontSize:
              '2.2rem',
          }}
        >
          Protect this purchase
        </Typography>

        <Typography
          sx={{
            color:
              'text.secondary',

            mt: 1.2,

            lineHeight:
              1.65,
          }}
        >
          Add the dates you know. Backstop will turn the detected terms into deadlines and keep them on this device.
        </Typography>

        <Stack
          spacing={1.2}
          sx={{
            mt: 3,
          }}
        >
          {rows.map(
            (row) => {
              const Icon =
                row.icon;

              return (
                <Stack
                  key={
                    row.label
                  }

                  direction="row"

                  spacing={1.5}

                  sx={{
                    alignItems:
                      'center',

                    p: 1.7,

                    borderRadius:
                      3,

                    bgcolor:
                      alpha(
                        '#ffffff',
                        0.025,
                      ),

                    border:
                      `1px solid ${alpha(
                        '#ffffff',
                        0.06,
                      )}`,
                  }}
                >
                  <Icon
                    sx={{
                      color:
                        'secondary.main',

                      fontSize:
                        20,
                    }}
                  />

                  <Box
                    sx={{
                      flex: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          'text.secondary',
                      }}
                    >
                      {row.label}
                    </Typography>

                    <Typography
                      sx={{
                        fontWeight:
                          700,
                      }}
                    >
                      {row.value}
                    </Typography>
                  </Box>
                </Stack>
              );
            },
          )}
        </Stack>

        <Stack
          spacing={1.5}
          sx={{
            mt: 3,
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
                event.target
                  .value,
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
                event.target
                  .value,
              )
            }
            error={
              deliveryDateInvalid
            }
            helperText={
              deliveryDateInvalid
                ? 'Delivery date cannot be earlier than purchase date.'
                : 'When supplied, Backstop uses delivery as the return-window basis.'
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

        <Box
          sx={{
            mt: 3,

            p: 2.1,

            borderRadius:
              3,

            background:
              `linear-gradient(135deg, ${alpha(
                '#9D7BFF',
                0.075,
              )}, ${alpha(
                '#61F4D5',
                0.045,
              )})`,

            border:
              `1px solid ${alpha(
                '#9D7BFF',
                0.13,
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
            CALCULATED DEADLINES
          </Typography>

          <Stack
            spacing={1.25}
            sx={{
              mt: 1.5,
            }}
          >
            {deadlineRows.map(
              (row) => (
                <Stack
                  key={
                    row.label
                  }

                  direction="row"

                  sx={{
                    justifyContent:
                      'space-between',

                    alignItems:
                      'baseline',

                    gap: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        'text.secondary',
                    }}
                  >
                    {row.label}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      textAlign:
                        'right',

                      fontWeight:
                        700,
                    }}
                  >
                    {row.value}
                  </Typography>
                </Stack>
              ),
            )}
          </Stack>

          <Typography
            variant="caption"
            sx={{
              mt: 1.5,

              display:
                'block',

              color:
                'text.secondary',

              lineHeight:
                1.5,
            }}
          >
            Return calculation basis: {preview?.returnBasisLabel ?? 'Unavailable'}. Verify the policy source if its trigger differs.
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 2,

            p: 2.1,

            borderRadius:
              3,

            background:
              `linear-gradient(135deg, ${alpha(
                '#FFCA68',
                0.09,
              )}, ${alpha(
                '#FF6B81',
                0.05,
              )})`,

            border:
              `1px solid ${alpha(
                '#FFCA68',
                0.14,
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
            ESTIMATED EXPOSURE
          </Typography>

          <Typography
            sx={{
              mt: 0.4,

              fontFamily:
                'Manrope',

              fontSize:
                '1.65rem',

              fontWeight:
                700,
            }}
          >
            {scan.protection.moneyAtRiskLabel}
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 24,
          }}
        />

        <Stack
          spacing={1.2}
          sx={{
            pt: 3,
          }}
        >
          <Button
            variant="contained"
            size="large"
            disabled={
              !purchaseDate ||
              deliveryDateInvalid
            }
            onClick={() =>
              onProtect({
                purchaseDate,
                deliveryDate:
                  deliveryDate ||
                  null,
              })
            }
            sx={{
              height: 54,

              color:
                '#07100D',

              background:
                'linear-gradient(110deg, #B69BFF, #66F4D6)',

              '&:hover': {
                background:
                  'linear-gradient(110deg, #C5B1FF, #7EFBE1)',
              },
            }}
          >
            Start protection
          </Button>

          <Button
            onClick={
              onClose
            }
            sx={{
              color:
                'text.secondary',
            }}
          >
            Not now
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
