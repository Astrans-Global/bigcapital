export const BANK_REC_STATUS = {
  DRAFT: 'draft',
  CLOSED: 'closed',
} as const;

export type BankRecStatus =
  (typeof BANK_REC_STATUS)[keyof typeof BANK_REC_STATUS];

export const BANK_REC_ERRORS = {
  BANK_ACCOUNT_REQUIRED: 'BANK_ACCOUNT_REQUIRED',
  BANK_REC_NOT_FOUND: 'BANK_REC_NOT_FOUND',
  DRAFT_ALREADY_EXISTS: 'DRAFT_ALREADY_EXISTS',
  OVERLAPPING_CLOSED_RANGE: 'OVERLAPPING_CLOSED_RANGE',
  MONTH_NOT_ALLOWED: 'MONTH_NOT_ALLOWED',
  START_DATE_LOCKED: 'START_DATE_LOCKED',
  REC_NOT_DRAFT: 'REC_NOT_DRAFT',
  REC_NOT_CLOSED: 'REC_NOT_CLOSED',
  CANNOT_REOPEN: 'CANNOT_REOPEN',
  DIFFERENCE_NOT_ZERO: 'DIFFERENCE_NOT_ZERO',
  DOCUMENT_LOCKED_BY_BANK_REC: 'DOCUMENT_LOCKED_BY_BANK_REC',
  INVOICE_LOCKED_BY_BANK_REC: 'INVOICE_LOCKED_BY_BANK_REC',
};

export const BANK_REC_LOCK_MESSAGE =
  'This document is on a closed bank reconciliation. Reopen the last Rec for that bank first.';

export const INVOICE_LOCK_MESSAGE =
  'This invoice is sealed — it is fully paid and every clearing payment is on a closed bank Rec. Reopen the last Rec for that bank first.';
