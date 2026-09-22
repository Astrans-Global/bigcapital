// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Button,
  FormGroup,
  HTMLSelect,
  InputGroup,
  Intent,
} from '@blueprintjs/core';

import {
  DashboardInsider,
  DashboardPageContent,
  DashboardActionsBar,
  AppToaster,
} from '@/components';
import {
  useBankRecEligibility,
  useCreateBankRec,
  useReopenBankRec,
} from '@/hooks/query';
import { toastBankRecErrors } from './bankRecErrors';

export default function BankRecSetup() {
  const history = useHistory();
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endingBalance, setEndingBalance] = useState('');
  const [periodMonth, setPeriodMonth] = useState('');

  const numericAccountId = accountId ? Number(accountId) : undefined;
  const { data: eligibility, isLoading } = useBankRecEligibility(
    numericAccountId,
    startDate || undefined,
  );
  const { mutateAsync: create, isLoading: saving } = useCreateBankRec();
  const { mutateAsync: reopen, isLoading: reopening } = useReopenBankRec();

  const banks = eligibility?.banks || [];
  const lockedStart =
    eligibility?.lockedStartDate ?? eligibility?.locked_start_date;
  const beginning =
    eligibility?.beginningBalance ?? eligibility?.beginning_balance;
  const draftId = eligibility?.draftId ?? eligibility?.draft_id;

  useEffect(() => {
    if (draftId && numericAccountId) {
      AppToaster.show({
        intent: Intent.PRIMARY,
        message: 'A draft Rec already exists for this bank. Opening it.',
      });
      history.replace(`/bank-recs/${draftId}`);
    }
  }, [draftId, numericAccountId, history]);

  useEffect(() => {
    if (lockedStart) {
      setStartDate(lockedStart);
    }
  }, [lockedStart]);

  useEffect(() => {
    if (endDate) {
      setPeriodMonth(endDate.slice(0, 7));
    }
  }, [endDate]);

  const canCreate = useMemo(
    () => accountId && startDate && endDate && endingBalance !== '',
    [accountId, startDate, endDate, endingBalance],
  );

  const handleCreate = async () => {
    try {
      const rec = await create({
        accountId: Number(accountId),
        startDate,
        endDate,
        endingBalance: Number(endingBalance),
        periodMonth,
      });
      history.push(`/bank-recs/${rec.id}`);
    } catch (error) {
      toastBankRecErrors(error?.response?.data?.errors);
    }
  };

  return (
    <DashboardInsider loading={isLoading} name="bank-rec-setup">
      <DashboardActionsBar>
        <Button onClick={() => history.push('/bank-recs')}>Back</Button>
        <Button
          intent={Intent.PRIMARY}
          disabled={!canCreate}
          loading={saving}
          onClick={handleCreate}
        >
          Continue
        </Button>
      </DashboardActionsBar>
      <DashboardPageContent>
        <div style={{ maxWidth: 520, padding: 16 }}>
          <FormGroup label="Bank account" labelInfo="*">
            <HTMLSelect
              fill
              value={accountId}
              onChange={(event) => setAccountId(event.currentTarget.value)}
            >
              <option value="">Select a bank</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.code ? `${bank.code} — ${bank.name}` : bank.name}
                </option>
              ))}
            </HTMLSelect>
          </FormGroup>
          <FormGroup label="Beginning balance">
            <InputGroup
              value={
                beginning === undefined || beginning === null
                  ? ''
                  : Number(beginning).toFixed(2)
              }
              disabled
            />
          </FormGroup>
          <FormGroup label="Start date" labelInfo="*">
            <InputGroup
              type="date"
              value={startDate}
              disabled={Boolean(lockedStart)}
              onChange={(event) => setStartDate(event.currentTarget.value)}
            />
          </FormGroup>
          <FormGroup label="End date" labelInfo="*">
            <InputGroup
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.currentTarget.value)}
            />
          </FormGroup>
          <FormGroup label="Ending balance" labelInfo="*">
            <InputGroup
              type="number"
              step="0.01"
              value={endingBalance}
              onChange={(event) => setEndingBalance(event.currentTarget.value)}
            />
          </FormGroup>
          <FormGroup label="Month">
            <InputGroup
              type="month"
              value={periodMonth}
              onChange={(event) => setPeriodMonth(event.currentTarget.value)}
            />
          </FormGroup>
          {(eligibility?.canReopenLast || eligibility?.can_reopen_last) &&
            (eligibility?.lastRec || eligibility?.last_rec) && (
            <Button
              intent={Intent.WARNING}
              loading={reopening}
              onClick={async () => {
                const lastRec = eligibility.lastRec || eligibility.last_rec;
                try {
                  await reopen(lastRec.id);
                  history.push(`/bank-recs/${lastRec.id}`);
                } catch (error) {
                  toastBankRecErrors(error?.response?.data?.errors);
                }
              }}
            >
              Reopen last Rec
            </Button>
          )}
        </div>
      </DashboardPageContent>
    </DashboardInsider>
  );
}
