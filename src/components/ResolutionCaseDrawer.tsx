import GavelRoundedIcon from '@mui/icons-material/GavelRounded';

import {
  Box,
  Button,
  Drawer,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  alpha,
} from '@mui/material/styles';

import {
  useEffect,
  useState,
} from 'react';

import {
  resolutionIssueOptions,
} from '../mappers/resolutionMapper';

import type {
  CreateResolutionCaseRequestDto,
  ResolutionIssueType,
} from '../types/resolution';

import type {
  ProtectedPurchase,
} from '../types/purchase';

interface ResolutionCaseDrawerProps {
  open: boolean;
  purchase:
    ProtectedPurchase;
  onClose:
    () => void;
  onCreate:
    (
      input:
        CreateResolutionCaseRequestDto,
    ) => Promise<void>;
}

export function ResolutionCaseDrawer({
  open,
  purchase,
  onClose,
  onCreate,
}: ResolutionCaseDrawerProps) {
  const [
    issueType,
    setIssueType,
  ] = useState<
    ResolutionIssueType
  >(
    'return_refused',
  );

  const [
    amount,
    setAmount,
  ] = useState('');

  const [
    desiredOutcome,
    setDesiredOutcome,
  ] = useState(
    'A full refund',
  );

  const [
    note,
    setNote,
  ] = useState('');

  const [
    saving,
    setSaving,
  ] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setIssueType(
      'return_refused',
    );

    setAmount(
      purchase.amount ===
        null
        ? ''
        : String(
            purchase.amount,
          ),
    );

    setDesiredOutcome(
      'A full refund',
    );

    setNote('');
  }, [
    open,
    purchase.amount,
    purchase.id,
  ]);

  const parsedAmount =
    amount.trim() ===
      ''
      ? null
      : Number(
          amount,
        );

  const amountInvalid =
    parsedAmount !==
      null &&
    (
      !Number.isFinite(
        parsedAmount,
      ) ||
      parsedAmount < 0
    );

  const outcomeInvalid =
    desiredOutcome.trim().length <
    3;

  const handleCreate =
    async () => {
      if (
        saving ||
        amountInvalid ||
        outcomeInvalid
      ) {
        return;
      }

      setSaving(
        true,
      );

      try {
        await onCreate({
          purchaseId:
            purchase.id,
          issueType,
          amountInDispute:
            parsedAmount,
          currency:
            purchase.currency,
          desiredOutcome:
            desiredOutcome.trim(),
          initialNote:
            note.trim() ||
            null,
        });

        onClose();
      } finally {
        setSaving(
          false,
        );
      }
    };

  return (
    <Drawer
      anchor="right"
      open={
        open
      }
      onClose={
        saving
          ? undefined
          : onClose
      }
      slotProps={{
        paper: {
          sx: {
            width: {
              xs:
                '100%',
              sm:
                500,
            },
            bgcolor:
              '#090B10',
            backgroundImage:
              'radial-gradient(circle at 100% 0%, rgba(255,202,104,.12), transparent 30%)',
            borderLeft:
              `1px solid ${alpha(
                '#ffffff',
                0.07,
              )}`,
            p: {
              xs:
                2.5,
              sm:
                4,
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
            width:
              54,
            height:
              54,
            display:
              'grid',
            placeItems:
              'center',
            borderRadius:
              '17px',
            bgcolor:
              alpha(
                '#FFCA68',
                0.08,
              ),
            color:
              'warning.main',
            border:
              `1px solid ${alpha(
                '#FFCA68',
                0.17,
              )}`,
          }}
        >
          <GavelRoundedIcon />
        </Box>

        <Typography
          variant="h3"
          sx={{
            mt:
              3,
            fontSize:
              '2.1rem',
          }}
        >
          Resolve a purchase problem
        </Typography>

        <Typography
          sx={{
            mt:
              1,
            color:
              'text.secondary',
            lineHeight:
              1.65,
          }}
        >
          Start a case from the purchase Backstop already remembers. Its dates and saved scan evidence stay attached to the case.
        </Typography>

        <Box
          sx={{
            mt:
              3,
            p:
              2,
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
              color:
                'text.secondary',
            }}
          >
            {purchase.merchant} · {purchase.amountLabel}
          </Typography>
        </Box>

        <Stack
          spacing={
            2
          }
          sx={{
            mt:
              3,
          }}
        >
          <TextField
            select
            label="What went wrong?"
            value={
              issueType
            }
            onChange={(
              event,
            ) =>
              setIssueType(
                event.target.value as ResolutionIssueType,
              )
            }
            fullWidth
          >
            {resolutionIssueOptions.map(
              (
                option,
              ) => (
                <MenuItem
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {option.label}
                </MenuItem>
              ),
            )}
          </TextField>

          <TextField
            label="Amount in dispute"
            type="number"
            value={
              amount
            }
            onChange={(
              event,
            ) =>
              setAmount(
                event.target.value,
              )
            }
            error={
              amountInvalid
            }
            helperText={
              purchase.currency
                ? `Currency: ${purchase.currency}`
                : 'Leave blank if no exact amount applies.'
            }
            fullWidth
            slotProps={{
              htmlInput: {
                min:
                  0,
                step:
                  '0.01',
              },
            }}
          />

          <TextField
            label="What outcome do you want?"
            value={
              desiredOutcome
            }
            onChange={(
              event,
            ) =>
              setDesiredOutcome(
                event.target.value,
              )
            }
            error={
              outcomeInvalid
            }
            helperText="For example: full refund, replacement, repair or cancellation."
            fullWidth
          />

          <TextField
            label="Initial note (optional)"
            value={
              note
            }
            onChange={(
              event,
            ) =>
              setNote(
                event.target.value,
              )
            }
            multiline
            minRows={
              4
            }
            fullWidth
          />
        </Stack>

        <Box
          sx={{
            flex:
              1,
            minHeight:
              28,
          }}
        />

        <Typography
          variant="caption"
          sx={{
            color:
              'text.secondary',
            lineHeight:
              1.5,
            mb:
              2,
          }}
        >
          Backstop organizes evidence and communications. It does not decide legal rights or guarantee a refund.
        </Typography>

        <Stack
          spacing={
            1
          }
        >
          <Button
            variant="contained"
            size="large"
            disabled={
              saving ||
              amountInvalid ||
              outcomeInvalid
            }
            onClick={() =>
              void handleCreate()
            }
            sx={{
              height:
                52,
              color:
                '#07100D',
              background:
                'linear-gradient(110deg, #FFCA68, #6AF3D7)',
            }}
          >
            {saving
              ? 'Creating case…'
              : 'Create resolution case'}
          </Button>

          <Button
            disabled={
              saving
            }
            onClick={
              onClose
            }
            sx={{
              color:
                'text.secondary',
            }}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
