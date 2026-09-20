import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import RadarRoundedIcon from '@mui/icons-material/RadarRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import { Box, Stack, Typography, alpha } from '@mui/material';

const cards = [
  {
    eyebrow: 'BEFORE',
    title: 'Expose the transaction.',
    description:
      'See commitments, suspicious pricing, return friction and merchant signals before money leaves your account.',
    icon: RadarRoundedIcon,
  },
  {
    eyebrow: 'AFTER',
    title: 'Turn receipts into protection.',
    description:
      'Return windows, warranties and renewals become active deadlines rather than forgotten text in an inbox.',
    icon: ShieldRoundedIcon,
  },
  {
    eyebrow: 'IF IT GOES WRONG',
    title: 'Build the evidence trail.',
    description:
      'Keep the terms, timeline and supporting material needed to escalate a refund, cancellation or dispute cleanly.',
    icon: GavelRoundedIcon,
  },
];

export function SignalSection() {
  return (
    <Box
      sx={{
        maxWidth: 1180,
        mx: 'auto',
        px: { xs: 2, md: 4 },
        pb: { xs: 10, md: 15 },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 1.4,
        }}
      >
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Box
              key={card.eyebrow}
              sx={{
                minHeight: 285,
                p: 3,
                borderRadius: 5,
                position: 'relative',
                overflow: 'hidden',
                bgcolor: alpha('#0D1016', 0.56),
                border: `1px solid ${alpha('#ffffff', 0.065)}`,
                transition: 'transform .3s ease, border-color .3s ease, background .3s ease',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  right: -90,
                  top: -90,
                  background:
                    index === 1
                      ? 'radial-gradient(circle, rgba(97,244,213,.13), transparent 67%)'
                      : 'radial-gradient(circle, rgba(157,123,255,.13), transparent 67%)',
                },
                '&:hover': {
                  transform: 'translateY(-5px)',
                  borderColor: alpha(index === 1 ? '#61F4D5' : '#9D7BFF', 0.2),
                  bgcolor: alpha('#11151D', 0.72),
                },
              }}
            >
              <Stack sx={{ height: '100%', position: 'relative', zIndex: 1 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '14px',
                    bgcolor: alpha(index === 1 ? '#61F4D5' : '#9D7BFF', 0.08),
                    color: index === 1 ? 'secondary.main' : 'primary.main',
                  }}
                >
                  <Icon />
                </Box>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '.12em', fontWeight: 700 }}>
                  {card.eyebrow}
                </Typography>
                <Typography variant="h3" sx={{ mt: 0.8, fontSize: '1.55rem' }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.1, lineHeight: 1.65 }}>
                  {card.description}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Box>

      <Stack alignItems="center" sx={{ pt: 5 }}>
        <Typography variant="caption" color="text.secondary">
          Backstop is designed to inform your decision, not make it for you.
        </Typography>
      </Stack>
    </Box>
  );
}
