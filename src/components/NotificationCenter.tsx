import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import DoneRoundedIcon from '@mui/icons-material/DoneRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';

import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  alpha,
} from '@mui/material/styles';

import {
  useState,
} from 'react';

import type {
  MouseEvent,
} from 'react';

import type {
  DeadlineNotification,
} from '../types/notification';

export type BrowserNotificationPermission =
  | NotificationPermission
  | 'unsupported';

interface NotificationCenterProps {
  notifications:
    DeadlineNotification[];

  leadDays:
    number;

  browserPermission:
    BrowserNotificationPermission;

  onEnableDesktopNotifications:
    () => void;

  onNotificationClick:
    (
      notification:
        DeadlineNotification,
    ) => void;

  onReadAll:
    () => void;

  onLeadDaysChange:
    (
      leadDays: number,
    ) => void;
}

export function NotificationCenter({
  notifications,
  leadDays,
  browserPermission,
  onEnableDesktopNotifications,
  onNotificationClick,
  onReadAll,
  onLeadDaysChange,
}: NotificationCenterProps) {
  const [
    anchorEl,
    setAnchorEl,
  ] = useState<HTMLElement | null>(
    null,
  );

  const unreadCount =
    notifications.filter(
      (notification) =>
        notification.unread,
    ).length;

  const open =
    Boolean(
      anchorEl,
    );

  const handleOpen = (
    event:
      MouseEvent<HTMLElement>,
  ) => {
    setAnchorEl(
      event.currentTarget,
    );
  };

  const handleClose =
    () => {
      setAnchorEl(
        null,
      );
    };

  return (
    <>
      <Tooltip
        title={
          unreadCount > 0
            ? `${unreadCount} unread reminder${unreadCount === 1 ? '' : 's'}`
            : 'Deadline reminders'
        }
      >
        <IconButton
          aria-label="Open deadline reminders"
          onClick={
            handleOpen
          }
          sx={{
            color:
              unreadCount > 0
                ? 'secondary.main'
                : 'text.secondary',

            border:
              `1px solid ${alpha(
                '#ffffff',
                0.08,
              )}`,

            bgcolor:
              alpha(
                '#ffffff',
                0.02,
              ),
          }}
        >
          <Badge
            badgeContent={
              unreadCount
            }
            color="warning"
            max={9}
          >
            {unreadCount > 0 ? (
              <NotificationsActiveRoundedIcon />
            ) : (
              <NotificationsNoneRoundedIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={
          open
        }
        anchorEl={
          anchorEl
        }
        onClose={
          handleClose
        }
        anchorOrigin={{
          vertical:
            'bottom',
          horizontal:
            'right',
        }}
        transformOrigin={{
          vertical:
            'top',
          horizontal:
            'right',
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.2,
              width: {
                xs:
                  'calc(100vw - 24px)',
                sm:
                  420,
              },
              maxHeight:
                'min(650px, calc(100vh - 100px))',
              bgcolor:
                '#0B0D12',
              backgroundImage:
                'radial-gradient(circle at 100% 0%, rgba(157,123,255,.12), transparent 34%)',
              border:
                `1px solid ${alpha(
                  '#ffffff',
                  0.08,
                )}`,
              borderRadius:
                3,
              boxShadow:
                '0 24px 70px rgba(0,0,0,.45)',
            },
          },
        }}
      >
        <Stack
          sx={{
            p: 2,
          }}
          spacing={1.5}
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
                sx={{
                  fontFamily:
                    'Manrope',
                  fontWeight:
                    800,
                  fontSize:
                    '1.15rem',
                }}
              >
                Deadline reminders
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color:
                    'text.secondary',
                }}
              >
                PostgreSQL-backed alerts for tracked purchase deadlines.
              </Typography>
            </Box>

            {unreadCount > 0 && (
              <Tooltip
                title="Mark all as read"
              >
                <IconButton
                  size="small"
                  onClick={
                    onReadAll
                  }
                  sx={{
                    color:
                      'text.secondary',
                  }}
                >
                  <DoneAllRoundedIcon
                    fontSize="small"
                  />
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          <Stack
            direction={{
              xs:
                'column',
              sm:
                'row',
            }}
            spacing={1}
            sx={{
              alignItems: {
                xs:
                  'stretch',
                sm:
                  'center',
              },
            }}
          >
            <TextField
              select
              size="small"
              label="Reminder window"
              value={
                leadDays
              }
              onChange={(
                event,
              ) =>
                onLeadDaysChange(
                  Number(
                    event.target.value,
                  ),
                )
              }
              sx={{
                minWidth:
                  150,
              }}
            >
              {[3, 7, 14, 30].map(
                (days) => (
                  <MenuItem
                    key={
                      days
                    }
                    value={
                      days
                    }
                  >
                    {days} days before
                  </MenuItem>
                ),
              )}
            </TextField>

            {browserPermission ===
              'granted' && (
              <Chip
                size="small"
                icon={
                  <NotificationsActiveRoundedIcon />
                }
                label="Desktop alerts on"
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
            )}

            {browserPermission ===
              'default' && (
              <Button
                size="small"
                variant="outlined"
                onClick={
                  onEnableDesktopNotifications
                }
              >
                Enable desktop alerts
              </Button>
            )}
          </Stack>

          {browserPermission ===
            'denied' && (
            <Typography
              variant="caption"
              sx={{
                color:
                  'warning.main',
              }}
            >
              Desktop notifications are blocked in this browser. You can re-enable them from the site permissions.
            </Typography>
          )}

          {browserPermission ===
            'unsupported' && (
            <Typography
              variant="caption"
              sx={{
                color:
                  'text.secondary',
              }}
            >
              This browser does not expose desktop notifications.
            </Typography>
          )}

          <Typography
            variant="caption"
            sx={{
              color:
                'text.secondary',
            }}
          >
            Desktop alerts are delivered while Backstop is open. In-app reminders remain stored in PostgreSQL.
          </Typography>
        </Stack>

        <Divider />

        <Stack
          sx={{
            p: 1.2,
          }}
          spacing={0.8}
        >
          {notifications.length ===
          0 ? (
            <Box
              sx={{
                px: 1.2,
                py: 3,
                textAlign:
                  'center',
              }}
            >
              <NotificationsNoneRoundedIcon
                sx={{
                  color:
                    'text.secondary',
                  opacity:
                    0.7,
                }}
              />

              <Typography
                sx={{
                  mt: 1,
                  fontWeight:
                    700,
                }}
              >
                No reminders due
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color:
                    'text.secondary',
                }}
              >
                Backstop will surface tracked deadlines when they enter your reminder window.
              </Typography>
            </Box>
          ) : (
            notifications.map(
              (
                notification,
              ) => (
                <Box
                  key={
                    notification.id
                  }
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onNotificationClick(
                      notification,
                    );
                    handleClose();
                  }}
                  onKeyDown={(
                    event,
                  ) => {
                    if (
                      event.key ===
                        'Enter' ||
                      event.key ===
                        ' '
                    ) {
                      event.preventDefault();

                      onNotificationClick(
                        notification,
                      );

                      handleClose();
                    }
                  }}
                  sx={{
                    px: 1.4,
                    py: 1.3,
                    borderRadius:
                      2.5,
                    cursor:
                      'pointer',
                    outline:
                      'none',
                    opacity:
                      notification.unread
                        ? 1
                        : 0.72,
                    bgcolor:
                      notification.unread
                        ? alpha(
                            '#9D7BFF',
                            0.08,
                          )
                        : alpha(
                            '#ffffff',
                            0.012,
                          ),
                    border:
                      `1px solid ${alpha(
                        notification.unread
                          ? '#9D7BFF'
                          : '#ffffff',
                        notification.unread
                          ? 0.18
                          : 0.05,
                      )}`,
                    '&:hover': {
                      bgcolor:
                        alpha(
                          '#9D7BFF',
                          0.1,
                        ),
                    },
                    '&:focus-visible': {
                      borderColor:
                        alpha(
                          '#9D7BFF',
                          0.4,
                        ),
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.2}
                    sx={{
                      alignItems:
                        'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        mt: 0.45,
                        width: 18,
                        height: 18,
                        flex:
                          '0 0 auto',
                        display:
                          'grid',
                        placeItems:
                          'center',
                        borderRadius:
                          '50%',
                        color:
                          notification.unread
                            ? 'warning.main'
                            : 'text.secondary',
                        bgcolor:
                          notification.unread
                            ? alpha(
                                '#FFCA68',
                                0.08,
                              )
                            : alpha(
                                '#ffffff',
                                0.035,
                              ),
                      }}
                    >
                      {notification.unread ? (
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius:
                              '50%',
                            bgcolor:
                              'warning.main',
                          }}
                        />
                      ) : (
                        <DoneRoundedIcon
                          sx={{
                            fontSize:
                              13,
                          }}
                        />
                      )}
                    </Box>

                    <Box
                      sx={{
                        minWidth:
                          0,
                        flex:
                          1,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems:
                            'center',
                          justifyContent:
                            'space-between',
                          gap: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight:
                              700,
                            lineHeight:
                              1.35,
                          }}
                        >
                          {notification.title}
                        </Typography>

                        {!notification.unread && (
                          <Typography
                            variant="caption"
                            sx={{
                              flexShrink:
                                0,
                              color:
                                'text.secondary',
                              textTransform:
                                'uppercase',
                              letterSpacing:
                                '0.05em',
                              fontSize:
                                '0.62rem',
                            }}
                          >
                            Read
                          </Typography>
                        )}
                      </Stack>

                      <Typography
                        variant="caption"
                        sx={{
                          display:
                            'block',
                          mt: 0.35,
                          color:
                            'text.secondary',
                        }}
                      >
                        {notification.detail}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          display:
                            'block',
                          mt: 0.6,
                          color:
                            'secondary.main',
                        }}
                      >
                        Deadline {notification.deadlineLabel}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ),
            )
          )}
        </Stack>
      </Popover>
    </>
  );
}
