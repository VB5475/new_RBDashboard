import { useEffect, useState, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from './context/UserContext';
import { restoreSessionFromStorage } from './services/auth';
import { isAuthenticated } from './utils/session';
import RequireAuth from './routes/RequireAuth';
import RnbDashboardLayout from './layout/RnbDashboardLayout';
import RnbLoader from './components/RnbLoader';
import AppToaster from './components/AppToaster';
import {
  LoginPage,
  ForgotPasswordPage,
  ChangePasswordPage,
  UpdateUserDetailsPage,
  RnbHomePage,
  RnbModulesHomePage,
  DataViewPage,
  DirectReportPage,
  WelcomePage,
  LazyRoute,
} from './routes/lazyPages';
import { dismissWelcome, isWelcomeDismissed } from './pages/welcomeSession';
import {
  canAccessOverview,
  overviewPathsToRegister,
  pickDefaultLandingPath,
} from './constants/routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

function DynamicRoutes() {
  const { user, allowedRoutes } = useUser();
  const registering = user?.RegisteringRoutes ?? [];

  const routeElements = registering.map((route) => {
    const path = route.path?.trim();
    if (!path) return null;

    let element = <RnbHomePage />;
    if (route.component === 'Dataview') {
      element = (
        <DataViewPage
          sourceName={route.sourcename}
          databasepaging={route.databasepaging}
        />
      );
    } else if (route.component === 'DirectReport') {
      element = <DirectReportPage />;
    }

    if (!allowedRoutes.includes(path)) {
      element = (
        <div className="rnb-home-message rnb-home-error">Unauthorized</div>
      );
    }

    return <Route key={path} path={path} element={element} />;
  });

  const overviewAllowed = canAccessOverview(allowedRoutes);
  const overviewRoutes = overviewPathsToRegister(allowedRoutes).map((path) => (
    <Route
      key={`overview-${path}`}
      path={path}
      element={
        overviewAllowed ? (
          <RnbModulesHomePage />
        ) : (
          <div className="rnb-home-message rnb-home-error">Unauthorized</div>
        )
      }
    />
  ));

  const defaultHome = pickDefaultLandingPath(allowedRoutes);

  return (
    <LazyRoute message="Loading page…">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
        <Route
          element={
            <RequireAuth>
              <RnbDashboardLayout />
            </RequireAuth>
          }
        >
          {overviewRoutes}
          {routeElements}
          <Route path="/changepassword" element={<ChangePasswordPage />} />
          <Route path="/updateuserdetails" element={<UpdateUserDetailsPage />} />
          <Route index element={<Navigate to={defaultHome} replace />} />
          <Route path="*" element={<Navigate to={defaultHome} replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </LazyRoute>
  );
}

function WelcomeGate({ children }) {
  const { user } = useUser();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const shouldShow =
      user?.ShowWelcomePage &&
      !isWelcomeDismissed() &&
      (user?.AllowedRoutes?.length ?? 0) > 0;
    setShowWelcome(Boolean(shouldShow));
  }, [user]);

  if (showWelcome) {
    return (
      <Suspense
        fallback={
          <RnbLoader variant="fullscreen" message="Loading welcome…" />
        }
      >
        <WelcomePage
          onContinue={() => {
            dismissWelcome();
            setShowWelcome(false);
          }}
        />
      </Suspense>
    );
  }

  return children;
}

function SessionBootstrap({ children }) {
  const [ready, setReady] = useState(false);
  const [initialUser, setInitialUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isAuthenticated()) {
        const user = await restoreSessionFromStorage();
        if (!cancelled) setInitialUser(user);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <RnbLoader variant="fullscreen" message="Starting RNB Dashboard" />
    );
  }

  return <UserProvider initialUser={initialUser}>{children}</UserProvider>;
}

export default function RnbApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppToaster />
      <SessionBootstrap>
        <WelcomeGate>
          <DynamicRoutes />
        </WelcomeGate>
      </SessionBootstrap>
    </QueryClientProvider>
  );
}
