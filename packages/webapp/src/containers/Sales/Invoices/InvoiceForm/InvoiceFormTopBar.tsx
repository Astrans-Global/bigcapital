// @ts-nocheck
import React from 'react';
import styled from 'styled-components';
import {
  Alignment,
  NavbarGroup,
  NavbarDivider,
  Classes,
} from '@blueprintjs/core';
import {
  useSetPrimaryWarehouseToForm,
  useSetPrimaryBranchToForm,
} from './utils';

import { Features } from '@/constants';
import { useInvoiceFormContext } from './InvoiceFormProvider';
import { useFeatureCan } from '@/hooks/state';
import { InvoiceDmsStatusControl } from './InvoiceDmsStatusControl';
import { InvoiceStatutoryDownload } from './InvoiceStatutoryDownload';
import {
  BranchSelect,
  FeatureCan,
  WarehouseSelect,
  FormTopbar,
  FormWarehouseSelectButton,
  FormBranchSelectButton,
} from '@/components';

/**
 * Invoice form topbar -- always shows the Astrans DMS status control
 * (Pending/Reserved/Invoiced/Delivered, see docs/ops/PHASE1.md, "Status
 * pipeline") on the right so it's in the same obvious place regardless of
 * whether the Warehouses/Branches features are on.
 * @returns {JSX.Element}
 */
export function InvoiceFormTopBar() {
  // Features guard.
  const { featureCan } = useFeatureCan();

  // Sets the primary warehouse to form.
  useSetPrimaryWarehouseToForm();

  // Sets the primary branch to form.
  useSetPrimaryBranchToForm();

  const showLeftGroup =
    featureCan(Features.Warehouses) || featureCan(Features.Branches);

  return (
    <FormTopbar>
      {showLeftGroup && (
        <NavbarGroup align={Alignment.LEFT}>
          <FeatureCan feature={Features.Branches}>
            <InvoiceFormSelectBranch />
          </FeatureCan>
          {featureCan(Features.Warehouses) &&
            featureCan(Features.Branches) && <NavbarDivider />}
          <FeatureCan feature={Features.Warehouses}>
            <InvoiceFormSelectWarehouse />
          </FeatureCan>
        </NavbarGroup>
      )}
      <NavbarGroup align={Alignment.RIGHT}>
        <InvoiceDmsStatusControl />
        <InvoiceStatutoryDownload />
      </NavbarGroup>
    </FormTopbar>
  );
}

function InvoiceFormSelectBranch() {
  // Invoice form context.
  const { branches, isBranchesLoading } = useInvoiceFormContext();

  return isBranchesLoading ? (
    <DetailsBarSkeletonBase className={Classes.SKELETON} />
  ) : (
    <BranchSelect
      name={'branch_id'}
      branches={branches}
      input={FormBranchSelectButton}
      popoverProps={{ minimal: true }}
      fill={false}
    />
  );
}

function InvoiceFormSelectWarehouse() {
  // Invoice form context.
  const { warehouses, isWarehouesLoading } = useInvoiceFormContext();

  return isWarehouesLoading ? (
    <DetailsBarSkeletonBase className={Classes.SKELETON} />
  ) : (
    <WarehouseSelect
      name={'warehouse_id'}
      warehouses={warehouses}
      input={FormWarehouseSelectButton}
      popoverProps={{ minimal: true }}
      fill={false}
    />
  );
}

const DetailsBarSkeletonBase = styled.div`
  letter-spacing: 10px;
  margin-right: 10px;
  margin-left: 10px;
  font-size: 8px;
  width: 140px;
  height: 10px;
`;
