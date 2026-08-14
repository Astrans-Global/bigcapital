// @ts-nocheck
import React, { useCallback, useMemo } from 'react';
import { Suggest } from '@blueprintjs-formik/select';
import { FormGroup, Intent, MenuItem } from '@blueprintjs/core';
import { CellType } from '@/constants';
import { useItemPriceLots } from '@/hooks/query';
import { formattedAmount } from '@/utils';

/**
 * Item price-lot (GRN cost/discount batch) picker for a sale-invoice line --
 * see docs/ops/PHASE1.md ("Lots / GRN", "Status pipeline"). Only meaningful
 * once an item is picked on the row (each lot belongs to one item), so shows
 * a disabled placeholder until then. Picking a lot pre-fills the row's
 * `rate`/`discount` with that lot's own price/discount (still editable
 * after, matching the original spec's worked example of "adjusting" the
 * picked combo's price) and records `item_price_lot_id` so the server can
 * validate/consume stock from the right batch.
 *
 * Lots already fully consumed by *other* invoices are hidden -- oversell is
 * blocked server-side anyway, so there's no point offering a batch with
 * nothing left. The line's own currently-picked lot always stays visible
 * even at zero float, so re-opening an existing invoice never loses its
 * previous selection.
 */
export function ItemPriceLotSuggestInputCell({
  column: { id },
  row: { index, original },
  cell: { value: cellValue },
  payload: {
    errors,
    updateItemPriceLot,
    warehouseId,
    excludeInvoiceId,
    currencyCode,
  },
}) {
  const error = errors?.[index]?.[id];
  const itemId = original?.item_id;

  const { data: lots = [], isFetching } = useItemPriceLots(
    { itemId, warehouseId, excludeInvoiceId },
    { enabled: !!itemId },
  );

  const availableLots = useMemo(
    () => lots.filter((lot) => lot.floatQty > 0 || lot.id === cellValue),
    [lots, cellValue],
  );

  const handleLotSelected = useCallback(
    (_value, lot) => {
      updateItemPriceLot(index, lot);
    },
    [updateItemPriceLot, index],
  );

  const lotLabel = useCallback(
    (lot) =>
      `${formattedAmount(lot.listPriceExclVat, currencyCode, {
        noZero: true,
      })}${lot.discountPercent ? ` · -${lot.discountPercent}%` : ''} · ${lot.floatQty} left`,
    [currencyCode],
  );

  if (!itemId) {
    return (
      <FormGroup>
        <span style={{ opacity: 0.5, fontSize: 12 }}>Select item first</span>
      </FormGroup>
    );
  }

  return (
    <FormGroup intent={error ? Intent.DANGER : null}>
      <Suggest<any>
        selectedValue={cellValue}
        items={availableLots}
        valueAccessor={'id'}
        labelAccessor={lotLabel}
        textAccessor={lotLabel}
        popoverProps={{ minimal: true, boundary: 'window' }}
        inputProps={{
          placeholder: isFetching ? 'Loading...' : 'Select lot...',
        }}
        fill={true}
        onItemChange={handleLotSelected}
        noResults={<MenuItem disabled text="No stock lots available" />}
      />
    </FormGroup>
  );
}

ItemPriceLotSuggestInputCell.cellType = CellType.Field;
