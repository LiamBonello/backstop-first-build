import {
  Alert,
  Box,
  Snackbar,
} from '@mui/material';

import {
  useEffect,
  useRef,
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

import type {
  BrowserNotificationPermission,
} from './components/NotificationCenter';

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
  notificationService,
} from './services/notificationService';

import {
  getDashboardMetrics,
  protectionService,
} from './services/protectionService';

import {
  scanService,
} from './services/scanService';

import type {
  DeadlineNotification,
} from './types/notification';

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

const getBrowserNotificationPermission =
  (): BrowserNotificationPermission => {
    if (
      typeof window ===
        'undefined' ||
      !(
        'Notification' in
        window
      )
    ) {
      return 'unsupported';
    }

    return Notification.permission;
  };

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
  >([]);

  const [
    notifications,
    setNotifications,
  ] = useState<
    DeadlineNotification[]
  >([]);

  const [
    notificationLeadDays,
    setNotificationLeadDays,
  ] = useState(
    7,
  );

  const [
    browserNotificationPermission,
    setBrowserNotificationPermission,
  ] = useState<
    BrowserNotificationPermission
  >(
    getBrowserNotificationPermission,
  );

  const shownDesktopNotificationIds =
    useRef<
      Set<string>
    >(
      new Set(),
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

  const refreshProtectedPurchases =
    async (): Promise<ProtectedPurchase[]> => {
      const purchases =
        await protectionService.list();

      setProtectedPurchases(
        purchases,
      );

      return purchases;
    };

  const refreshNotifications =
    async (): Promise<DeadlineNotification[]> => {
      const result =
        await notificationService.list();

      setNotifications(
        result.notifications,
      );

      setNotificationLeadDays(
        result.preferences.leadDays,
      );

      return result.notifications;
    };

  useEffect(() => {
    let cancelled =
      false;

    protectionService
      .list()
      .then(
        (purchases) => {
          if (!cancelled) {
            setProtectedPurchases(
              purchases,
            );
          }
        },
      )
      .catch(
        (error: unknown) => {
          if (!cancelled) {
            setScanError(
              error instanceof Error
                ? error.message
                : 'Backstop could not load the local protection database.',
            );
          }
        },
      );

    return () => {
      cancelled =
        true;
    };
  }, []);

  useEffect(() => {
    let cancelled =
      false;

    const loadNotifications =
      async () => {
        try {
          const result =
            await notificationService.list();

          if (
            cancelled
          ) {
            return;
          }

          setNotifications(
            result.notifications,
          );

          setNotificationLeadDays(
            result.preferences.leadDays,
          );
        } catch (
          error
        ) {
          if (
            !cancelled
          ) {
            setScanError(
              error instanceof Error
                ? error.message
                : 'Backstop could not load deadline reminders.',
            );
          }
        }
      };

    void loadNotifications();

    const intervalId =
      window.setInterval(
        () => {
          void loadNotifications();
        },
        60_000,
      );

    return () => {
      cancelled =
        true;

      window.clearInterval(
        intervalId,
      );
    };
  }, []);

  useEffect(() => {
    if (
      browserNotificationPermission !==
        'granted' ||
      !(
        'Notification' in
        window
      )
    ) {
      return;
    }

    for (
      const reminder of
      notifications
    ) {
      if (
        !reminder.unread ||
        reminder.delivered ||
        shownDesktopNotificationIds.current.has(
          reminder.id,
        )
      ) {
        continue;
      }

      try {
        const desktopNotification =
          new Notification(
            reminder.title,
            {
              body:
                `${reminder.detail}. Deadline ${reminder.deadlineLabel}.`,
              tag:
                `backstop-${reminder.id}`,
            },
          );

        shownDesktopNotificationIds.current.add(
          reminder.id,
        );

        desktopNotification.onclick =
          () => {
            window.focus();

            setSelectedPurchaseId(
              reminder.purchaseId,
            );

            setView(
              'purchase',
            );

            setNotifications(
              (
                current,
              ) =>
                current.map(
                  (
                    notification,
                  ) =>
                    notification.id ===
                    reminder.id
                      ? {
                          ...notification,
                          unread:
                            false,
                        }
                      : notification,
                ),
            );

            void notificationService.markRead(
              reminder.id,
            );

            desktopNotification.close();
          };

        void notificationService
          .markDelivered(
            reminder.id,
          )
          .then(
            () => {
              setNotifications(
                (
                  current,
                ) =>
                  current.map(
                    (
                      notification,
                    ) =>
                      notification.id ===
                      reminder.id
                        ? {
                            ...notification,
                            delivered:
                              true,
                          }
                        : notification,
                  ),
              );
            },
          )
          .catch(
            () => {
              // The in-app reminder remains available even if delivery state cannot be persisted.
            },
          );
      } catch {
        // Browser notification delivery is best-effort; the in-app reminder remains available.
      }
    }
  }, [
    browserNotificationPermission,
    notifications,
  ]);

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

  const handleProtect = async (
    input: ProtectionInput,
  ) => {
    if (!scan) {
      return;
    }

    try {
      await protectionService.protect(
        scan,
        input,
      );

      await Promise.all([
        refreshProtectedPurchases(),
        refreshNotifications(),
      ]);

      setToastOpen(true);
    } catch (error) {
      setScanError(
        error instanceof Error
          ? error.message
          : 'Backstop could not save this protected purchase.',
      );
    }
  };

  const handleRemovePurchase = async (
    id: string,
  ) => {
    try {
      await protectionService.remove(
        id,
      );

      await Promise.all([
        refreshProtectedPurchases(),
        refreshNotifications(),
      ]);

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

  const handleNotificationClick = async (
    notification:
      DeadlineNotification,
  ) => {
    if (
      notification.unread
    ) {
      setNotifications(
        (
          current,
        ) =>
          current.map(
            (item) =>
              item.id ===
              notification.id
                ? {
                    ...item,
                    unread:
                      false,
                  }
                : item,
          ),
      );

      try {
        await notificationService.markRead(
          notification.id,
        );
      } catch (error) {
        setScanError(
          error instanceof Error
            ? error.message
            : 'Backstop could not update this reminder.',
        );
      }
    }

    handleOpenPurchase(
      notification.purchaseId,
    );
  };

  const handleReadAllNotifications =
    async () => {
      try {
        await notificationService.markAllRead();

        setNotifications(
          (
            current,
          ) =>
            current.map(
              (
                notification,
              ) => ({
                ...notification,
                unread:
                  false,
              }),
            ),
        );
      } catch (error) {
        setScanError(
          error instanceof Error
            ? error.message
            : 'Backstop could not mark reminders as read.',
        );
      }
    };

  const handleNotificationLeadDaysChange =
    async (
      leadDays: number,
    ) => {
      try {
        const preferences =
          await notificationService.updateLeadDays(
            leadDays,
          );

        setNotificationLeadDays(
          preferences.leadDays,
        );

        await refreshNotifications();
      } catch (error) {
        setScanError(
          error instanceof Error
            ? error.message
            : 'Backstop could not update reminder settings.',
        );
      }
    };

  const handleEnableDesktopNotifications =
    async () => {
      if (
        !(
          'Notification' in
          window
        )
      ) {
        setBrowserNotificationPermission(
          'unsupported',
        );

        return;
      }

      try {
        const permission =
          await Notification.requestPermission();

        setBrowserNotificationPermission(
          permission,
        );
      } catch {
        setScanError(
          'Backstop could not request desktop-notification permission.',
        );
      }
    };

  const handleUpdatePurchaseDates = async (
    input: ProtectionInput,
  ) => {
    if (!selectedPurchaseId) {
      return;
    }

    try {
      await protectionService.updateDates(
        selectedPurchaseId,
        input,
      );

      await Promise.all([
        refreshProtectedPurchases(),
        refreshNotifications(),
      ]);
    } catch (error) {
      setScanError(
        error instanceof Error
          ? error.message
          : 'Backstop could not update the purchase dates.',
      );
    }
  };

  const handleLifecycleChange = async (
    status:
      PurchaseLifecycleStatus,
  ) => {
    if (!selectedPurchaseId) {
      return;
    }

    try {
      await protectionService.setLifecycle(
        selectedPurchaseId,
        status,
      );

      await Promise.all([
        refreshProtectedPurchases(),
        refreshNotifications(),
      ]);
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
    void Promise.all([
      refreshProtectedPurchases(),
      refreshNotifications(),
    ]).catch(
      (
        error: unknown,
      ) => {
        setScanError(
          error instanceof Error
            ? error.message
            : 'Backstop could not refresh local protection data.',
        );
      },
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
        notifications={
          notifications
        }
        notificationLeadDays={
          notificationLeadDays
        }
        browserNotificationPermission={
          browserNotificationPermission
        }
        onEnableDesktopNotifications={
          handleEnableDesktopNotifications
        }
        onNotificationClick={
          handleNotificationClick
        }
        onReadAllNotifications={
          handleReadAllNotifications
        }
        onNotificationLeadDaysChange={
          handleNotificationLeadDaysChange
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
          Purchase protected. Backstop is now tracking the calculated deadlines and reminder window in your local database.
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
