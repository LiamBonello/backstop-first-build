import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import NoteAddRoundedIcon from '@mui/icons-material/NoteAddRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  alpha,
} from '@mui/material/styles';

import {
  useState,
} from 'react';

import {
  resolutionStatusOptions,
} from '../mappers/resolutionMapper';

import type {
  ResolutionCase,
  ResolutionCaseStatus,
} from '../types/resolution';

interface ResolutionCaseViewProps {
  resolutionCase:
    ResolutionCase;
  onBackToPurchase:
    () => void;
  onStatusChange:
    (
      status:
        ResolutionCaseStatus,
    ) => Promise<void>;
  onAddNote:
    (
      note: string,
    ) => Promise<void>;
}

export function ResolutionCaseView({
  resolutionCase,
  onBackToPurchase,
  onStatusChange,
  onAddNote,
}: ResolutionCaseViewProps) {
  const [
    noteOpen,
    setNoteOpen,
  ] = useState(false);

  const [
    note,
    setNote,
  ] = useState('');

  const [
    copied,
    setCopied,
  ] = useState(false);

  const [
    savingNote,
    setSavingNote,
  ] = useState(false);

  const statusColor =
    resolutionCase.statusTone ===
      'positive'
      ? '#61F4D5'
      : resolutionCase.statusTone ===
          'warning'
        ? '#FFCA68'
        : '#9D7BFF';

  const handleCopy =
    async () => {
      try {
        await navigator.clipboard.writeText(
          resolutionCase.messageDraft,
        );

        setCopied(
          true,
        );

        window.setTimeout(
          () =>
            setCopied(
              false,
            ),
          1800,
        );
      } catch {
        setCopied(
          false,
        );
      }
    };

  const handleAddNote =
    async () => {
      const value =
        note.trim();

      if (
        !value ||
        savingNote
      ) {
        return;
      }

      setSavingNote(
        true,
      );

      try {
        await onAddNote(
          value,
        );

        setNote('');
        setNoteOpen(
          false,
        );
      } finally {
        setSavingNote(
          false,
        );
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
          xs:
            2,
          md:
            4,
        },
        py: {
          xs:
            5,
          md:
            8,
        },
      }}
    >
      <Button
        startIcon={
          <ArrowBackRoundedIcon />
        }
        onClick={
          onBackToPurchase
        }
        sx={{
          color:
            'text.secondary',
          ml:
            -1,
        }}
      >
        Back to purchase
      </Button>

      <Box
        sx={{
          mt:
            3,
          p: {
            xs:
              2.5,
            md:
              3.5,
          },
          borderRadius:
            5,
          border:
            `1px solid ${alpha(
              statusColor,
              0.15,
            )}`,
          bgcolor:
            alpha(
              '#0D1016',
              0.78,
            ),
          backgroundImage:
            `radial-gradient(circle at 100% 0%, ${alpha(
              statusColor,
              0.08,
            )}, transparent 34%)`,
        }}
      >
        <Stack
          direction={{
            xs:
              'column',
            md:
              'row',
          }}
          sx={{
            justifyContent:
              'space-between',
            alignItems: {
              xs:
                'stretch',
              md:
                'flex-start',
            },
            gap:
              3,
          }}
        >
          <Box>
            <Stack
              direction="row"
              spacing={
                1
              }
              useFlexGap
              sx={{
                flexWrap:
                  'wrap',
              }}
            >
              <Chip
                size="small"
                icon={
                  <GavelRoundedIcon />
                }
                label={
                  resolutionCase.statusLabel
                }
                sx={{
                  color:
                    statusColor,
                  bgcolor:
                    alpha(
                      statusColor,
                      0.06,
                    ),
                }}
              />

              <Chip
                size="small"
                label={
                  resolutionCase.issueLabel
                }
                sx={{
                  color:
                    'text.secondary',
                }}
              />

              {resolutionCase.evidenceAvailable && (
                <Chip
                  size="small"
                  icon={
                    <ShieldRoundedIcon />
                  }
                  label="Evidence attached"
                  sx={{
                    color:
                      '#A8F4DF',
                  }}
                />
              )}
            </Stack>

            <Typography
              variant="h2"
              sx={{
                mt:
                  2,
                fontSize: {
                  xs:
                    '2.4rem',
                  md:
                    '3.45rem',
                },
              }}
            >
              {resolutionCase.product}
            </Typography>

            <Typography
              sx={{
                mt:
                  0.8,
                color:
                  'text.secondary',
              }}
            >
              {resolutionCase.merchant} · purchased {resolutionCase.purchaseDateLabel}
            </Typography>
          </Box>

          <Box
            sx={{
              minWidth: {
                md:
                  250,
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color:
                  'text.secondary',
              }}
            >
              AMOUNT IN DISPUTE
            </Typography>

            <Typography
              sx={{
                mt:
                  0.4,
                fontFamily:
                  'Manrope',
                fontWeight:
                  800,
                fontSize:
                  '1.85rem',
              }}
            >
              {resolutionCase.amountInDisputeLabel}
            </Typography>

            <TextField
              select
              size="small"
              label="Case status"
              value={
                resolutionCase.status
              }
              onChange={(
                event,
              ) =>
                void onStatusChange(
                  event.target.value as ResolutionCaseStatus,
                )
              }
              fullWidth
              sx={{
                mt:
                  2,
              }}
            >
              {resolutionStatusOptions.map(
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
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          mt:
            3,
          display:
            'grid',
          gridTemplateColumns: {
            xs:
              '1fr',
            lg:
              'minmax(0, 1fr) minmax(0, 1.25fr)',
          },
          gap:
            3,
          alignItems:
            'start',
        }}
      >
        <Stack
          spacing={
            2
          }
        >
          <Box
            sx={{
              p:
                2.5,
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
                  '1.35rem',
              }}
            >
              Next action
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
              {resolutionCase.recommendedAction}
            </Typography>
          </Box>

          <Box
            sx={{
              p:
                2.5,
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
                  '1.35rem',
              }}
            >
              Case facts
            </Typography>

            <Stack
              spacing={
                1.4
              }
              sx={{
                mt:
                  2,
              }}
            >
              {[
                [
                  'Issue',
                  resolutionCase.issueLabel,
                ],
                [
                  'Requested outcome',
                  resolutionCase.desiredOutcome,
                ],
                [
                  'Purchase value',
                  resolutionCase.purchaseAmountLabel,
                ],
                [
                  'Return deadline',
                  resolutionCase.returnDeadlineLabel ??
                    'Not confirmed',
                ],
                [
                  'Last updated',
                  resolutionCase.updatedAtLabel,
                ],
              ].map(
                (
                  [
                    label,
                    value,
                  ],
                ) => (
                  <Stack
                    key={
                      label
                    }
                    direction="row"
                    sx={{
                      justifyContent:
                        'space-between',
                      alignItems:
                        'baseline',
                      gap:
                        2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          'text.secondary',
                      }}
                    >
                      {label}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight:
                          700,
                        textAlign:
                          'right',
                      }}
                    >
                      {value}
                    </Typography>
                  </Stack>
                ),
              )}
            </Stack>
          </Box>

          <Button
            variant="outlined"
            startIcon={
              <LaunchRoundedIcon />
            }
            component="a"
            href={
              `https://${resolutionCase.domain}`
            }
            target="_blank"
            rel="noreferrer"
          >
            Open merchant site
          </Button>
        </Stack>

        <Stack
          spacing={
            2
          }
        >
          <Box
            sx={{
              p:
                2.5,
              borderRadius:
                4,
              bgcolor:
                alpha(
                  '#9D7BFF',
                  0.04,
                ),
              border:
                `1px solid ${alpha(
                  '#9D7BFF',
                  0.12,
                )}`,
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
                    'stretch',
                  sm:
                    'center',
                },
                gap:
                  2,
              }}
            >
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontSize:
                      '1.35rem',
                  }}
                >
                  Merchant message
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mt:
                      0.5,
                    color:
                      'text.secondary',
                  }}
                >
                  A factual draft built from the purchase and case record.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={
                  <ContentCopyRoundedIcon />
                }
                onClick={() =>
                  void handleCopy()
                }
              >
                {copied
                  ? 'Copied'
                  : 'Copy message'}
              </Button>
            </Stack>

            <Box
              component="pre"
              sx={{
                mt:
                  2,
                mb:
                  0,
                p:
                  2,
                whiteSpace:
                  'pre-wrap',
                overflowWrap:
                  'anywhere',
                fontFamily:
                  'DM Sans, system-ui, sans-serif',
                fontSize:
                  '0.9rem',
                lineHeight:
                  1.65,
                color:
                  'text.secondary',
                bgcolor:
                  alpha(
                    '#06070A',
                    0.58,
                  ),
                borderRadius:
                  3,
                border:
                  `1px solid ${alpha(
                    '#ffffff',
                    0.055,
                  )}`,
              }}
            >
              {resolutionCase.messageDraft}
            </Box>
          </Box>

          <Box
            sx={{
              p:
                2.5,
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
            <Stack
              direction="row"
              sx={{
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                gap:
                  2,
              }}
            >
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontSize:
                      '1.35rem',
                  }}
                >
                  Case history
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mt:
                      0.4,
                    color:
                      'text.secondary',
                  }}
                >
                  Status changes and notes are persisted in PostgreSQL.
                </Typography>
              </Box>

              <Button
                size="small"
                startIcon={
                  <NoteAddRoundedIcon />
                }
                onClick={() =>
                  setNoteOpen(
                    true,
                  )
                }
              >
                Add note
              </Button>
            </Stack>

            <Stack
              spacing={
                1.4
              }
              sx={{
                mt:
                  2.2,
              }}
            >
              {resolutionCase.events.map(
                (
                  event,
                ) => (
                  <Box
                    key={
                      event.id
                    }
                    sx={{
                      pl:
                        1.6,
                      borderLeft:
                        `2px solid ${alpha(
                          event.type ===
                            'note'
                            ? '#FFCA68'
                            : '#9D7BFF',
                          0.38,
                        )}`,
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{
                        justifyContent:
                          'space-between',
                        gap:
                          2,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight:
                            700,
                        }}
                      >
                        {event.label}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            'text.secondary',
                          flexShrink:
                            0,
                        }}
                      >
                        {event.dateLabel}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{
                        mt:
                          0.35,
                        color:
                          'text.secondary',
                        lineHeight:
                          1.55,
                      }}
                    >
                      {event.detail}
                    </Typography>
                  </Box>
                ),
              )}
            </Stack>
          </Box>

          <Alert
            severity="info"
            variant="outlined"
            sx={{
              borderRadius:
                3,
              color:
                'text.secondary',
            }}
          >
            Backstop is an evidence and workflow tool, not legal advice. Consumer rights and escalation routes depend on the transaction and jurisdiction.
          </Alert>
        </Stack>
      </Box>

      <Dialog
        open={
          noteOpen
        }
        onClose={() =>
          savingNote
            ? undefined
            : setNoteOpen(
                false,
              )
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add case note
        </DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            multiline
            minRows={
              4
            }
            fullWidth
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
            placeholder="Record the merchant reply, promised refund date, escalation reference or another important event."
            sx={{
              mt:
                1,
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button
            disabled={
              savingNote
            }
            onClick={() =>
              setNoteOpen(
                false,
              )
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={
              savingNote ||
              !note.trim()
            }
            onClick={() =>
              void handleAddNote()
            }
          >
            {savingNote
              ? 'Saving…'
              : 'Save note'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
