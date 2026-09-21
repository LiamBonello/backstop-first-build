import {
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material';

import {
  alpha,
} from '@mui/material/styles';

interface AppFooterProps {
  onPrivacy:
    () => void;
}

export function AppFooter({
  onPrivacy,
}: AppFooterProps) {
  return (
    <Box
      component="footer"
      sx={{
        mt:
          8,
        borderTop:
          `1px solid ${alpha(
            '#ffffff',
            0.055,
          )}`,
        bgcolor:
          alpha(
            '#06070A',
            0.72,
          ),
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
          py:
            3,
          justifyContent:
            'space-between',
          alignItems: {
            xs:
              'flex-start',
            md:
              'center',
          },
          gap:
            1.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color:
              'text.secondary',
            maxWidth:
              760,
            lineHeight:
              1.6,
          }}
        >
          Backstop analyzes public commerce signals and keeps purchase evidence organized. It does not guarantee merchant legitimacy, policy enforceability or a particular dispute outcome.
        </Typography>

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
            size="small"
            onClick={
              onPrivacy
            }
            sx={{
              color:
                'text.secondary',
              minWidth:
                0,
            }}
          >
            Privacy & data
          </Button>

          <Typography
            variant="caption"
            sx={{
              color:
                'text.secondary',
              whiteSpace:
                'nowrap',
            }}
          >
            Authenticated MVP · Neon-backed
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
