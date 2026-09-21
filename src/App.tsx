import {
  Alert,
  Box,
  LinearProgress,
  Snackbar,
} from '@mui/material';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AccountDialog,
} from './components/AccountDialog';

import {
  AmbientBackground,
} from './components/AmbientBackground';

import {
  AppFooter,
} from './components/AppFooter';

import {
  AuthDialog,
} from './components/AuthDialog';

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
  PrivacyDialog,
} from './components/PrivacyDialog';

import {
  ProtectedPurchaseDetail,
} from './components/ProtectedPurchaseDetail';

import {
  ResolutionCaseView,
} from './components/ResolutionCaseView';

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
  authService,
} from './services/authService';

import type {
  BackstopAuthUser,
} from './services/authService';

import {
  notificationService,
} from './services/notificationService';

import {
  getDashboardMetrics,
  protectionService,
} from './services/protectionService';

import {
  resolutionService,
} from './services/resolutionService';

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

import type {
  CreateResolutionCaseRequestDto,
  ResolutionCase,
  ResolutionCaseStatus,
} from './types/resolution';

type View =
  | 'home'
  | 'result'
  | 'dashboard'
  | 'purchase'
  | 'resolution';

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

const errorMessage = (
  error: unknown,
  fallback: string,
): string =>
  error instanceof Error
    ? error.message
    : fallback;

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
    authUser,
    setAuthUser,
  ] = useState<BackstopAuthUser | null>(
    null,
  );

  const [
    authPending,
    setAuthPending,
  ] = useState(true);

  const [
    authDialogOpen,
    setAuthDialogOpen,
  ] = useState(false);

  const [
    accountDialogOpen,
    setAccountDialogOpen,
  ] = useState(false);

  const [
    privacyDialogOpen,
    setPrivacyDialogOpen,
  ] = useState(false);

  const [
    pendingProtectionInput,
    setPendingProtectionInput,
  ] = useState<ProtectionInput | null>(
    null,
  );

  const [
    isBootstrapping,
    setIsBootstrapping,
  ] = useState(true);

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
    resolutionCases,
    setResolutionCases,
  ] = useState<
    ResolutionCase[]
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
    selectedResolutionCaseId,
    setSelectedResolutionCaseId,
  ] = useState<string | null>(
    null,
  );

  const [
    toastOpen,
    setToastOpen,
  ] = useState(false);

  const [
    appError,
    setAppError,
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

  const selectedResolutionCase =
    selectedResolutionCaseId
      ? resolutionCases.find(
          (resolutionCase) =>
            resolutionCase.id ===
            selectedResolutionCaseId,
        ) ?? null
      : null;

  const selectedPurchaseResolutionCase =
    selectedPurchaseId
      ? resolutionCases.find(
          (resolutionCase) =>
            resolutionCase.purchaseId ===
            selectedPurchaseId,
        ) ?? null
      : null;

  const refreshProtectedPurchases =
    async (): Promise<
      ProtectedPurchase[]
    > => {
      const purchases =
        await protectionService.list();

      setProtectedPurchases(
        purchases,
      );

      return purchases;
    };

  const refreshResolutionCases =
    async (): Promise<
      ResolutionCase[]
    > => {
      const cases =
        await resolutionService.list();

      setResolutionCases(
        cases,
      );

      return cases;
    };

  const refreshNotifications =
    async (): Promise<
      DeadlineNotification[]
    > => {
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

  const clearAccountData =
    () => {
      setProtectedPurchases(
        [],
      );

      setResolutionCases(
        [],
      );

      setNotifications(
        [],
      );

      setSelectedPurchaseId(
        null,
      );

      setSelectedResolutionCaseId(
        null,
      );
    };

  const loadAccountData =
    async () => {
      const [
        purchases,
        cases,
        notificationResult,
      ] =
        await Promise.all([
          protectionService.list(),
          resolutionService.list(),
          notificationService.list(),
        ]);

      setProtectedPurchases(
        purchases,
      );

      setResolutionCases(
        cases,
      );

      setNotifications(
        notificationResult.notifications,
      );

      setNotificationLeadDays(
        notificationResult.preferences.leadDays,
      );
    };

  useEffect(() => {
    let cancelled =
      false;

    const bootstrap =
      async () => {
        setAuthPending(
          true,
        );

        setIsBootstrapping(
          true,
        );

        try {
          const user =
            await authService.getCurrentUser();

          if (
            cancelled
          ) {
            return;
          }

          setAuthUser(
            user,
          );

          if (user) {
            await loadAccountData();
          } else {
            clearAccountData();
          }
        } catch (error) {
          if (
            !cancelled
          ) {
            clearAccountData();

            setAppError(
              errorMessage(
                error,
                'Backstop could not restore your account session.',
              ),
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setAuthPending(
              false,
            );

            setIsBootstrapping(
              false,
            );
          }
        }
      };

    void bootstrap();

    return () => {
      cancelled =
        true;
    };
  }, []);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const intervalId =
      window.setInterval(
        () => {
          void refreshNotifications().catch(
            () => {
              // Keep the existing in-app state when a background refresh fails.
            },
          );
        },
        60_000,
      );

    return () =>
      window.clearInterval(
        intervalId,
      );
  }, [
    authUser?.id,
  ]);

  useEffect(() => {
    if (
      !authUser ||
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

            setSelectedResolutionCaseId(
              null,
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

            void notificationService
              .markRead(
                reminder.id,
              )
              .catch(
                () => {
                  // Read state can be retried from the in-app reminder center.
                },
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
    authUser,
    browserNotificationPermission,
    notifications,
  ]);

  const handleAuthenticated =
    (
      user:
        BackstopAuthUser,
    ) => {
      setAuthUser(
        user,
      );

      setAuthDialogOpen(
        false,
      );

      setIsBootstrapping(
        true,
      );

      void (
        async () => {
          try {
            const pendingInput =
              pendingProtectionInput;

            if (
              pendingInput &&
              scan
            ) {
              await protectionService.protect(
                scan,
                pendingInput,
              );

              setPendingProtectionInput(
                null,
              );

              setToastOpen(
                true,
              );
            }

            await loadAccountData();
          } catch (error) {
            setAppError(
              errorMessage(
                error,
                'Backstop could not load your account data.',
              ),
            );
          } finally {
            setIsBootstrapping(
              false,
            );
          }
        }
      )();
    };

  const handleSignOut =
    () => {
      setAuthPending(
        true,
      );

      void authService
        .signOut()
        .then(
          () => {
            setAuthUser(
              null,
            );

            setPendingProtectionInput(
              null,
            );

            clearAccountData();

            setAccountDialogOpen(
              false,
            );

            setView(
              'home',
            );
          },
        )
        .catch(
          (
            error: unknown,
          ) => {
            setAppError(
              errorMessage(
                error,
                'Backstop could not sign you out.',
              ),
            );
          },
        )
        .finally(
          () => {
            setAuthPending(
              false,
            );
          },
        );
    };

  const handleAccountDeleted =
    () => {
      setAuthUser(
        null,
      );

      setAuthPending(
        false,
      );

      setPendingProtectionInput(
        null,
      );

      clearAccountData();

      setAccountDialogOpen(
        false,
      );

      setView(
        'home',
      );

      window.scrollTo({
        top:
          0,
        behavior:
          'smooth',
      });
    };

  const handleScan = async (
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

    setAppError(
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

      setSelectedPurchaseId(
        null,
      );

      setSelectedResolutionCaseId(
        null,
      );

      setView(
        'result',
      );

      window.scrollTo({
        top:
          0,
        behavior:
          'smooth',
      });
    } catch (error) {
      setAppError(
        errorMessage(
          error,
          'Backstop could not complete that scan.',
        ),
      );
    } finally {
      setIsScanning(
        false,
      );
    }
  };

  const handleProtect = async (
    input:
      ProtectionInput,
  ) => {
    if (!scan) {
      return;
    }

    if (!authUser) {
      setPendingProtectionInput(
        input,
      );

      setAuthDialogOpen(
        true,
      );

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

      setToastOpen(
        true,
      );
    } catch (error) {
      setAppError(
        errorMessage(
          error,
          'Backstop could not save this protected purchase.',
        ),
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
        refreshResolutionCases(),
        refreshNotifications(),
      ]);

      if (
        selectedPurchaseId ===
        id
      ) {
        setSelectedPurchaseId(
          null,
        );

        setSelectedResolutionCaseId(
          null,
        );

        setView(
          'dashboard',
        );
      }
    } catch (error) {
      setAppError(
        errorMessage(
          error,
          'Backstop could not remove this protected purchase.',
        ),
      );
    }
  };

  const handleOpenPurchase = (
    id: string,
  ) => {
    setSelectedPurchaseId(
      id,
    );

    setSelectedResolutionCaseId(
      null,
    );

    setView(
      'purchase',
    );

    window.scrollTo({
      top:
        0,
      behavior:
        'smooth',
    });
  };

  const handleOpenResolutionCase = (
    id: string,
  ) => {
    const resolutionCase =
      resolutionCases.find(
        (item) =>
          item.id ===
          id,
      );

    if (
      !resolutionCase
    ) {
      return;
    }

    setSelectedResolutionCaseId(
      id,
    );

    setSelectedPurchaseId(
      resolutionCase.purchaseId,
    );

    setView(
      'resolution',
    );

    window.scrollTo({
      top:
        0,
      behavior:
        'smooth',
    });
  };

  const handleCreateResolutionCase =
    async (
      input:
        CreateResolutionCaseRequestDto,
    ) => {
      try {
        const created =
          await resolutionService.create(
            input,
          );

        await refreshResolutionCases();

        setSelectedResolutionCaseId(
          created.id,
        );

        setSelectedPurchaseId(
          created.purchaseId,
        );

        setView(
          'resolution',
        );

        window.scrollTo({
          top:
            0,
          behavior:
            'smooth',
        });
      } catch (error) {
        setAppError(
          errorMessage(
            error,
            'Backstop could not create this resolution case.',
          ),
        );

        throw error;
      }
    };

  const handleResolutionStatusChange =
    async (
      status:
        ResolutionCaseStatus,
    ) => {
      if (
        !selectedResolutionCaseId
      ) {
        return;
      }

      try {
        const updated =
          await resolutionService.setStatus(
            selectedResolutionCaseId,
            status,
          );

        setResolutionCases(
          (
            current,
          ) =>
            current.map(
              (
                resolutionCase,
              ) =>
                resolutionCase.id ===
                updated.id
                  ? updated
                  : resolutionCase,
            ),
        );
      } catch (error) {
        setAppError(
          errorMessage(
            error,
            'Backstop could not update the resolution case.',
          ),
        );
      }
    };

  const handleAddResolutionNote =
    async (
      note: string,
    ) => {
      if (
        !selectedResolutionCaseId
      ) {
        return;
      }

      try {
        const updated =
          await resolutionService.addNote(
            selectedResolutionCaseId,
            note,
          );

        setResolutionCases(
          (
            current,
          ) =>
            current.map(
              (
                resolutionCase,
              ) =>
                resolutionCase.id ===
                updated.id
                  ? updated
                  : resolutionCase,
            ),
        );
      } catch (error) {
        setAppError(
          errorMessage(
            error,
            'Backstop could not save the case note.',
          ),
        );

        throw error;
      }
    };

  const handleNotificationClick =
    async (
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
              (
                item,
              ) =>
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
          setAppError(
            errorMessage(
              error,
              'Backstop could not update this reminder.',
            ),
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
        setAppError(
          errorMessage(
            error,
            'Backstop could not mark reminders as read.',
          ),
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
        setAppError(
          errorMessage(
            error,
            'Backstop could not update reminder settings.',
          ),
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
        setAppError(
          'Backstop could not request desktop-notification permission.',
        );
      }
    };

  const handleUpdatePurchaseDates =
    async (
      input:
        ProtectionInput,
    ) => {
      if (
        !selectedPurchaseId
      ) {
        return;
      }

      try {
        await protectionService.updateDates(
          selectedPurchaseId,
          input,
        );

        await Promise.all([
          refreshProtectedPurchases(),
          refreshResolutionCases(),
          refreshNotifications(),
        ]);
      } catch (error) {
        setAppError(
          errorMessage(
            error,
            'Backstop could not update the purchase dates.',
          ),
        );
      }
    };

  const handleLifecycleChange =
    async (
      status:
        PurchaseLifecycleStatus,
    ) => {
      if (
        !selectedPurchaseId
      ) {
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
        setAppError(
          errorMessage(
            error,
            'Backstop could not update this purchase status.',
          ),
        );
      }
    };

  const goHome =
    () => {
      setView(
        'home',
      );

      setSelectedPurchaseId(
        null,
      );

      setSelectedResolutionCaseId(
        null,
      );

      window.scrollTo({
        top:
          0,
        behavior:
          'smooth',
      });
    };

  const goDashboard =
    () => {
      if (!authUser) {
        setAuthDialogOpen(
          true,
        );

        return;
      }

      void Promise.all([
        refreshProtectedPurchases(),
        refreshResolutionCases(),
        refreshNotifications(),
      ]).catch(
        (
          error: unknown,
        ) => {
          setAppError(
            errorMessage(
              error,
              'Backstop could not refresh your protection data.',
            ),
          );
        },
      );

      setSelectedPurchaseId(
        null,
      );

      setSelectedResolutionCaseId(
        null,
      );

      setView(
        'dashboard',
      );

      window.scrollTo({
        top:
          0,
        behavior:
          'smooth',
      });
    };

  const goBackToPurchaseFromResolution =
    () => {
      if (
        !selectedResolutionCase
      ) {
        goDashboard();

        return;
      }

      handleOpenPurchase(
        selectedResolutionCase.purchaseId,
      );
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
        authUser={
          authUser
        }
        authPending={
          authPending
        }
        onSignIn={() =>
          setAuthDialogOpen(
            true,
          )
        }
        onSignOut={
          handleSignOut
        }
        onAccount={() =>
          setAccountDialogOpen(
            true,
          )
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

      {isBootstrapping && (
        <LinearProgress
          aria-label="Loading Backstop account data"
          sx={{
            position:
              'fixed',
            top:
              76,
            left:
              0,
            right:
              0,
            zIndex:
              19,
            height:
              2,
            bgcolor:
              'transparent',
            '& .MuiLinearProgress-bar': {
              background:
                'linear-gradient(90deg, #9D7BFF, #61F4D5)',
            },
          }}
        />
      )}

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
            resolutionCase={
              selectedPurchaseResolutionCase
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
            onOpenResolutionCase={() => {
              if (
                selectedPurchaseResolutionCase
              ) {
                handleOpenResolutionCase(
                  selectedPurchaseResolutionCase.id,
                );
              }
            }}
            onCreateResolutionCase={
              handleCreateResolutionCase
            }
          />
        )}

        {view ===
          'resolution' &&
          selectedResolutionCase && (
          <ResolutionCaseView
            resolutionCase={
              selectedResolutionCase
            }
            onBackToPurchase={
              goBackToPurchaseFromResolution
            }
            onStatusChange={
              handleResolutionStatusChange
            }
            onAddNote={
              handleAddResolutionNote
            }
          />
        )}

        {view ===
          'dashboard' && (
          <Dashboard
            purchases={
              protectedPurchases
            }
            cases={
              resolutionCases
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
            onOpenCase={
              handleOpenResolutionCase
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

      <AppFooter
        onPrivacy={() =>
          setPrivacyDialogOpen(
            true,
          )
        }
      />

      {authUser && (
        <AccountDialog
          open={
            accountDialogOpen
          }
          user={
            authUser
          }
          onClose={() =>
            setAccountDialogOpen(
              false,
            )
          }
          onDeleted={
            handleAccountDeleted
          }
        />
      )}

      <PrivacyDialog
        open={
          privacyDialogOpen
        }
        onClose={() =>
          setPrivacyDialogOpen(
            false,
          )
        }
      />

      <AuthDialog
        open={
          authDialogOpen
        }
        onClose={() => {
          setAuthDialogOpen(
            false,
          );

          setPendingProtectionInput(
            null,
          );
        }}
        onAuthenticated={
          handleAuthenticated
        }
      />

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
          Purchase protected. Backstop is now tracking its evidence, deadlines and reminder window.
        </Alert>
      </Snackbar>

      <Snackbar
        open={
          Boolean(
            appError,
          )
        }
        autoHideDuration={
          7000
        }
        onClose={() =>
          setAppError(
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
            setAppError(
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
          {appError}
        </Alert>
      </Snackbar>
    </Box>
  );
}
