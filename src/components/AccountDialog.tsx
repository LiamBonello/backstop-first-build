import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
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
  accountService,
} from '../services/accountService';

import type {
  BackstopAuthUser,
} from '../services/authService';

interface AccountDialogProps {
  open: boolean;
  user:
    BackstopAuthUser;
  onClose:
    () => void;
  onDeleted:
    () => void;
}

export function AccountDialog({
  open,
  user,
  onClose,
  onDeleted,
}: AccountDialogProps) {
  const [
    exporting,
    setExporting,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    confirmation,
    setConfirmation,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setConfirmation('');
    setError(
      null,
    );
  }, [
    open,
  ]);

  const handleExport =
    async () => {
      if (
        exporting ||
        deleting
      ) {
        return;
      }

      setExporting(
        true,
      );

      setError(
        null,
      );

      try {
        await accountService.downloadExport();
      } catch (
        exportError
      ) {
        setError(
          exportError instanceof Error
            ? exportError.message
            : 'Backstop could not export your data.',
        );
      } finally {
        setExporting(
          false,
        );
      }
    };

  const handleDelete =
    async () => {
      if (
        deleting ||
        confirmation !==
          'DELETE'
      ) {
        return;
      }

      setDeleting(
        true,
      );

      setError(
        null,
      );

      try {
        await accountService.deleteAccount();

        onDeleted();
      } catch (
        deleteError
      ) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : 'Backstop could not delete your account.',
        );

        setDeleting(
          false,
        );
      }
    };

  return (
    <Dialog
      open={
        open
      }
      onClose={
        deleting
          ? undefined
          : onClose
      }
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius:
              4,
            bgcolor:
              '#090B10',
            border:
              `1px solid ${alpha(
                '#ffffff',
                0.08,
              )}`,
          },
        },
      }}
    >
      <DialogContent
        sx={{
          p: {
            xs:
              2.5,
            sm:
              3.5,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={
            1.5
          }
          sx={{
            alignItems:
              'center',
          }}
        >
          <Box
            sx={{
              width:
                48,
              height:
                48,
              display:
                'grid',
              placeItems:
                'center',
              borderRadius:
                '15px',
              color:
                '#A8F4DF',
              bgcolor:
                alpha(
                  '#61F4D5',
                  0.065,
                ),
            }}
          >
            <PersonRoundedIcon />
          </Box>

          <Box
            sx={{
              minWidth:
                0,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontSize:
                  '1.65rem',
              }}
            >
              Your Backstop account
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt:
                  0.25,
                color:
                  'text.secondary',
                overflowWrap:
                  'anywhere',
              }}
            >
              {user.name || 'Backstop user'} · {user.email}
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            mt:
              3,
            p:
              2.2,
            borderRadius:
              3,
            bgcolor:
              alpha(
                '#ffffff',
                0.022,
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
            Export your data
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt:
                0.65,
              color:
                'text.secondary',
              lineHeight:
                1.6,
            }}
          >
            Download a JSON copy of your account profile, protected purchases, saved evidence, reminder settings and resolution-case history. Passwords and session credentials are never included.
          </Typography>

          <Button
            variant="outlined"
            startIcon={
              <DownloadRoundedIcon />
            }
            disabled={
              exporting ||
              deleting
            }
            onClick={() =>
              void handleExport()
            }
            sx={{
              mt:
                1.8,
            }}
          >
            {exporting
              ? 'Preparing export…'
              : 'Download my data'}
          </Button>
        </Box>

        <Divider
          sx={{
            my:
              3,
          }}
        />

        <Box
          sx={{
            p:
              2.2,
            borderRadius:
              3,
            bgcolor:
              alpha(
                '#FF6B81',
                0.035,
              ),
            border:
              `1px solid ${alpha(
                '#FF6B81',
                0.14,
              )}`,
          }}
        >
          <Typography
            sx={{
              fontWeight:
                700,
              color:
                '#FF9AAA',
            }}
          >
            Delete account
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt:
                0.65,
              color:
                'text.secondary',
              lineHeight:
                1.6,
            }}
          >
            This permanently deletes your Backstop account, protected purchases, reminders, saved evidence and resolution cases. This cannot be undone.
          </Typography>

          <TextField
            label="Type DELETE to confirm"
            value={
              confirmation
            }
            onChange={(
              event,
            ) =>
              setConfirmation(
                event.target.value,
              )
            }
            disabled={
              deleting
            }
            fullWidth
            sx={{
              mt:
                1.8,
            }}
          />

          <Button
            variant="outlined"
            startIcon={
              <DeleteForeverRoundedIcon />
            }
            disabled={
              deleting ||
              confirmation !==
                'DELETE'
            }
            onClick={() =>
              void handleDelete()
            }
            sx={{
              mt:
                1.5,
              color:
                '#FF8A9C',
              borderColor:
                alpha(
                  '#FF6B81',
                  0.32,
                ),
              '&:hover': {
                borderColor:
                  '#FF6B81',
                bgcolor:
                  alpha(
                    '#FF6B81',
                    0.06,
                  ),
              },
            }}
          >
            {deleting
              ? 'Deleting account…'
              : 'Permanently delete account'}
          </Button>
        </Box>

        {error && (
          <Alert
            severity="error"
            variant="outlined"
            sx={{
              mt:
                2,
              borderRadius:
                2.5,
            }}
          >
            {error}
          </Alert>
        )}

        <Button
          disabled={
            deleting
          }
          onClick={
            onClose
          }
          sx={{
            mt:
              2,
            color:
              'text.secondary',
          }}
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
