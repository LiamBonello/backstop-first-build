import {
  Box,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import {
  useEffect,
  useState,
} from 'react';

interface RiskMeterProps {
  risk: number;
  verdict: string;
}

const RADIUS = 52;

const CIRCUMFERENCE =
  2 *
  Math.PI *
  RADIUS;

export function RiskMeter({
  risk,
  verdict,
}: RiskMeterProps) {
  const reduceMotion =
    useMediaQuery(
      '(prefers-reduced-motion: reduce)',
    );

  const [
    ringRisk,
    setRingRisk,
  ] = useState(
    reduceMotion
      ? risk
      : 0,
  );

  const [
    displayRisk,
    setDisplayRisk,
  ] = useState(
    reduceMotion
      ? risk
      : 0,
  );

  useEffect(() => {
    if (reduceMotion) {
      setRingRisk(risk);
      setDisplayRisk(risk);

      return;
    }

    setRingRisk(0);
    setDisplayRisk(0);

    const ringFrame =
      window.requestAnimationFrame(
        () =>
          setRingRisk(
            risk,
          ),
      );

    const startedAt =
      performance.now();

    let countFrame = 0;

    const tick = (
      time: number,
    ) => {
      const elapsed =
        time - startedAt;

      const progress =
        Math.min(
          1,
          elapsed / 900,
        );

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3,
        );

      setDisplayRisk(
        Math.round(
          risk * eased,
        ),
      );

      if (progress < 1) {
        countFrame =
          window.requestAnimationFrame(
            tick,
          );
      }
    };

    countFrame =
      window.requestAnimationFrame(
        tick,
      );

    return () => {
      window.cancelAnimationFrame(
        ringFrame,
      );

      window.cancelAnimationFrame(
        countFrame,
      );
    };
  }, [
    reduceMotion,
    risk,
  ]);

  const offset =
    CIRCUMFERENCE *
    (
      1 -
      ringRisk / 100
    );

  return (
    <Box
      sx={{
        width: 230,
        height: 230,

        position:
          'relative',

        display:
          'grid',

        placeItems:
          'center',

        filter:
          'drop-shadow(0 0 34px rgba(255,122,137,.08))',
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 120 120"
        sx={{
          position:
            'absolute',

          inset: 0,

          width:
            '100%',

          height:
            '100%',

          transform:
            'rotate(-90deg)',
        }}
      >
        <defs>
          <linearGradient
            id="backstop-risk-gradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#FFCA68"
            />

            <stop
              offset="100%"
              stopColor="#FF6B81"
            />
          </linearGradient>
        </defs>

        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,.055)"
          strokeWidth="7"
        />

        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="url(#backstop-risk-gradient)"
          strokeWidth="7"
          strokeLinecap="round"

          strokeDasharray={
            CIRCUMFERENCE
          }

          strokeDashoffset={
            offset
          }

          style={{
            transition:
              reduceMotion
                ? 'none'
                : 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)',
          }}
        />
      </Box>

      <Box
        sx={{
          position:
            'absolute',

          inset:
            20,

          borderRadius:
            '50%',

          bgcolor:
            alpha(
              '#090C11',
              0.96,
            ),

          border:
            `1px solid ${alpha(
              '#ffffff',
              0.055,
            )}`,

          boxShadow:
            'inset 0 0 50px rgba(157,123,255,.035)',
        }}
      />

      <Stack
        alignItems="center"
        sx={{
          position:
            'relative',

          zIndex: 1,
        }}
      >
        <Typography
          sx={{
            fontFamily:
              'Manrope',

            fontWeight:
              800,

            fontSize:
              '3.4rem',

            lineHeight:
              1,

            fontVariantNumeric:
              'tabular-nums',
          }}
        >
          {displayRisk}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mt: 0.7,

            letterSpacing:
              '.08em',
          }}
        >
          RISK SIGNAL
        </Typography>

        <Typography
          sx={{
            mt: 1.2,

            color:
              'warning.main',

            fontWeight:
              700,

            textAlign:
              'center',
          }}
        >
          {verdict}
        </Typography>
      </Stack>
    </Box>
  );
}