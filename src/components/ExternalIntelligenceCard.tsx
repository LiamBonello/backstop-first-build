import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ExternalIntelligence } from "../types/purchase";

interface ExternalIntelligenceCardProps {
  intelligence: ExternalIntelligence;
}

const statusColor = {
  positive: "#61F4D5",
  warning: "#FFCA68",
  critical: "#FF6B81",
  neutral: "#93A2B8",
} as const;

export function ExternalIntelligenceCard({
  intelligence,
}: ExternalIntelligenceCardProps) {
  const threatColor = statusColor[intelligence.threat.tone];
  const companyColor = statusColor[intelligence.company.tone];

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 4,
        border: `1px solid ${alpha("#9D7BFF", 0.13)}`,
        bgcolor: alpha("#0D1016", 0.74),
        backgroundImage:
          "radial-gradient(circle at 0% 0%, rgba(157,123,255,.06), transparent 40%)",
      }}
    >
      <Stack
        direction="row"
        spacing={1.1}
        sx={{
          alignItems: "center",
        }}
      >
        <PolicyRoundedIcon
          sx={{
            color: "primary.main",
            fontSize: 20,
          }}
        />

        <Box>
          <Typography sx={{ fontWeight: 700 }}>
            External intelligence
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
            }}
          >
            Optional independent checks beyond the merchant website.
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={2.2} sx={{ mt: 2.4 }}>
        <Box>
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <SecurityRoundedIcon
                sx={{
                  color: threatColor,
                  fontSize: 18,
                  flexShrink: 0,
                }}
              />

              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Threat screening
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.25,
                    display: "block",
                    color: "text.secondary",
                    lineHeight: 1.5,
                  }}
                >
                  {intelligence.threat.detailLabel}
                </Typography>
              </Box>
            </Stack>

            <Chip
              size="small"
              label={intelligence.threat.statusLabel}
              sx={{
                flexShrink: 0,
                color: threatColor,
                bgcolor: alpha(threatColor, 0.07),
              }}
            />
          </Stack>
        </Box>

        <Box
          sx={{
            height: "1px",
            bgcolor: alpha("#ffffff", 0.055),
          }}
        />

        <Box>
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "flex-start",
                minWidth: 0,
              }}
            >
              <BusinessRoundedIcon
                sx={{
                  mt: 0.1,
                  color: companyColor,
                  fontSize: 18,
                  flexShrink: 0,
                }}
              />

              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Company identity
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.25,
                    display: "block",
                    color: "text.secondary",
                    lineHeight: 1.5,
                  }}
                >
                  {intelligence.company.publishedIdentityLabel}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.35,
                    display: "block",
                    color: companyColor,
                    lineHeight: 1.5,
                  }}
                >
                  {intelligence.company.registryDetailLabel}
                </Typography>
              </Box>
            </Stack>

            <Chip
              size="small"
              label={intelligence.company.registryStatusLabel}
              sx={{
                flexShrink: 0,
                color: companyColor,
                bgcolor: alpha(companyColor, 0.07),
              }}
            />
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              mt: 1.2,
              flexWrap: "wrap",
            }}
          >
            {intelligence.company.publishedSourceUrl && (
              <Button
                component="a"
                href={intelligence.company.publishedSourceUrl}
                target="_blank"
                rel="noreferrer"
                size="small"
                endIcon={
                  <LaunchRoundedIcon sx={{ fontSize: "15px !important" }} />
                }
                sx={{
                  ml: -1,
                  color: "primary.light",
                }}
              >
                Merchant legal source
              </Button>
            )}

            {intelligence.company.registryUrl && (
              <Button
                component="a"
                href={intelligence.company.registryUrl}
                target="_blank"
                rel="noreferrer"
                size="small"
                endIcon={
                  <LaunchRoundedIcon sx={{ fontSize: "15px !important" }} />
                }
                sx={{
                  color: "primary.light",
                }}
              >
                Registry result
              </Button>
            )}
          </Stack>
        </Box>
      </Stack>

      <Typography
        variant="caption"
        sx={{
          mt: 2,
          display: "block",
          color: "text.secondary",
          lineHeight: 1.55,
        }}
      >
        Unavailable or unconfigured checks do not count as a clean result.
      </Typography>
    </Box>
  );
}
