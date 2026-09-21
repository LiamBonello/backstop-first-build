import PolicyRoundedIcon from '@mui/icons-material/PolicyRounded';

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Stack,
  Typography,
} from '@mui/material';

import {
  alpha,
} from '@mui/material/styles';

interface PrivacyDialogProps {
  open: boolean;
  onClose:
    () => void;
}

export function PrivacyDialog({
  open,
  onClose,
}: PrivacyDialogProps) {
  return (
    <Dialog
      open={
        open
      }
      onClose={
        onClose
      }
      maxWidth="md"
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
                'secondary.main',
              bgcolor:
                alpha(
                  '#9D7BFF',
                  0.075,
                ),
            }}
          >
            <PolicyRoundedIcon />
          </Box>

          <Box>
            <Typography
              variant="h3"
              sx={{
                fontSize:
                  '1.7rem',
              }}
            >
              Privacy & data use
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt:
                  0.25,
                color:
                  'text.secondary',
              }}
            >
              How this Backstop MVP handles account and purchase data.
            </Typography>
          </Box>
        </Stack>

        <Stack
          spacing={
            2.3
          }
          sx={{
            mt:
              3,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontWeight:
                  700,
              }}
            >
              Data Backstop stores
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt:
                  0.6,
                color:
                  'text.secondary',
                lineHeight:
                  1.7,
              }}
            >
              Backstop stores your account name and email through Neon Auth, plus protected-purchase details, dates, saved scan evidence, reminder preferences, resolution-case details and notes that you choose to create.
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                fontWeight:
                  700,
              }}
            >
              Scan processing
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt:
                  0.6,
                color:
                  'text.secondary',
                lineHeight:
                  1.7,
              }}
            >
              Public product URLs are processed by the Backstop server to inspect merchant pages and public signals. Scans can query third-party public services including RDAP/DNS/TLS infrastructure, Google Web Risk and GLEIF. Backstop does not ask you for payment-card credentials.
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                fontWeight:
                  700,
              }}
            >
              Hosting and authentication
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt:
                  0.6,
                color:
                  'text.secondary',
                lineHeight:
                  1.7,
              }}
            >
              The hosted MVP runs on Render. Account authentication and PostgreSQL storage run on Neon. Protected API requests use signed Neon authentication tokens that Backstop verifies server-side.
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                fontWeight:
                  700,
              }}
            >
              Your controls
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt:
                  0.6,
                color:
                  'text.secondary',
                lineHeight:
                  1.7,
              }}
            >
              Signed-in users can download a JSON copy of their stored Backstop data and permanently delete their account and associated Backstop records from Account settings.
            </Typography>
          </Box>

          <Box>
            <Typography
              sx={{
                fontWeight:
                  700,
              }}
            >
              Operational logs
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt:
                  0.6,
                color:
                  'text.secondary',
                lineHeight:
                  1.7,
              }}
            >
              Backstop records minimal server request metadata for reliability and abuse monitoring, including request method, path, response status, duration and a generated request ID. Request bodies, account passwords and authentication tokens are not written to these application request logs.
            </Typography>
          </Box>
        </Stack>

        <Typography
          variant="caption"
          sx={{
            display:
              'block',
            mt:
              3,
            color:
              'text.secondary',
            lineHeight:
              1.6,
          }}
        >
          This in-product notice describes the current MVP implementation. A broader public launch should replace it with the final business privacy notice, controller/contact details, lawful-basis disclosures and jurisdiction-specific terms.
        </Typography>

        <Button
          onClick={
            onClose
          }
          sx={{
            mt:
              2,
          }}
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
