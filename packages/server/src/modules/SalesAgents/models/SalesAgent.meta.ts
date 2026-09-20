export const SalesAgentMeta = {
  defaultFilterField: 'name',
  defaultSort: {
    sortField: 'name',
    sortOrder: 'ASC',
  },
  importable: false,
  exportable: false,
  fields: {
    name: {
      name: 'sales_agent.field.name',
      column: 'name',
      fieldType: 'text',
    },
    active: {
      name: 'sales_agent.field.active',
      column: 'active',
      fieldType: 'boolean',
    },
    created_at: {
      name: 'sales_agent.field.created_at',
      column: 'created_at',
      columnType: 'date',
    },
  },
  columns: {
    name: {
      name: 'sales_agent.field.name',
      type: 'text',
    },
    active: {
      name: 'sales_agent.field.active',
      type: 'boolean',
    },
    createdAt: {
      name: 'sales_agent.field.created_at',
      type: 'text',
    },
  },
};
