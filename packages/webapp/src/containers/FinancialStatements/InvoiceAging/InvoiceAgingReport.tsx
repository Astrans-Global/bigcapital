// @ts-nocheck
import React, { useMemo, useState } from 'react';
import moment from 'moment';
import intl from 'react-intl-universal';
import {
  NavbarGroup,
  Button,
  Classes,
  FormGroup,
  Checkbox,
} from '@blueprintjs/core';
import {
  DashboardActionsBar,
  DashboardPageContent,
  FinancialSheet,
  ReportDataTable,
  FormattedMessage as T,
} from '@/components';
import { TableStyle } from '@/constants';
import { useCustomerAreas } from '@/hooks/query';
import {
  useOutstandingAgingReport,
  useOutstandingAgingXlsx,
  useOutstandingAgingCsv,
  useOutstandingAgingPdf,
  useRdOutstandingAgingReport,
  useRdOutstandingAgingXlsx,
  useRdOutstandingAgingCsv,
  useRdOutstandingAgingPdf,
} from '@/hooks/query';
import { FinancialReportPage } from '../FinancialReportPage';

function tableToColumns(table) {
  return (table?.columns || []).map((col) => ({
    id: col.key,
    Header: col.label,
    accessor: (row) => {
      const cell = (row.cells || []).find((item) => item.key === col.key);
      return cell?.value ?? '';
    },
    width: 110,
  }));
}

export function OutstandingAgingSummary() {
  return <InvoiceAgingSheet kind="outstanding" />;
}

export function RdOutstandingAgingSummary() {
  return <InvoiceAgingSheet kind="rd" />;
}

function InvoiceAgingSheet({ kind }) {
  const isRd = kind === 'rd';
  const [asDate, setAsDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedAreas, setSelectedAreas] = useState([]);
  const { data: areas } = useCustomerAreas();

  const query = useMemo(
    () => ({
      asDate,
      ...(selectedAreas.length ? { areaIds: selectedAreas } : {}),
    }),
    [asDate, selectedAreas],
  );

  const outstanding = useOutstandingAgingReport(query, { enabled: !isRd });
  const rd = useRdOutstandingAgingReport(query, { enabled: isRd });
  const reportQuery = isRd ? rd : outstanding;

  const outstandingXlsx = useOutstandingAgingXlsx(query);
  const outstandingCsv = useOutstandingAgingCsv(query);
  const outstandingPdf = useOutstandingAgingPdf(query);
  const rdXlsx = useRdOutstandingAgingXlsx(query);
  const rdCsv = useRdOutstandingAgingCsv(query);
  const rdPdf = useRdOutstandingAgingPdf(query);

  const xlsx = isRd ? rdXlsx : outstandingXlsx;
  const csv = isRd ? rdCsv : outstandingCsv;
  const pdf = isRd ? rdPdf : outstandingPdf;

  const table = reportQuery.data?.table;
  const meta = reportQuery.data?.meta;
  const columns = useMemo(() => tableToColumns(table), [table]);

  const toggleArea = (id) => {
    setSelectedAreas((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
    <FinancialReportPage name={isRd ? 'RD-Outstanding-Aging' : 'Outstanding-Aging'}>
      <DashboardActionsBar>
        <NavbarGroup>
          <Button
            className={Classes.MINIMAL}
            icon="refresh"
            text={<T id={'recalc_report'} />}
            onClick={() => reportQuery.refetch()}
          />
          <Button
            className={Classes.MINIMAL}
            text="Excel"
            onClick={() => xlsx.mutateAsync()}
          />
          <Button
            className={Classes.MINIMAL}
            text="CSV"
            onClick={() => csv.mutateAsync()}
          />
          <Button
            className={Classes.MINIMAL}
            text="PDF"
            onClick={() => pdf.mutateAsync()}
          />
        </NavbarGroup>
      </DashboardActionsBar>
      <DashboardPageContent>
        <div style={{ padding: '12px 16px', display: 'flex', gap: 24 }}>
          <FormGroup label={intl.get('as_date')} inline>
            <input
              type="date"
              value={asDate}
              onChange={(event) => setAsDate(event.target.value)}
            />
          </FormGroup>
          <FormGroup label={intl.get('area')} inline>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {(areas || []).map((area) => (
                <Checkbox
                  key={area.id}
                  checked={selectedAreas.includes(area.id)}
                  label={area.name}
                  onChange={() => toggleArea(area.id)}
                />
              ))}
            </div>
          </FormGroup>
        </div>
        <FinancialSheet
          companyName={meta?.organizationName}
          sheetType={
            meta?.sheetName ||
            intl.get(
              isRd
                ? 'rd_outstanding_aging_summary'
                : 'outstanding_aging_summary',
            )
          }
          dateText={meta?.formattedAsDate}
        >
          <ReportDataTable
            columns={columns}
            data={table?.rows || []}
            noInitialFetch={true}
            sticky={true}
            styleName={TableStyle.Constrant}
          />
        </FinancialSheet>
      </DashboardPageContent>
    </FinancialReportPage>
  );
}
