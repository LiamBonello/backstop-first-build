import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ContentPasteRoundedIcon from '@mui/icons-material/ContentPasteRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import { DEMO_URL } from '../mocks/scan';
import { ScanProgress } from './ScanProgress';

interface HeroScannerProps {
  isScanning: boolean;
  onScan: (url: string) => void;
}

export function HeroScanner({ isScanning, onScan }: HeroScannerProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const value = url.trim();
    if (!value) {
      setError('Paste a store, product or checkout URL.');
      return;
    }

    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      new URL(normalized);
    } catch {
      setError('That does not look like a valid URL.');
      return;
    }

    setError('');
    onScan(normalized);
  };

  const useDemo = () => {
    setUrl(DEMO_URL);
    setError('');
    onScan(DEMO_URL);
  };

  return (
    <Stack
      sx={{
        alignItems: "center",
        maxWidth: 980,
        mx: 'auto',
        pt: { xs: 9, md: 14 },
        pb: { xs: 9, md: 13 },
        px: 2,
        textAlign: 'center'
      }}>
      <Chip
        icon={<BoltRoundedIcon />}
        label="Independent purchase intelligence"
        sx={{
          mb: 3,
          color: '#DCD3FF',
          bgcolor: alpha('#9D7BFF', 0.075),
          borderColor: alpha('#9D7BFF', 0.18),
          '& .MuiChip-icon': { color: 'secondary.main' },
        }}
      />

      <Typography
        variant="h1"
        sx={{
          maxWidth: 900,
          fontSize: { xs: '3.15rem', sm: '4.6rem', md: '6rem' },
          lineHeight: { xs: 0.98, sm: 0.96 },
          background:
            'linear-gradient(180deg, #FFFFFF 0%, #D8DCE6 72%, #8E95A3 115%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textWrap: 'balance',
        }}
      >
        Know what you&apos;re really buying.
      </Typography>

      <Typography
        sx={{
          mt: 3,
          maxWidth: 680,
          color: 'text.secondary',
          fontSize: { xs: '1rem', md: '1.14rem' },
          lineHeight: 1.7,
        }}
      >
        Backstop reads the signals people usually discover too late: hidden commitments,
        return friction, suspicious pricing, seller risk and the deadlines that protect your money.
      </Typography>

      <Box
        sx={{
          mt: 5,
          width: '100%',
          maxWidth: 820,
          p: '1px',
          borderRadius: '22px',
          background:
            'linear-gradient(110deg, rgba(255,255,255,.12), rgba(157,123,255,.28), rgba(97,244,213,.18), rgba(255,255,255,.08))',
          boxShadow: '0 34px 100px rgba(0,0,0,.42), 0 0 70px rgba(157,123,255,.08)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{
            p: 1,
            bgcolor: alpha('#0A0C10', 0.94),
            borderRadius: '21px',
            backdropFilter: 'blur(24px)',
          }}
        >
          <TextField
            fullWidth
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit();
            }}
            placeholder="Paste a product, store or checkout URL"
            error={Boolean(error)}
            helperText={error || ' '}
            slotProps={{
              input: {
                startAdornment: (
                  <ContentPasteRoundedIcon sx={{ mr: 1.2, color: 'text.secondary', fontSize: 21 }} />
                ),
              },
              formHelperText: {
                sx: { position: 'absolute', top: '100%', left: 8, mt: 0.5 },
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: 56,
                borderRadius: '15px',
                bgcolor: alpha('#ffffff', 0.02),
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: alpha('#ffffff', 0.08) },
                '&.Mui-focused fieldset': { borderColor: alpha('#9D7BFF', 0.42) },
              },
            }}
          />
          <Button
            onClick={submit}
            disabled={isScanning}
            variant="contained"
            startIcon={<SearchRoundedIcon />}
            sx={{
              minWidth: { xs: '100%', sm: 150 },
              height: 56,
              px: 2.6,
              color: '#07090D',
              background: 'linear-gradient(110deg, #B79CFF, #6CF5D9)',
              boxShadow: '0 12px 34px rgba(120,220,200,.18)',
              '&:hover': {
                background: 'linear-gradient(110deg, #C4AEFF, #82FAE2)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Analyze
          </Button>
        </Stack>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.2, sm: 2.4 }}
        sx={{
          alignItems: "center",
          mt: 2.8
        }}>
        <Stack direction="row" spacing={0.8} sx={{
          alignItems: "center"
        }}>
          <LockOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
            No account required to scan
          </Typography>
        </Stack>
        <Button
          size="small"
          onClick={useDemo}
          endIcon={<ArrowOutwardRoundedIcon sx={{ fontSize: '15px !important' }} />}
          sx={{ color: '#C8B9FF', minWidth: 0, p: 0 }}
        >
          Try a demo purchase
        </Button>
      </Stack>

      {isScanning && <ScanProgress />}
    </Stack>
  );
}
