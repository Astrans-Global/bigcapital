export const COLLECTION_NUMBER_SERIES = {
  cash: { prefix: 'CIH-', suffix: '' },
  bank_transfer: { prefix: 'PAY-', suffix: '-BT' },
  bank_deposit: { prefix: 'PAY-', suffix: '-BD' },
};

export function chequeAreaLetter(areaName) {
  const match = String(areaName || '').match(/[A-Za-z]/);
  return (match ? match[0] : 'X').toUpperCase();
}

export function previewChequeDocumentNo(areaName, settings) {
  const letter = chequeAreaLetter(areaName);
  const prefix = settings?.numberPrefix || `CH${letter}-`;
  const next = settings?.nextNumber || '000001';
  return `${prefix}${next}`;
}

export function previewCollectionNumber(method, settings, extra = {}) {
  if (method === 'pd_cheque') {
    return extra.areaName
      ? previewChequeDocumentNo(extra.areaName, settings)
      : '';
  }
  const series =
    COLLECTION_NUMBER_SERIES[method] || COLLECTION_NUMBER_SERIES.bank_deposit;
  const prefix = settings?.numberPrefix || series.prefix;
  const next = settings?.nextNumber || '00001';
  const suffix =
    settings?.numberSuffix === undefined || settings?.numberSuffix === null
      ? series.suffix
      : settings.numberSuffix;
  return `${prefix}${next}${suffix}`;
}
