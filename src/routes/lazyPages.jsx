import { lazy, Suspense } from 'react';
import RnbLoader from '../components/RnbLoader';

export const LoginPage = lazy(() => import('../pages/LoginPage'));
export const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
export const ChangePasswordPage = lazy(() => import('../pages/ChangePasswordPage'));
export const UpdateUserDetailsPage = lazy(() => import('../pages/UpdateUserDetailsPage'));
export const RnbHomePage = lazy(() => import('../pages/RnbHomePage'));
export const RnbModulesHomePage = lazy(() => import('../pages/RnbModulesHomePage'));
export const DataViewPage = lazy(() => import('../pages/DataViewPage'));
export const DirectReportPage = lazy(() => import('../pages/DirectReportPage'));
export const WelcomePage = lazy(() => import('../pages/WelcomePage'));

export function RouteFallback({ message = 'Loading…' }) {
  return <RnbLoader variant="page" message={message} />;
}

export function LazyRoute({ children, message }) {
  return <Suspense fallback={<RouteFallback message={message} />}>{children}</Suspense>;
}
