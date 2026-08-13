// @ts-nocheck
import React from 'react';
import { FormattedMessage as T } from '@/components';
import { AstransLogo } from '@/components/Icons/AstransLogo';

export default function DashboardErrorBoundary({}) {
  return (
    <div class="dashboard__error-boundary">
      <h1>
        <T id={'sorry_about_that_something_went_wrong'} />
      </h1>
      <p>
        <T id={'if_the_problem_stuck_please_contact_us_as_soon_as_possible'} />
      </p>
      <AstransLogo variant="black" height={36} />
    </div>
  );
}
