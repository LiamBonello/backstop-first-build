import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { BrandMark } from './BrandMark';

interface TopNavProps {
  onDashboard: () => void;
  onHome: () => void;
}

export function TopNav({ onDashboard, onHome }: TopNavProps) {
  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backdropFilter: 'blur(18px)',
        background: alpha('#06070A', 0.72),
        borderBottom: `1px solid ${alpha('#ffffff', 0.055)}`,
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1220,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          height: 76
        }}>
        <Stack
          direction="row"
          spacing={1.2}
          onClick={onHome}
          sx={{
            alignItems: "center",
            cursor: 'pointer',
            userSelect: 'none'
          }}>
          <BrandMark />
          <Typography sx={{ fontFamily: 'Manrope', fontWeight: 800, letterSpacing: '-0.04em' }}>
            Backstop
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{
          alignItems: "center"
        }}>
          <Button
            variant="text"
            onClick={onDashboard}
            sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'inline-flex' } }}
          >
            My protection
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShieldOutlinedIcon />}
            sx={{
              borderColor: alpha('#ffffff', 0.1),
              color: 'text.primary',
              bgcolor: alpha('#ffffff', 0.025),
              '&:hover': {
                borderColor: alpha('#9D7BFF', 0.45),
                bgcolor: alpha('#9D7BFF', 0.08),
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
