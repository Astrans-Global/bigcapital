// @ts-nocheck
import React from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { useHistory } from 'react-router-dom';
import { EmptyStatus } from '@/components';
import { Can } from '@/components';
import { SaleEstimateAction, AbilitySubject } from '@/constants/abilityOption';

export function QuotationsEmptyStatus() {
  const history = useHistory();
  return (
    <EmptyStatus
      title={"It's time to send quotations to potential customers"}
      description={
        <p>
          A quotation is a price list for a prospect. It does not create a
          customer, does not turn into an invoice, and does not post to the
          books.
        </p>
      }
      action={
        <Can I={SaleEstimateAction.Create} a={AbilitySubject.Estimate}>
          <Button
            intent={Intent.PRIMARY}
            large={true}
            onClick={() => {
              history.push('/quotations/new');
            }}
          >
            New quotation
          </Button>
        </Can>
      }
    />
  );
}
