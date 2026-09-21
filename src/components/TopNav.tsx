import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  alpha,
} from '@mui/material/styles';

import type {
  BackstopAuthUser,
} from '../services/authService';

import type {
  DeadlineNotification,
} from '../types/notification';

import {
  BrandMark,
} from './BrandMark';

import {
  NotificationCenter,
} from './NotificationCenter';

import type {
  BrowserNotificationPermission,
} from './NotificationCenter';

interface TopNavProps {
  onDashboard:
    () => void;

  onHome:
    () => void;

  authUser:
    BackstopAuthUser | null;

  authPending:
    boolean;

  onSignIn:
    () => void;

  onSignOut:
    () => void;

  onAccount:
    () => void;

  notifications:
    DeadlineNotification[];

  notificationLeadDays:
    number;

  browserNotificationPermission:
    BrowserNotificationPermission;

  onEnableDesktopNotifications:
    () => void;

  onNotificationClick:
    (
      notification:
        DeadlineNotification,
    ) => void;

  onReadAllNotifications:
    () => void;

  onNotificationLeadDaysChange:
    (
      leadDays: number,
    ) => void;
}

export function TopNav({
  onDashboard,
  onHome,
  authUser,
  authPending,
  onSignIn,
  onSignOut,
  onAccount,
  notifications,
  notificationLeadDays,
  browserNotificationPermission,
  onEnableDesktopNotifications,
  onNotificationClick,
  onReadAllNotifications,
  onNotificationLeadDaysChange,
}: TopNavProps) {
  const accountLabel =
    authUser?.name?.trim() ||
    authUser?.email ||
    'Account';

  return (
    <Box
      component="header"
      sx={{
        position:
          'sticky',
        top:
          0,
        zIndex:
          20,
        backdropFilter:
          'blur(18px)',
        background:
          alpha(
            '#06070A',
            0.82,
          ),
        borderBottom:
          `1px solid ${alpha(
            '#ffffff',
            0.055,
          )}`,
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems:
            'center',
          justifyContent:
            'space-between',
          maxWidth:
            1220,
          mx:
            'auto',
          px: {
            xs:
              2,
            md:
              4,
          },
          height:
            76,
        }}
      >
        <Stack
          direction="row"
          spacing={
            1.2
          }
          onClick={
            onHome
          }
          sx={{
            alignItems:
              'center',
            cursor:
              'pointer',
            userSelect:
              'none',
          }}
        >
          <BrandMark />

          <Typography
            sx={{
              fontFamily:
                'Manrope',
              fontWeight:
                800,
              letterSpacing:
                '-0.04em',
            }}
          >
            Backstop
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={
            1
          }
          sx={{
            alignItems:
              'center',
          }}
        >
          <Button
            variant="text"
            startIcon={
              <DashboardRoundedIcon />
            }
            onClick={
              onDashboard
            }
            aria-label="Open My protection"
            sx={{
              minWidth: {
                xs:
                  42,
                sm:
                  'auto',
              },
              px: {
                xs:
                  1,
                sm:
                  1.5,
              },
              color:
                'text.secondary',
              '& .MuiButton-startIcon': {
                m: {
                  xs:
                    0,
                  sm:
                    '0 8px 0 -4px',
                },
              },
            }}
          >
            <Box
              component="span"
              sx={{
                display: {
                  xs:
                    'none',
                  sm:
                    'inline',
                },
              }}
            >
              My protection
            </Box>
          </Button>

          {authUser && (
            <NotificationCenter
              notifications={
                notifications
              }
              leadDays={
                notificationLeadDays
              }
              browserPermission={
                browserNotificationPermission
              }
              onEnableDesktopNotifications={
                onEnableDesktopNotifications
              }
              onNotificationClick={
                onNotificationClick
              }
              onReadAll={
                onReadAllNotifications
              }
              onLeadDaysChange={
                onNotificationLeadDaysChange
              }
            />
          )}

          {authUser ? (
            <>
              <Tooltip
                title={
                  `Account settings · ${authUser.email}`
                }
              >
                <Chip
                  clickable
                  onClick={
                    onAccount
                  }
                  size="small"
                  icon={
                    <AccountCircleRoundedIcon />
                  }
                  label={
                    accountLabel
                  }
                  sx={{
                    maxWidth:
                      170,
                    color:
                      '#A8F4DF',
                    bgcolor:
                      alpha(
                        '#61F4D5',
                        0.055,
                      ),
                    '& .MuiChip-label': {
                      overflow:
                        'hidden',
                      textOverflow:
                        'ellipsis',
                    },
                  }}
                />
              </Tooltip>

              <Tooltip
                title="Sign out"
              >
                <IconButton
                  aria-label="Sign out"
                  onClick={
                    onSignOut
                  }
                  sx={{
                    color:
                      'text.secondary',
                    border:
                      `1px solid ${alpha(
                        '#ffffff',
                        0.08,
                      )}`,
                  }}
                >
                  <LogoutRoundedIcon
                    fontSize="small"
                  />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={
                <LoginRoundedIcon />
              }
              disabled={
                authPending
              }
              onClick={
                onSignIn
              }
              sx={{
                borderColor:
                  alpha(
                    '#ffffff',
                    0.1,
                  ),
                color:
                  'text.primary',
                bgcolor:
                  alpha(
                    '#ffffff',
                    0.025,
                  ),
              }}
            >
              Sign in
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
