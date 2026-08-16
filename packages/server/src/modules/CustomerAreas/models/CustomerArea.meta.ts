export const CustomerAreaMeta = {
  defaultFilterField: 'name',
  defaultSort: {
    sortField: 'name',
    sortOrder: 'ASC',
  },
  importable: false,
  exportable: false,
  fields: {
    name: {
      name: 'customer_area.field.name',
      column: 'name',
      fieldType: 'text',
    },
    invoice_number_code: {
      name: 'customer_area.field.invoice_number_code',
      column: 'invoice_number_code',
      fieldType: 'text',
    },
    created_at: {
      name: 'customer_area.field.created_at',
      column: 'created_at',
      columnType: 'date',
    },
  },
  columns: {
    name: {
      name: 'customer_area.field.name',
      type: 'text',
    },
    invoiceNumberCode: {
      name: 'customer_area.field.invoice_number_code',
      type: 'text',
    },
    nextInvoiceNumber: {
      name: 'customer_area.field.next_invoice_number',
      type: 'number',
    },
    createdAt: {
      name: 'customer_area.field.created_at',
      type: 'text',
    },
  },
};
