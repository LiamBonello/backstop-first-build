import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  demoDashboardMetrics,
  demoProtectedPurchases,
} from "../mocks/dashboard";
import type {
  DashboardMetric,
  ProtectedPurchase,
  PurchaseScan,
} from "../types/purchase";

interface DashboardProps {
  scan: PurchaseScan | null;
  protectedPurchase: boolean;
  onBack: () => void;
  onScanNew: () => void;
}

export function Dashboard({
  scan,
  protectedPurchase,
  onBack,
  onScanNew,
}: DashboardProps) {
  const purchases: ProtectedPurchase[] = [
    ...(protectedPurchase && scan
      ? [
          {
            id: scan.id,
            merchant: scan.merchant,
            product: scan.product,
            amountLabel: scan.amountLabel,
            nextDeadlineLabel: `Return terms · ${scan.protection.returnWindowLabel}`,
            status: "protected" as const,
          },
        ]
      : []),
    ...demoProtectedPurchases,
  ];

  const metrics: DashboardMetric[] = demoDashboardMetrics.map((metric) =>
    metric.id === "protected"
      ? { ...metric, value: String(purchases.length) }
      : metric,
  );

  const metricIcons: Record<DashboardMetric["icon"], typeof ShieldRoundedIcon> =
    {
      shield: ShieldRoundedIcon,
      value: SavingsOutlinedIcon,
      deadline: CalendarMonthRoundedIcon,
      recovered: BoltRoundedIcon,
    };

  return (
    <Box
      sx={{
        maxWidth: 1180,
        mx: "auto",
        px: { xs: 2, md: 4 },
        py: { xs: 5, md: 8 },
      }}
    >
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={onBack}
        sx={{ color: "text.secondary", ml: -1 }}
      >
        Back
      </Button>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "flex-end" },
          gap: 2,
          mt: 3
        }}>
        <Box>
          <Chip
            size="small"
            icon={<ShieldRoundedIcon />}
            label="Protection center"
            sx={{ color: "#A8F4DF", bgcolor: alpha("#61F4D5", 0.055) }}
          />
          <Typography
            variant="h2"
            sx={{ mt: 2, fontSize: { xs: "2.5rem", md: "3.7rem" } }}
          >
            Your money has a memory now.
          </Typography>
          <Typography
            sx={{
              color: "text.secondary",
              mt: 1,
              maxWidth: 620
            }}>
            The purchases, obligations and deadlines worth remembering, without
            relying on your inbox or your memory.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onScanNew}
          sx={{
            height: 48,
            color: "#07100D",
            background: "linear-gradient(110deg, #B89EFF, #6AF3D7)",
          }}
        >
          Scan a purchase
        </Button>
      </Stack>

      <Box
        sx={{
          mt: 5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" },
          gap: 1.4,
        }}
      >
        {metrics.map((stat) => {
          const Icon = metricIcons[stat.icon];
          return (
            <Box
              key={stat.label}
              sx={{
                p: { xs: 2, md: 2.4 },
                borderRadius: 4,
                bgcolor: alpha("#0D1016", 0.72),
                border: `1px solid ${alpha("#ffffff", 0.07)}`,
              }}
            >
              <Icon sx={{ color: "primary.main", fontSize: 20 }} />
              <Typography
                sx={{
                  mt: 2,
                  fontFamily: "Manrope",
                  fontWeight: 700,
                  fontSize: { xs: "1.6rem", md: "2rem" },
                }}
              >
                {stat.value}
              </Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                {stat.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mt: 6,
          mb: 2
        }}>
        <Box>
          <Typography variant="h3" sx={{ fontSize: "1.6rem" }}>
            Protected purchases
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mt: 0.5
            }}>
            Sorted by the next thing that needs your attention.
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1.2}>
        {purchases.map((purchase) => (
          <Stack
            key={purchase.id}
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              p: 2.2,
              borderRadius: 4,
              bgcolor: alpha("#0D1016", 0.68),
              border: `1px solid ${alpha("#ffffff", 0.065)}`,
              transition: "transform .2s ease, border-color .2s ease",

              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: alpha("#9D7BFF", 0.18),
              }
            }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "14px",
                display: "grid",
                placeItems: "center",
                color:
                  purchase.status === "attention"
                    ? "warning.main"
                    : "secondary.main",
                bgcolor:
                  purchase.status === "attention"
                    ? alpha("#FFCA68", 0.07)
                    : alpha("#61F4D5", 0.07),
              }}
            >
              {purchase.status === "attention" ? (
                <CalendarMonthRoundedIcon />
              ) : (
                <CheckCircleRoundedIcon />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                {purchase.merchant}
              </Typography>
              <Typography sx={{
                fontWeight: 700
              }}>{purchase.product}</Typography>
            </Box>
            <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
              <Typography sx={{
                fontWeight: 700
              }}>{purchase.amountLabel}</Typography>
              <Typography
                variant="caption"
                color={
                  purchase.status === "attention"
                    ? "warning.main"
                    : "text.secondary"
                }
              >
                {purchase.nextDeadlineLabel}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
