import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';

import {
  Box,
  Button,
  Chip,
  Stack,
  Tooltip,
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

          <Tooltip
            title="Local-first mode. Purchase, reminder and case data are stored in your PostgreSQL instance."
          >
            <Chip
              size="small"
              icon={
                <StorageRoundedIcon />
              }
              label="Local mode"
              sx={{
                display: {
                  xs:
                    'none',
                  md:
                    'inline-flex',
                },
                color:
                  'text.secondary',
                bgcolor:
                  alpha(
                    '#ffffff',
                    0.025,
                  ),
              }}
            />
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
}
