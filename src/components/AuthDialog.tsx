import LockRoundedIcon from '@mui/icons-material/LockRounded';

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
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
  authService,
} from '../services/authService';

import type {
  BackstopAuthUser,
} from '../services/authService';

interface AuthDialogProps {
  open: boolean;
  onClose:
    () => void;
  onAuthenticated:
    (
      user:
        BackstopAuthUser,
    ) => void;
}

type AuthMode =
  | 'sign-in'
  | 'sign-up';

export function AuthDialog({
  open,
  onClose,
  onAuthenticated,
}: AuthDialogProps) {
  const [
    mode,
    setMode,
  ] = useState<AuthMode>(
    'sign-in',
  );

  const [
    name,
    setName,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    busy,
    setBusy,
  ] = useState(false);

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

    setError(
      null,
    );
  }, [
    open,
  ]);

  const canSubmit =
    Boolean(
      email.trim() &&
      password.length >=
        8 &&
      (
        mode ===
          'sign-in' ||
        name.trim().length >=
          2
      ),
    );

  const handleSubmit =
    async () => {
      if (
        busy ||
        !canSubmit
      ) {
        return;
      }

      setBusy(
        true,
      );

      setError(
        null,
      );

      try {
        const user =
          mode ===
          'sign-in'
            ? await authService.signIn(
                email.trim(),
                password,
              )
            : await authService.signUp(
                name.trim(),
                email.trim(),
                password,
              );

        onAuthenticated(
          user,
        );

        setPassword('');
        onClose();
      } catch (
        submitError
      ) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Backstop could not complete authentication.',
        );
      } finally {
        setBusy(
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
        busy
          ? undefined
          : onClose
      }
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius:
              4,
            bgcolor:
              '#090B10',
            backgroundImage:
              'radial-gradient(circle at 100% 0%, rgba(157,123,255,.13), transparent 36%)',
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
              'secondary.main',
            bgcolor:
              alpha(
                '#9D7BFF',
                0.08,
              ),
            border:
              `1px solid ${alpha(
                '#9D7BFF',
                0.17,
              )}`,
          }}
        >
          <LockRoundedIcon />
        </Box>

        <Typography
          variant="h3"
          sx={{
            mt:
              2.2,
            fontSize:
              '1.8rem',
          }}
        >
          {mode ===
          'sign-in'
            ? 'Sign in to Backstop'
            : 'Create your Backstop account'}
        </Typography>

        <Typography
          sx={{
            mt:
              0.8,
            color:
              'text.secondary',
            lineHeight:
              1.6,
          }}
        >
          Your protected purchases, reminders and resolution cases are tied to your account and enforced server-side.
        </Typography>

        <Stack
          spacing={
            1.6
          }
          sx={{
            mt:
              2.6,
          }}
        >
          {mode ===
            'sign-up' && (
            <TextField
              label="Name"
              value={
                name
              }
              onChange={(
                event,
              ) =>
                setName(
                  event.target.value,
                )
              }
              autoComplete="name"
              fullWidth
            />
          )}

          <TextField
            label="Email"
            type="email"
            value={
              email
            }
            onChange={(
              event,
            ) =>
              setEmail(
                event.target.value,
              )
            }
            autoComplete="email"
            fullWidth
          />

          <TextField
            label="Password"
            type="password"
            value={
              password
            }
            onChange={(
              event,
            ) =>
              setPassword(
                event.target.value,
              )
            }
            autoComplete={
              mode ===
                'sign-in'
                ? 'current-password'
                : 'new-password'
            }
            helperText="Use at least 8 characters."
            fullWidth
            onKeyDown={(
              event,
            ) => {
              if (
                event.key ===
                  'Enter' &&
                canSubmit
              ) {
                event.preventDefault();

                void handleSubmit();
              }
            }}
          />

          {error && (
            <Alert
              severity="error"
              variant="outlined"
              sx={{
                borderRadius:
                  2.5,
              }}
            >
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            disabled={
              busy ||
              !canSubmit
            }
            onClick={() =>
              void handleSubmit()
            }
            sx={{
              height:
                50,
              color:
                '#07100D',
              background:
                'linear-gradient(110deg, #B89EFF, #6AF3D7)',
            }}
          >
            {busy
              ? 'Working…'
              : mode ===
                  'sign-in'
                ? 'Sign in'
                : 'Create account'}
          </Button>

          <Button
            variant="text"
            disabled={
              busy
            }
            onClick={() => {
              setError(
                null,
              );

              setMode(
                (
                  current,
                ) =>
                  current ===
                  'sign-in'
                    ? 'sign-up'
                    : 'sign-in',
              );
            }}
            sx={{
              color:
                'text.secondary',
            }}
          >
            {mode ===
            'sign-in'
              ? 'New to Backstop? Create an account'
              : 'Already have an account? Sign in'}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
