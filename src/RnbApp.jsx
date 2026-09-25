import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { UserProvider, useUser } from './context/UserContext';
import { restoreSessionFromStorage } from './services/auth';
import { isAuthenticated } from './utils/session';
import RequireAuth from './routes/RequireAuth';
import RnbDashboardLayout from './layout/RnbDashboardLayout';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import UpdateUserDetailsPage from './pages/UpdateUserDetailsPage';
import RnbLoader from './components/RnbLoader';
import RnbHomePage from './pages/RnbHomePage';
import RnbModulesHomePage from './pages/RnbModulesHomePage';
import DataViewPage from './pages/DataViewPage';
import DirectReportPage from './pages/DirectReportPage';
import WelcomePage, { dismissWelcome, isWelcomeDismissed } from './pages/WelcomePage';
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
      <WelcomePage
        onContinue={() => {
          dismissWelcome();
          setShowWelcome(false);
        }}
      />
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
      <SessionBootstrap>
        <WelcomeGate>
          <Toaster position="top-right" />
          <DynamicRoutes />
        </WelcomeGate>
      </SessionBootstrap>
    </QueryClientProvider>
  );
}
