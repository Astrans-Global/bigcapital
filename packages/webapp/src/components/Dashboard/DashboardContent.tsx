// @ts-nocheck
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation } from 'react-router-dom';
import DashboardTopbar from '@/components/Dashboard/DashboardTopbar';
import DashboardContentRoutes from '@/components/Dashboard/DashboardContentRoute';
import DashboardErrorBoundary from './DashboardErrorBoundary';

/**
 * Hidden URL `/error-preview` shows the same error screen (Astrans logo +
 * name) so we can check light and dark without crashing a real page.
 * The top bar stays so Light mode can be toggled.
 */
export default React.forwardRef(({}, ref) => {
  const location = useLocation();
  const isErrorPreview = location.pathname === '/error-preview';

  return (
    <ErrorBoundary FallbackComponent={DashboardErrorBoundary}>
      <div className="dashboard-content" id="dashboard" ref={ref}>
        <DashboardTopbar />
        {isErrorPreview ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <DashboardErrorBoundary />
          </div>
        ) : (
          <DashboardContentRoutes />
        )}
      </div>
    </ErrorBoundary>
  );
});
