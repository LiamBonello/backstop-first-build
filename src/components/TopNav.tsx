import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

import {
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material';

import {
  alpha,
} from '@mui/material/styles';

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
  notifications,
  notificationLeadDays,
  browserNotificationPermission,
  onEnableDesktopNotifications,
  onNotificationClick,
  onReadAllNotifications,
  onNotificationLeadDaysChange,
}: TopNavProps) {
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
            0.72,
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
          spacing={1.2}
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
          spacing={1}
          sx={{
            alignItems:
              'center',
          }}
        >
          <Button
            variant="text"
            onClick={
              onDashboard
            }
            sx={{
              color:
                'text.secondary',
              display: {
                xs:
                  'none',
                sm:
                  'inline-flex',
              },
            }}
          >
            My protection
          </Button>

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

          <Button
            variant="outlined"
            startIcon={
              <ShieldOutlinedIcon />
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
              '&:hover': {
                borderColor:
                  alpha(
                    '#9D7BFF',
                    0.45,
                  ),
                bgcolor:
                  alpha(
                    '#9D7BFF',
                    0.08,
                  ),
              },
            }}
          >
            Sign in
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
