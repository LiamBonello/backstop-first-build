import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import {
  useState,
} from 'react';

import type {
  Finding,
  Severity,
} from '../types/purchase';

interface FindingCardProps {
  finding: Finding;
  index: number;
}

const presentation: Record<
  Severity,
  {
    color: string;
    icon:
      typeof ErrorRoundedIcon;
  }
> = {
  critical: {
    color:
      '#FF6B81',
    icon:
      ErrorRoundedIcon,
  },

  warning: {
    color:
      '#FFCA68',
    icon:
      WarningAmberRoundedIcon,
  },

  positive: {
    color:
      '#60E6B7',
    icon:
      CheckCircleRoundedIcon,
  },

  neutral: {
    color:
      '#93A2B8',
    icon:
      InfoRoundedIcon,
  },
};

export function FindingCard({
  finding,
  index,
}: FindingCardProps) {
  const [
    expanded,
    setExpanded,
  ] = useState(
    index === 0,
  );

  const config =
    presentation[
      finding.severity
    ];

  const Icon =
    config.icon;

  return (
    <Box
      sx={{
        borderRadius:
          4,

        border:
          `1px solid ${alpha(
            '#ffffff',
            0.07,
          )}`,

        bgcolor:
          alpha(
            '#0D1016',
            0.74,
          ),

        overflow:
          'hidden',

        transition:
          'transform .25s ease, border-color .25s ease, background .25s ease',

        animation:
          `findingIn .5s ${
            index *
            70
          }ms both ease`,

        '@keyframes findingIn':
          {
            from: {
              opacity:
                0,

              transform:
                'translateY(12px)',
            },

            to: {
              opacity:
                1,

              transform:
                'translateY(0)',
            },
          },

        '&:hover': {
          transform:
            'translateY(-2px)',

          borderColor:
            alpha(
              config.color,
              0.22,
            ),

          bgcolor:
            alpha(
              '#11151D',
              0.86,
            ),
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1.6}
        onClick={() =>
          setExpanded(
            (value) =>
              !value,
          )
        }
        sx={{
          alignItems: "flex-start",
          p: 2.2,

          cursor:
            'pointer'
        }}>
        <Box
          sx={{
            width:
              38,

            height:
              38,

            borderRadius:
              '12px',

            display:
              'grid',

            placeItems:
              'center',

            flexShrink:
              0,

            bgcolor:
              alpha(
                config.color,
                0.08,
              ),

            border:
              `1px solid ${alpha(
                config.color,
                0.16,
              )}`,

            color:
              config.color,
          }}
        >
          <Icon
            sx={{
              fontSize:
                20,
            }}
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <Stack
            direction={{
              xs:
                'column',
              sm: 'row',
            }}
            sx={{
              justifyContent: "space-between",
              gap: 1
            }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color:
                    config.color,

                  fontWeight:
                    700,
                }}
              >
                {finding.category.toUpperCase()}
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,

                  fontWeight:
                    700,

                  lineHeight:
                    1.35,
                }}
              >
                {
                  finding.title
                }
              </Typography>
            </Box>

            <Chip
              size="small"

              label={
                finding.sourceLabel
              }

              sx={{
                alignSelf:
                  'flex-start',

                color:
                  'text.secondary',

                bgcolor:
                  alpha(
                    '#ffffff',
                    0.025,
                  ),
              }}
            />
          </Stack>

          <Box
            sx={{
              display:
                'grid',

              gridTemplateRows:
                expanded
                  ? '1fr'
                  : '0fr',

              transition:
                'grid-template-rows .3s ease',
            }}
          >
            <Box
              sx={{
                overflow:
                  'hidden',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  pt: 1.3,

                  lineHeight:
                    1.65
                }}>
                {
                  finding.detail
                }
              </Typography>

              {finding.sourceUrl && (
                <Button
                  component="a"

                  href={
                    finding.sourceUrl
                  }

                  target="_blank"

                  rel="noreferrer"

                  size="small"

                  endIcon={
                    <LaunchRoundedIcon
                      sx={{
                        fontSize:
                          '15px !important',
                      }}
                    />
                  }

                  onClick={
                    (
                      event,
                    ) =>
                      event.stopPropagation()
                  }

                  sx={{
                    mt: 1.2,

                    ml: -1,

                    color:
                      'primary.light',
                  }}
                >
                  Open source page
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        <IconButton
          size="small"

          onClick={(
            event,
          ) => {
            event.stopPropagation();

            setExpanded(
              (value) =>
                !value,
            );
          }}

          sx={{
            color:
              'text.secondary',

            mt: 0.3,
          }}
        >
          {expanded ? (
            <RemoveRoundedIcon />
          ) : (
            <AddRoundedIcon />
          )}
        </IconButton>
      </Stack>
    </Box>
  );
}