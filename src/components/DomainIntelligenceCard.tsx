import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import DnsRoundedIcon from "@mui/icons-material/DnsRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { DomainIntelligence } from "../types/purchase";

interface DomainIntelligenceCardProps {
  intelligence: DomainIntelligence;
}

export function DomainIntelligenceCard({
  intelligence,
}: DomainIntelligenceCardProps) {
  const rows = [
    {
      icon: PublicRoundedIcon,
      label: "Domain",
      value: intelligence.registrableDomain,
      color: "text.primary",
    },
    {
      icon: BusinessRoundedIcon,
      label: "Registration",
      value:
        intelligence.ageLabel === "Not available"
          ? "Not available"
          : `${intelligence.ageLabel} · ${intelligence.registrationDateLabel}`,
      color: "text.primary",
    },
    {
      icon: BusinessRoundedIcon,
      label: "Registrar",
      value: intelligence.registrarLabel,
      color: "text.primary",
    },
    {
      icon: DnsRoundedIcon,
      label: "DNS",
      value: intelligence.dnsLabel,
      color: "text.primary",
    },
    {
      icon: LockRoundedIcon,
      label: "TLS",
      value: intelligence.tlsLabel,
      color:
        intelligence.tlsState === "valid"
          ? "secondary.main"
          : intelligence.tlsState === "issue"
            ? "error.light"
            : "text.secondary",
    },
  ] as const;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 4,
        border: `1px solid ${alpha("#61F4D5", 0.11)}`,
        bgcolor: alpha("#0D1016", 0.74),
        backgroundImage:
          "radial-gradient(circle at 100% 0%, rgba(97,244,213,.055), transparent 40%)",
      }}
    >
      <Typography sx={{ fontWeight: 700 }}>
        Independent domain evidence
      </Typography>

      <Typography
        variant="caption"
        sx={{
          mt: 0.35,
          display: "block",
          color: "text.secondary",
          lineHeight: 1.55,
        }}
      >
        Registration, DNS and TLS signals gathered independently of the merchant page.
      </Typography>

      <Stack spacing={1.35} sx={{ mt: 2.2 }}>
        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <Stack
              key={row.label}
              direction="row"
              spacing={1.2}
              sx={{
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "10px",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  color: "primary.light",
                  bgcolor: alpha("#9D7BFF", 0.07),
                }}
              >
                <Icon sx={{ fontSize: 16 }} />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    display: "block",
                  }}
                >
                  {row.label}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: row.color,
                    fontWeight: 700,
                    lineHeight: 1.45,
                    overflowWrap: "anywhere",
                  }}
                >
                  {row.value}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Stack>

      {intelligence.rdapSourceUrl && (
        <Button
          component="a"
          href={intelligence.rdapSourceUrl}
          target="_blank"
          rel="noreferrer"
          size="small"
          endIcon={<LaunchRoundedIcon sx={{ fontSize: "15px !important" }} />}
          sx={{
            mt: 1.8,
            ml: -1,
            color: "primary.light",
          }}
        >
          Open RDAP source
        </Button>
      )}

      <Typography
        variant="caption"
        sx={{
          mt: 1,
          display: "block",
          color: "text.secondary",
          lineHeight: 1.55,
        }}
      >
        Domain age and infrastructure are identity signals, not proof that a merchant is trustworthy.
      </Typography>
    </Box>
  );
}
