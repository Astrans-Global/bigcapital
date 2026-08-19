// @ts-nocheck
import React, { useCallback } from 'react';
import classNames from 'classnames';

import { CLASSES } from '@/constants/classes';
import { DataTableEditable } from '@/components';

import { useEditableItemsEntriesColumns } from './components';
import {
  useFetchItemRow,
  useComposeRowsOnEditTableCell,
  useComposeRowsOnRemoveTableRow,
  useComposeRowsOnNewRow,
  useComposeRowsOnEditPriceLot,
} from './utils';
import {
  ItemEntriesTableProvider,
  useItemEntriesTableContext,
} from './ItemEntriesTableProvider';
import { useUncontrolled } from '@/hooks/useUncontrolled';
import { ItemEntry } from '@/interfaces/ItemEntries';

interface ItemsEntriesTableProps {
  initialValue?: ItemEntry;
  value?: ItemEntry[];
  onChange?: (entries: ItemEntry[]) => void;
  taxRates?: any[];
  minLinesNumber?: number;
  maxLinesNumber?: number;
  enableTaxRates?: boolean;
}

/**
 * Items entries table.
 */
export function ItemsEntriesTable(props: ItemsEntriesTableProps) {
  const { value, initialValue, onChange } = props;

  const [localValue, handleChange] = useUncontrolled({
    value,
    initialValue,
    finalValue: [],
    onChange,
  });
  return (
    <ItemEntriesTableProvider value={{ ...props, localValue, handleChange }}>
      <ItemEntriesTableRoot />
    </ItemEntriesTableProvider>
  );
}

/**
 * Items entries table logic.
 * @returns {JSX.Element}
 */
function ItemEntriesTableRoot() {
  const {
    localValue,
    defaultEntry,
    handleChange,
    items,
    errors,
    currencyCode,
    landedCost,
    taxRates,
    itemType,
    enablePriceLots,
    warehouseId,
    excludeInvoiceId,
    includeZeroQty,
  } = useItemEntriesTableContext();

  // Editiable items entries columns.
  const columns = useEditableItemsEntriesColumns();

  const composeRowsOnEditCell = useComposeRowsOnEditTableCell();
  const composeRowsOnDeleteRow = useComposeRowsOnRemoveTableRow();
  const composeRowsOnNewRow = useComposeRowsOnNewRow();
  const composeRowsOnEditPriceLot = useComposeRowsOnEditPriceLot();

  // Handle the fetch item row details.
  const { setItemRow, cellsLoading, isItemFetching } = useFetchItemRow({
    landedCost,
    itemType,
    notifyNewRow: (newRow, rowIndex) => {
      // Update the rate, description and quantity data of the row.
      const newRows = composeRowsOnNewRow(rowIndex, newRow, localValue);
      handleChange(newRows);
    },
  });
  // Handles the editor data update.
  const handleUpdateData = useCallback(
    (rowIndex, columnId, value) => {
      if (columnId === 'item_id') {
        setItemRow({ rowIndex, columnId, itemId: value });
      }
      const newRows = composeRowsOnEditCell(rowIndex, columnId, value);
      handleChange(newRows);
    },
    [localValue, defaultEntry, handleChange],
  );

  // Handle table rows removing by index.
  const handleRemoveRow = (rowIndex) => {
    const newRows = composeRowsOnDeleteRow(rowIndex);
    handleChange(newRows);
  };

  // Handles a price-lot being picked on a row -- fills in that lot's own
  // price/discount (still editable after) alongside the lot id itself.
  const handleUpdateItemPriceLot = useCallback(
    (rowIndex, lot) => {
      const newRows = composeRowsOnEditPriceLot(rowIndex, {
        item_price_lot_id: lot.id,
        rate: lot.listPriceExclVat,
        discount: lot.discountPercent,
      });
      handleChange(newRows);
    },
    [composeRowsOnEditPriceLot, handleChange],
  );

  return (
    <DataTableEditable
      className={classNames(CLASSES.DATATABLE_EDITOR_ITEMS_ENTRIES)}
      columns={columns}
      data={localValue}
      sticky={true}
      progressBarLoading={isItemFetching}
      cellsLoading={isItemFetching}
      cellsLoadingCoords={cellsLoading}
      payload={{
        items,
        taxRates,
        errors: errors || [],
        updateData: handleUpdateData,
        removeRow: handleRemoveRow,
        autoFocus: ['item_id', 0],
        currencyCode,
        ...(enablePriceLots
          ? {
              updateItemPriceLot: handleUpdateItemPriceLot,
              warehouseId,
              excludeInvoiceId,
              includeZeroQty,
            }
          : {}),
      }}
    />
  );
}

ItemsEntriesTable.defaultProps = {
  defaultEntry: {
    index: 0,
    item_id: '',
    description: '',
    quantity: '',
    rate: '',
    discount: '',
    item_price_lot_id: '',
  },
  initialEntries: [],
  taxRates: [],
  items: [],
  linesNumber: 1,
  minLinesNumber: 1,
  maxLinesNumber: undefined,
  enableTaxRates: true,
};
