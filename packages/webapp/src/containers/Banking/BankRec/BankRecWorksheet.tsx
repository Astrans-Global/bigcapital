// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
  Button,
  Checkbox,
  Intent,
  Spinner,
  Tab,
  Tabs,
} from '@blueprintjs/core';
import styled from 'styled-components';

import {
  DashboardInsider,
  DashboardPageContent,
  DashboardActionsBar,
  AppToaster,
} from '@/components';
import {
  useBankRec,
  useSaveBankRec,
  useCloseBankRec,
  useReopenBankRec,
} from '@/hooks/query';
import { toastBankRecErrors } from './bankRecErrors';

function money(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BankRecWorksheet() {
  const history = useHistory();
  const { id } = useParams();
  const recId = Number(id);
  const [hideAfter, setHideAfter] = useState(true);
  const [ticks, setTicks] = useState({});
  const [tab, setTab] = useState('deposits');

  const { data: rec, isLoading, refetch } = useBankRec(recId, {
    hideAfterStatementDate: hideAfter,
  });
  const { mutateAsync: save, isLoading: saving } = useSaveBankRec();
  const { mutateAsync: close, isLoading: closing } = useCloseBankRec();
  const { mutateAsync: reopen, isLoading: reopening } = useReopenBankRec();

  const readOnly = rec?.status === 'closed';

  useEffect(() => {
    if (!rec) return;
    const next = {};
    [...(rec.deposits || []), ...(rec.payments || [])].forEach((line) => {
      next[line.account_transaction_id] = Boolean(line.ticked);
    });
    setTicks(next);
  }, [rec]);

  const deposits = rec?.deposits || [];
  const payments = rec?.payments || [];
  const visible = tab === 'deposits' ? deposits : payments;

  const liveSummary = useMemo(() => {
    if (!rec) return null;
    const all = [...deposits, ...payments];
    const clearedDeposits = all
      .filter((line) => ticks[line.account_transaction_id] && Number(line.debit) > 0)
      .reduce((sum, line) => sum + Number(line.debit), 0);
    const unclearedDeposits = all
      .filter((line) => !ticks[line.account_transaction_id] && Number(line.debit) > 0)
      .reduce((sum, line) => sum + Number(line.debit), 0);
    const clearedPayments = all
      .filter((line) => ticks[line.account_transaction_id] && Number(line.credit) > 0)
      .reduce((sum, line) => sum + Number(line.credit), 0);
    const unclearedPayments = all
      .filter((line) => !ticks[line.account_transaction_id] && Number(line.credit) > 0)
      .reduce((sum, line) => sum + Number(line.credit), 0);
    const beginning = Number(rec.beginning_balance || rec.summary?.beginning_balance || 0);
    const ending = Number(rec.ending_balance || rec.summary?.ending_balance || 0);
    const clearedBalance = beginning + clearedDeposits - clearedPayments;
    return {
      beginning,
      ending,
      clearedDeposits,
      unclearedDeposits,
      clearedPayments,
      unclearedPayments,
      clearedBalance,
      bankAccountBalance: Number(rec.summary?.bank_account_balance || 0),
      difference: ending - clearedBalance,
    };
  }, [rec, deposits, payments, ticks]);

  const payload = () => ({
    endingBalance: Number(rec?.ending_balance || 0),
    lines: [...deposits, ...payments].map((line) => ({
      accountTransactionId: line.account_transaction_id,
      ticked: Boolean(ticks[line.account_transaction_id]),
    })),
  });

  const handleTick = (lineId, value) => {
    if (readOnly) return;
    setTicks((current) => ({ ...current, [lineId]: value }));
  };

  const allVisibleTicked =
    visible.length > 0 &&
    visible.every((line) => ticks[line.account_transaction_id]);

  const handleTickAll = (value) => {
    if (readOnly) return;
    setTicks((current) => {
      const next = { ...current };
      visible.forEach((line) => {
        next[line.account_transaction_id] = value;
      });
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await save({ id: recId, values: payload() });
      AppToaster.show({ intent: Intent.SUCCESS, message: 'Draft Rec saved.' });
      history.push('/bank-recs');
    } catch (error) {
      toastBankRecErrors(error?.response?.data?.errors);
    }
  };

  const handleClose = async () => {
    try {
      await close({ id: recId, values: payload() });
      AppToaster.show({
        intent: Intent.SUCCESS,
        message: 'Bank Rec closed. Ticked documents are locked.',
      });
      refetch();
    } catch (error) {
      toastBankRecErrors(error?.response?.data?.errors);
    }
  };

  const handleReopen = async () => {
    try {
      await reopen(recId);
      AppToaster.show({
        intent: Intent.SUCCESS,
        message: 'Rec reopened. Ticks were kept.',
      });
      refetch();
    } catch (error) {
      toastBankRecErrors(error?.response?.data?.errors);
    }
  };

  if (isLoading || !rec || !liveSummary) {
    return (
      <DashboardInsider name="bank-rec-sheet">
        <div style={{ padding: 40 }}>
          <Spinner />
        </div>
      </DashboardInsider>
    );
  }

  return (
    <DashboardInsider name="bank-rec-sheet">
      <DashboardActionsBar>
        <Button onClick={() => history.push('/bank-recs')}>Back</Button>
        {!readOnly && (
          <>
            <Button loading={saving} onClick={handleSave}>
              Leave & Save
            </Button>
            <Button
              intent={Intent.PRIMARY}
              loading={closing}
              onClick={handleClose}
            >
              Reconciliation Now
            </Button>
          </>
        )}
        {rec.can_reopen && (
          <Button intent={Intent.WARNING} loading={reopening} onClick={handleReopen}>
            Reopen last Rec
          </Button>
        )}
      </DashboardActionsBar>
      <DashboardPageContent>
        <Sheet>
          <Main>
            <Header>
              <div>
                <h2>{rec.account_name}</h2>
                <p>
                  {rec.period_month} · {rec.start_date} to {rec.end_date} ·{' '}
                  {readOnly ? 'Closed' : 'Draft'}
                </p>
              </div>
            </Header>
            <Tabs
              id="bank-rec-tabs"
              selectedTabId={tab}
              onChange={setTab}
              renderActiveTabPanelOnly
            >
              <Tab
                id="deposits"
                title="Deposits and Other Credits"
                panel={
                  <LineTable
                    lines={deposits}
                    ticks={ticks}
                    readOnly={readOnly}
                    allTicked={allVisibleTicked && tab === 'deposits'}
                    onTick={handleTick}
                    onTickAll={handleTickAll}
                  />
                }
              />
              <Tab
                id="payments"
                title="Cheques and Payments"
                panel={
                  <LineTable
                    lines={payments}
                    ticks={ticks}
                    readOnly={readOnly}
                    allTicked={allVisibleTicked && tab === 'payments'}
                    onTick={handleTick}
                    onTickAll={handleTickAll}
                  />
                }
              />
            </Tabs>
          </Main>
          <Aside>
            <Checkbox
              checked={hideAfter}
              label="Hide transactions after statement date"
              onChange={(event) =>
                setHideAfter(event.currentTarget.checked)
              }
            />
            <Button minimal onClick={() => refetch()}>
              Refresh
            </Button>
            <SummaryRow
              label="Cleared deposits"
              value={liveSummary.clearedDeposits}
            />
            <SummaryRow
              label="Uncleared deposits"
              value={liveSummary.unclearedDeposits}
            />
            <SummaryRow
              label="Cleared payments"
              value={liveSummary.clearedPayments}
            />
            <SummaryRow
              label="Uncleared payments"
              value={liveSummary.unclearedPayments}
            />
            <SummaryRow
              label="Cleared balance"
              value={liveSummary.clearedBalance}
            />
            <SummaryRow
              label="Bank account balance"
              value={liveSummary.bankAccountBalance}
            />
            <Difference
              zero={Math.round(liveSummary.difference * 100) === 0}
            >
              <span>Balance difference</span>
              <strong>{money(liveSummary.difference)}</strong>
            </Difference>
          </Aside>
        </Sheet>
      </DashboardPageContent>
    </DashboardInsider>
  );
}

function LineTable({ lines, ticks, readOnly, allTicked, onTick, onTickAll }) {
  return (
    <TableWrap>
      <table>
        <thead>
          <tr>
            <th>
              <Checkbox
                checked={allTicked}
                disabled={readOnly || !lines.length}
                onChange={(event) => onTickAll(event.currentTarget.checked)}
              />
            </th>
            <th>Date</th>
            <th>Cheque / Ref #</th>
            <th>Payee</th>
            <th>Type</th>
            <th className="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.account_transaction_id}>
              <td>
                <Checkbox
                  checked={Boolean(ticks[line.account_transaction_id])}
                  disabled={readOnly}
                  onChange={(event) =>
                    onTick(
                      line.account_transaction_id,
                      event.currentTarget.checked,
                    )
                  }
                />
              </td>
              <td>{line.date}</td>
              <td>{line.reference_no || '—'}</td>
              <td>{line.payee || '—'}</td>
              <td>{line.type || '—'}</td>
              <td className="amount">{money(line.amount)}</td>
            </tr>
          ))}
          {!lines.length && (
            <tr>
              <td colSpan={6}>No transactions on this tab.</td>
            </tr>
          )}
        </tbody>
      </table>
    </TableWrap>
  );
}

function SummaryRow({ label, value }) {
  return (
    <Row>
      <span>{label}</span>
      <strong>{money(value)}</strong>
    </Row>
  );
}

const Sheet = styled.div`
  display: flex;
  gap: 24px;
  padding: 12px 16px 32px;
  align-items: flex-start;
`;

const Main = styled.div`
  flex: 1;
  min-width: 0;
`;

const Header = styled.div`
  margin-bottom: 12px;
  h2 {
    margin: 0 0 4px;
  }
  p {
    margin: 0;
    color: #5c7080;
  }
`;

const Aside = styled.aside`
  width: 280px;
  padding: 12px 14px;
  border: 1px solid #dce0e5;
  border-radius: 4px;
  background: #fafbfc;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #edf0f2;
  font-size: 13px;
`;

const Difference = styled(Row)`
  border-bottom: 0;
  margin-top: 8px;
  color: ${(props) => (props.zero ? '#0d8050' : '#c23030')};
`;

const TableWrap = styled.div`
  overflow: auto;
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid #edf0f2;
    font-size: 13px;
  }
  th.amount,
  td.amount {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
`;
