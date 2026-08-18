import React from 'react';
import styled from 'styled-components';
import { FormattedMessage as T } from '@/components';
import { AstransLogo } from '@/components/Icons/AstransLogo';
import { useIsDarkMode } from '@/hooks/useDarkMode';

export default function DashboardErrorBoundary() {
  const isDarkMode = useIsDarkMode();

  return (
    <div className="dashboard__error-boundary">
      <h1>
        <T id={'sorry_about_that_something_went_wrong'} />
      </h1>
      <p>
        <T id={'if_the_problem_stuck_please_contact_us_as_soon_as_possible'} />
      </p>
      <ErrorBrand>
        <AstransLogo variant={isDarkMode ? 'white' : 'black'} height={40} />
        <ErrorWordmark>Astrans</ErrorWordmark>
      </ErrorBrand>
    </div>
  );
}

const ErrorBrand = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
`;

const ErrorWordmark = styled.span`
  font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #3d4450;

  .bp4-dark & {
    color: rgba(255, 255, 255, 0.85);
  }
`;
