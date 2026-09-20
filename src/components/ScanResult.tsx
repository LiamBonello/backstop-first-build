import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import DataObjectRoundedIcon from '@mui/icons-material/DataObjectRounded';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import type { PurchaseScan } from '../types/purchase';
import { FindingCard } from './FindingCard';
import { ProtectionDrawer } from './ProtectionDrawer';

interface ScanResultProps {
  scan: PurchaseScan;
  protectedPurchase: boolean;
  onProtect: () => void;
  onNewScan: () => void;
  onDashboard: () => void;
}

export function ScanResult({
  scan,
  protectedPurchase,
  onProtect,
  onNewScan,
  onDashboard,
}: ScanResultProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const riskAngle = Math.min(100, Math.max(0, scan.risk)) * 3.6;

  const handleProtect = () => {
    onProtect();
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 5, md: 8 } }}>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={onNewScan}
        sx={{ color: 'text.secondary', mb: 3, ml: -1 }}
      >
        New scan
      </Button>

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          p: { xs: 2.7, md: 4 },
          borderRadius: 5,
          border: `1px solid ${alpha('#ffffff', 0.08)}`,
          background:
            'linear-gradient(145deg, rgba(18,20,28,.92), rgba(10,12,17,.84))',
          boxShadow: '0 35px 110px rgba(0,0,0,.32)',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 420,
            height: 420,
            right: -130,
            top: -180,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,202,104,.12), transparent 67%)',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 280px' },
            gap: { xs: 4, md: 7 },
            alignItems: 'center',
          }}
        >
          <Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                icon={<VerifiedUserOutlinedIcon />}
                label={`${scan.confidence}% analysis confidence`}
                sx={{ bgcolor: alpha('#61F4D5', 0.06), color: '#9AF8E4' }}
              />
              <Chip size="small" label={`Scanned ${scan.scannedAtLabel}`} sx={{ color: 'text.secondary' }} />
            </Stack>

            <Typography color="text.secondary" sx={{ mt: 3, mb: 0.5 }}>
              {scan.merchant} · {scan.domain}
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '2.35rem', md: '3.35rem' }, maxWidth: 680 }}>
              {scan.product}
            </Typography>
            <Typography sx={{ mt: 1.3, fontSize: '1.1rem', color: 'text.secondary' }}>
              Purchase value {scan.amountLabel}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.3} sx={{ mt: 3.5 }}>
              {protectedPurchase ? (
                <Button
                  variant="contained"
                  startIcon={<CheckRoundedIcon />}
                  onClick={onDashboard}
                  sx={{
                    height: 50,
                    color: '#07100D',
                    background: 'linear-gradient(110deg, #A8F4D9, #6FF1D3)',
                  }}
                >
                  Purchase protected
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<ShieldOutlinedIcon />}
                  onClick={() => setDrawerOpen(true)}
                  sx={{
                    height: 50,
                    color: '#080A0F',
                    background: 'linear-gradient(110deg, #B89EFF, #6AF3D7)',
                  }}
                >
                  Protect this purchase
                </Button>
              )}
              <Button
                variant="outlined"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ borderColor: alpha('#ffffff', 0.1), color: 'text.primary', height: 50 }}
              >
                View evidence
              </Button>
            </Stack>
          </Box>

          <Stack alignItems="center">
            <Box
              sx={{
                width: 220,
                height: 220,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: `conic-gradient(#FFCA68 0deg, #FF7A89 ${riskAngle}deg, ${alpha('#ffffff', 0.055)} ${riskAngle}deg 360deg)`,
                position: 'relative',
                boxShadow: '0 0 70px rgba(255,125,125,.08)',
                animation: 'meterIn .9s cubic-bezier(.2,.8,.2,1) both',
                '@keyframes meterIn': {
                  from: { transform: 'scale(.78) rotate(-12deg)', opacity: 0 },
                  to: { transform: 'scale(1) rotate(0)', opacity: 1 },
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 10,
                  borderRadius: '50%',
                  background: '#0B0E13',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)',
                },
              }}
            >
              <Stack alignItems="center" sx={{ position: 'relative' }}>
                <Typography sx={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: '3.4rem', lineHeight: 1 }}>
                  {scan.risk}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.7 }}>
                  RISK SIGNAL
                </Typography>
                <Typography sx={{ mt: 1.2, color: 'warning.main', fontWeight: 700 }}>
                  {scan.verdict}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 6,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.8fr) minmax(300px,.75fr)' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2.1 }}>
            <Box>
              <Typography variant="h3" sx={{ fontSize: '1.6rem' }}>
                What matters
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Expand any finding to see why Backstop surfaced it.
              </Typography>
            </Box>
          </Stack>
          <Stack spacing={1.3}>
            {scan.findings.map((finding, index) => (
              <FindingCard key={finding.id} finding={finding} index={index} />
            ))}
          </Stack>
        </Box>

        <Stack spacing={2}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 4,
              border: `1px solid ${alpha('#ffffff', 0.07)}`,
              bgcolor: alpha('#0D1016', 0.72),
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <DataObjectRoundedIcon sx={{ color: 'primary.main' }} />
              <Typography fontWeight={700}>Evidence, not a verdict</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.3, lineHeight: 1.65 }}>
              Backstop surfaces evidence and transaction conditions. You stay in control of the purchase decision.
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2.5,
              borderRadius: 4,
              background:
                'linear-gradient(145deg, rgba(157,123,255,.10), rgba(97,244,213,.045))',
              border: `1px solid ${alpha('#9D7BFF', 0.15)}`,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              IF YOU BUY IT
            </Typography>
            <Typography variant="h3" sx={{ mt: 0.8, fontSize: '1.55rem' }}>
              Don&apos;t make yourself remember the deadlines.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.1, lineHeight: 1.65 }}>
              Save the return window, warranty and renewal terms as a protected purchase.
            </Typography>
            <Button
              fullWidth
              onClick={() => (protectedPurchase ? onDashboard() : setDrawerOpen(true))}
              sx={{ mt: 2.2, bgcolor: alpha('#ffffff', 0.055), color: 'text.primary', height: 46 }}
            >
              {protectedPurchase ? 'Open protection' : 'See protection details'}
            </Button>
          </Box>
        </Stack>
      </Box>

      <ProtectionDrawer
        open={drawerOpen}
        scan={scan}
        onClose={() => setDrawerOpen(false)}
        onProtect={handleProtect}
      />
    </Box>
  );
}
