import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import { Box, Button, Drawer, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { PurchaseScan } from '../types/purchase';

interface ProtectionDrawerProps {
  open: boolean;
  scan: PurchaseScan;
  onClose: () => void;
  onProtect: () => void;
}

export function ProtectionDrawer({ open, scan, onClose, onProtect }: ProtectionDrawerProps) {
  const rows = [
    {
      icon: CalendarMonthRoundedIcon,
      label: 'Return deadline',
      value: scan.protection.returnDeadlineLabel,
    },
    {
      icon: SecurityRoundedIcon,
      label: 'Warranty tracked',
      value: scan.protection.warrantyLabel,
    },
    {
      icon: NotificationsActiveRoundedIcon,
      label: 'Upcoming renewal',
      value: scan.protection.renewalLabel ?? 'None detected',
    },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 460 },
            bgcolor: '#090B10',
            backgroundImage:
              'radial-gradient(circle at 100% 0%, rgba(157,123,255,.14), transparent 30%)',
            borderLeft: `1px solid ${alpha('#ffffff', 0.07)}`,
            p: { xs: 2.5, sm: 4 },
          },
        },
      }}
    >
      <Stack sx={{ height: '100%' }}>
        <Box
          sx={{
            width: 54,
            height: 54,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '17px',
            bgcolor: alpha('#9D7BFF', 0.11),
            color: 'primary.main',
            border: `1px solid ${alpha('#9D7BFF', 0.18)}`,
          }}
        >
          <ShieldRoundedIcon />
        </Box>

        <Typography variant="h3" sx={{ mt: 3, fontSize: '2.2rem' }}>
          Protect this purchase
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.2, lineHeight: 1.65 }}>
          Backstop saves the important terms and turns them into deadlines you can actually use.
        </Typography>

        <Stack spacing={1.2} sx={{ mt: 4 }}>
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <Stack
                key={row.label}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                  p: 1.7,
                  borderRadius: 3,
                  bgcolor: alpha('#ffffff', 0.025),
                  border: `1px solid ${alpha('#ffffff', 0.06)}`,
                }}
              >
                <Icon sx={{ color: 'secondary.main', fontSize: 20 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {row.label}
                  </Typography>
                  <Typography fontWeight={700}>{row.value}</Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>

        <Box
          sx={{
            mt: 3,
            p: 2.1,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha('#FFCA68', 0.09)}, ${alpha('#FF6B81', 0.05)})`,
            border: `1px solid ${alpha('#FFCA68', 0.14)}`,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            MONEY CURRENTLY AT RISK
          </Typography>
          <Typography sx={{ mt: 0.4, fontFamily: 'Manrope', fontSize: '1.65rem', fontWeight: 700 }}>
            {scan.protection.moneyAtRiskLabel}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Stack spacing={1.2} sx={{ pt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={onProtect}
            sx={{
              height: 54,
              color: '#07100D',
              background: 'linear-gradient(110deg, #B69BFF, #66F4D6)',
              '&:hover': { background: 'linear-gradient(110deg, #C5B1FF, #7EFBE1)' },
            }}
          >
            Start protection
          </Button>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
            Not now
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
