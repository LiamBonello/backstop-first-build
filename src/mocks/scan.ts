import {
  Alert,
  Box,
  Snackbar,
} from '@mui/material';

import {
  useState,
} from 'react';

import {
  AmbientBackground,
} from './components/AmbientBackground';

import {
  CursorGlow,
} from './components/CursorGlow';

import {
  Dashboard,
} from './components/Dashboard';

import {
  HeroScanner,
} from './components/HeroScanner';

import {
  ScanResult,
} from './components/ScanResult';

import {
  SignalSection,
} from './components/SignalSection';

import {
  TopNav,
} from './components/TopNav';

import {
  mapScanResponse,
} from './mappers/scanMapper';

import {
  scanService,
} from './services/scanService';

import type {
  PurchaseScan,
} from './types/purchase';

type View =
  | 'home'
  | 'result'
  | 'dashboard';

export default function App() {
  const [
    view,
    setView,
  ] =
    useState<View>(
      'home',
    );

  const [
    isScanning,
    setIsScanning,
  ] =
    useState(false);

  const [
    scan,
    setScan,
  ] =
    useState<PurchaseScan | null>(
      null,
    );

  const [
    protectedPurchase,
    setProtectedPurchase,
  ] =
    useState(false);

  const [
    toastOpen,
    setToastOpen,
  ] =
    useState(false);

  const [
    scanError,
    setScanError,
  ] =
    useState<
      string | null
    >(null);

  const handleScan =
    async (
      url: string,
    ) => {
      if (
        isScanning
      ) {
        return;
      }

      setIsScanning(
        true,
      );

      setProtectedPurchase(
        false,
      );

      setScanError(
        null,
      );

      try {
        const response =
          await scanService.analyze(
            url,
          );

        setScan(
          mapScanResponse(
            response,
          ),
        );

        setView(
          'result',
        );

        window.scrollTo({
          top: 0,

          behavior:
            'smooth',
        });
      } catch (error) {
        setScanError(
          error instanceof
          Error
            ? error.message
            : 'Backstop could not complete that scan.',
        );
      } finally {
        setIsScanning(
          false,
        );
      }
    };

  const handleProtect =
    () => {
      setProtectedPurchase(
        true,
      );

      setToastOpen(
        true,
      );
    };

  const goHome =
    () => {
      setView(
        'home',
      );

      window.scrollTo({
        top: 0,

        behavior:
          'smooth',
      });
    };

  const goDashboard =
    () => {
      setView(
        'dashboard',
      );

      window.scrollTo({
        top: 0,

        behavior:
          'smooth',
      });
    };

  return (
    <Box
      sx={{
        minHeight:
          '100vh',

        position:
          'relative',

        isolation:
          'isolate',
      }}
    >
      <AmbientBackground />

      <CursorGlow />

      <TopNav
        onDashboard={
          goDashboard
        }

        onHome={
          goHome
        }
      />

      <Box component="main">
        {view ===
          'home' && (
          <>
            <HeroScanner
              isScanning={
                isScanning
              }

              onScan={
                handleScan
              }
            />

            {!isScanning && (
              <SignalSection />
            )}
          </>
        )}

        {view ===
          'result' &&
          scan && (
            <ScanResult
              scan={
                scan
              }

              protectedPurchase={
                protectedPurchase
              }

              onProtect={
                handleProtect
              }

              onNewScan={
                goHome
              }

              onDashboard={
                goDashboard
              }
            />
          )}

        {view ===
          'dashboard' && (
          <Dashboard
            scan={
              scan
            }

            protectedPurchase={
              protectedPurchase
            }

            onBack={() =>
              setView(
                scan
                  ? 'result'
                  : 'home',
              )
            }

            onScanNew={
              goHome
            }
          />
        )}
      </Box>

      <Snackbar
        open={
          toastOpen
        }

        autoHideDuration={
          4200
        }

        onClose={() =>
          setToastOpen(
            false,
          )
        }

        anchorOrigin={{
          vertical:
            'bottom',

          horizontal:
            'center',
        }}
      >
        <Alert
          severity="success"

          variant="filled"

          onClose={() =>
            setToastOpen(
              false,
            )
          }

          sx={{
            borderRadius:
              3,

            bgcolor:
              '#152A24',

            color:
              '#C9FFEF',
          }}
        >
          Purchase protected. Backstop is now tracking its key terms.
        </Alert>
      </Snackbar>

      <Snackbar
        open={
          Boolean(
            scanError,
          )
        }

        autoHideDuration={
          7000
        }

        onClose={() =>
          setScanError(
            null,
          )
        }

        anchorOrigin={{
          vertical:
            'bottom',

          horizontal:
            'center',
        }}
      >
        <Alert
          severity="error"

          variant="filled"

          onClose={() =>
            setScanError(
              null,
            )
          }

          sx={{
            borderRadius:
              3,

            maxWidth:
              620,
          }}
        >
          {scanError}
        </Alert>
      </Snackbar>
    </Box>
  );
}