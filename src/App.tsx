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
  ProtectedPurchaseDetail,
} from './components/ProtectedPurchaseDetail';

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
  getDashboardMetrics,
  protectionService,
} from './services/protectionService';

import {
  scanService,
} from './services/scanService';

import type {
  ProtectedPurchase,
  ProtectionInput,
  PurchaseLifecycleStatus,
  PurchaseScan,
} from './types/purchase';

type View =
  | 'home'
  | 'result'
  | 'dashboard'
  | 'purchase';

export default function App() {
  const [
    view,
    setView,
  ] = useState<View>(
    'home',
  );

  const [
    isScanning,
    setIsScanning,
  ] = useState(false);

  const [
    scan,
    setScan,
  ] = useState<PurchaseScan | null>(
    null,
  );

  const [
    protectedPurchases,
    setProtectedPurchases,
  ] = useState<
    ProtectedPurchase[]
  >(
    () =>
      protectionService.list(),
  );

  const [
    selectedPurchaseId,
    setSelectedPurchaseId,
  ] = useState<string | null>(
    null,
  );

  const [
    toastOpen,
    setToastOpen,
  ] = useState(false);

  const [
    scanError,
    setScanError,
  ] = useState<string | null>(
    null,
  );

  const protectedPurchase =
    Boolean(
      scan &&
      protectedPurchases.some(
        (purchase) =>
          purchase.sourceScanId ===
          scan.id,
      ),
    );

  const dashboardMetrics =
    getDashboardMetrics(
      protectedPurchases,
    );

  const selectedPurchase =
    selectedPurchaseId
      ? protectedPurchases.find(
          (purchase) =>
            purchase.id ===
            selectedPurchaseId,
        ) ?? null
      : null;

  const handleScan = async (
    url: string,
  ) => {
    if (isScanning) {
      return;
    }

    setIsScanning(true);
    setScanError(null);

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
        error instanceof Error
          ? error.message
          : 'Backstop could not complete that scan.',
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleProtect = (
    input: ProtectionInput,
  ) => {
    if (!scan) {
      return;
    }

    try {
      protectionService.protect(
        scan,
        input,
      );

      setProtectedPurchases(
        protectionService.list(),
      );

      setToastOpen(true);
    } catch (error) {
      setScanError(
        error instanceof Error
          ? error.message
          : 'Backstop could not save this protected purchase.',
      );
    }
  };

  const handleRemovePurchase = (
    id: string,
  ) => {
    try {
      setProtectedPurchases(
        protectionService.remove(
          id,
        ),
      );

      if (
        selectedPurchaseId ===
        id
      ) {
        setSelectedPurchaseId(
          null,
        );

        setView(
          'dashboard',
        );
      }
    } catch (error) {
      setScanError(
        error instanceof Error
          ? error.message
          : 'Backstop could not remove this protected purchase.',
      );
    }
  };

  const handleOpenPurchase = (
    id: string,
  ) => {
    setProtectedPurchases(
      protectionService.list(),
    );

    setSelectedPurchaseId(
      id,
    );

    setView(
      'purchase',
    );

    window.scrollTo({
      top: 0,
      behavior:
        'smooth',
    });
  };

  const handleUpdatePurchaseDates = (
    input: ProtectionInput,
  ) => {
    if (!selectedPurchaseId) {
      return;
    }

    try {
      protectionService.updateDates(
        selectedPurchaseId,
        input,
      );

      setProtectedPurchases(
        protectionService.list(),
      );
    } catch (error) {
      setScanError(
        error instanceof Error
          ? error.message
          : 'Backstop could not update the purchase dates.',
      );
    }
  };

  const handleLifecycleChange = (
    status:
      PurchaseLifecycleStatus,
  ) => {
    if (!selectedPurchaseId) {
      return;
    }

    try {
      protectionService.setLifecycle(
        selectedPurchaseId,
        status,
      );

      setProtectedPurchases(
        protectionService.list(),
      );
    } catch (error) {
      setScanError(
        error instanceof Error
          ? error.message
          : 'Backstop could not update this purchase status.',
      );
    }
  };

  const goHome = () => {
    setView(
      'home',
    );

    window.scrollTo({
      top: 0,
      behavior:
        'smooth',
    });
  };

  const goDashboard = () => {
    setProtectedPurchases(
      protectionService.list(),
    );

    setSelectedPurchaseId(
      null,
    );

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

      <Box
        component="main"
      >
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
          'purchase' &&
          selectedPurchase && (
          <ProtectedPurchaseDetail
            purchase={
              selectedPurchase
            }
            onBack={
              goDashboard
            }
            onUpdateDates={
              handleUpdatePurchaseDates
            }
            onLifecycleChange={
              handleLifecycleChange
            }
            onDelete={() =>
              handleRemovePurchase(
                selectedPurchase.id,
              )
            }
          />
        )}

        {view ===
          'dashboard' && (
          <Dashboard
            purchases={
              protectedPurchases
            }
            metrics={
              dashboardMetrics
            }
            onRemovePurchase={
              handleRemovePurchase
            }
            onOpenPurchase={
              handleOpenPurchase
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
          Purchase protected. Backstop is now tracking the calculated deadlines on this device.
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
