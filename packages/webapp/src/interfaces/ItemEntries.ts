export interface ItemEntry {
  index: number;
  item_id: number;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  tax_rate_id: number;
  tax_rate: number;
  tax_amount: number;
  // Astrans DMS price-lot picker (invoice lines only) -- see
  // docs/ops/PHASE1.md ("Lots / GRN").
  item_price_lot_id?: number | null;
}
