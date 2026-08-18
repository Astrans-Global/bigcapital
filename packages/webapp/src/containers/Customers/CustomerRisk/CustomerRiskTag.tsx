// @ts-nocheck
import React from 'react';
import { Tag, Intent } from '@blueprintjs/core';
import type { CustomerRiskCategory } from '@bigcapital/sdk-ts';

const RISK_INTENT: Record<CustomerRiskCategory, Intent> = {
  A: Intent.SUCCESS,
  B: Intent.PRIMARY,
  C: Intent.WARNING,
  D: Intent.DANGER,
};

const RISK_LABEL: Record<CustomerRiskCategory, string> = {
  A: 'Class A',
  B: 'Class B',
  C: 'Class C',
  D: 'Class D',
};

/**
 * A/B/C/D customer risk badge — see docs/ops/PHASE1.md ("Customers").
 */
export function CustomerRiskTag({
  category,
  large,
}: {
  category?: CustomerRiskCategory | null;
  large?: boolean;
}) {
  if (!category) {
    return null;
  }
  return (
    <Tag intent={RISK_INTENT[category]} minimal round large={large}>
      {RISK_LABEL[category] || category}
    </Tag>
  );
}
