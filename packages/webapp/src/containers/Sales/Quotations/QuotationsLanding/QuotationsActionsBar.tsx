// @ts-nocheck
import React from 'react';
import {
  Button,
  Classes,
  NavbarDivider,
  NavbarGroup,
  Alignment,
} from '@blueprintjs/core';
import { useHistory } from 'react-router-dom';
import {
  Icon,
  Can,
  DashboardActionsBar,
  DashboardActionViewsList,
} from '@/components';
import { SaleEstimateAction, AbilitySubject } from '@/constants/abilityOption';
import { useRefreshQuotations } from '@/hooks/query';

export function QuotationsActionsBar() {
  const history = useHistory();
  const { refresh } = useRefreshQuotations();

  return (
    <DashboardActionsBar>
      <NavbarGroup>
        <DashboardActionViewsList
          resourceName={'quotations'}
          allMenuItem={true}
          allMenuItemText={'All'}
          views={[]}
          onChange={() => {}}
        />
        <NavbarDivider />
        <Can I={SaleEstimateAction.Create} a={AbilitySubject.Estimate}>
          <Button
            className={Classes.MINIMAL}
            icon={<Icon icon={'plus'} />}
            text={'New Quotation'}
            onClick={() => history.push('/quotations/new')}
          />
        </Can>
        <NavbarDivider />
      </NavbarGroup>

      <NavbarGroup align={Alignment.RIGHT}>
        <Button
          className={Classes.MINIMAL}
          icon={<Icon icon="refresh-16" iconSize={14} />}
          onClick={() => refresh()}
        />
      </NavbarGroup>
    </DashboardActionsBar>
  );
}
