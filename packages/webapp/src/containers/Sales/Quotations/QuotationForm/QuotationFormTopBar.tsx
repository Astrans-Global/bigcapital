// @ts-nocheck
import React from 'react';
import {
  Alignment,
  NavbarGroup,
  NavbarDivider,
  Classes,
} from '@blueprintjs/core';
import {
  useSetPrimaryBranchToForm,
  useSetPrimaryWarehouseToForm,
} from './utils';
import { Features } from '@/constants';
import { useFeatureCan } from '@/hooks/state';
import {
  BranchSelect,
  FeatureCan,
  WarehouseSelect,
  FormTopbar,
  DetailsBarSkeletonBase,
  FormWarehouseSelectButton,
  FormBranchSelectButton,
} from '@/components';
import { useQuotationFormContext } from './QuotationFormProvider';

export function QuotationFormTopBar() {
  const { featureCan } = useFeatureCan();
  useSetPrimaryWarehouseToForm();
  useSetPrimaryBranchToForm();

  if (!featureCan(Features.Warehouses) && !featureCan(Features.Branches)) {
    return null;
  }

  return (
    <FormTopbar>
      <NavbarGroup align={Alignment.LEFT}>
        <FeatureCan feature={Features.Branches}>
          <QuotationFormSelectBranch />
        </FeatureCan>
        {featureCan(Features.Warehouses) && featureCan(Features.Branches) && (
          <NavbarDivider />
        )}
        <FeatureCan feature={Features.Warehouses}>
          <QuotationFormSelectWarehouse />
        </FeatureCan>
      </NavbarGroup>
    </FormTopbar>
  );
}

function QuotationFormSelectBranch() {
  const { branches, isBootLoading } = useQuotationFormContext();
  return isBootLoading ? (
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

function QuotationFormSelectWarehouse() {
  const { warehouses } = useQuotationFormContext();
  return (
    <WarehouseSelect
      name={'warehouse_id'}
      warehouses={warehouses}
      input={FormWarehouseSelectButton}
      popoverProps={{ minimal: true }}
      fill={false}
    />
  );
}
