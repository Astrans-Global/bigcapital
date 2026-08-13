export const ItemSubcategoryMeta = {
  defaultFilterField: 'name',
  defaultSort: {
    sortField: 'name',
    sortOrder: 'DESC',
  },
  importable: false,
  exportable: false,
  fields: {
    name: {
      name: 'item_subcategory.field.name',
      column: 'name',
      fieldType: 'text',
    },
    description: {
      name: 'item_subcategory.field.description',
      column: 'description',
      fieldType: 'text',
    },
    category_id: {
      name: 'item_subcategory.field.category_id',
      column: 'category_id',
      fieldType: 'number',
    },
    created_at: {
      name: 'item_subcategory.field.created_at',
      column: 'created_at',
      columnType: 'date',
    },
  },
  columns: {
    name: {
      name: 'item_subcategory.field.name',
      type: 'text',
    },
    description: {
      name: 'item_subcategory.field.description',
      type: 'text',
    },
    categoryId: {
      name: 'item_subcategory.field.category_id',
      type: 'number',
    },
    createdAt: {
      name: 'item_subcategory.field.created_at',
      type: 'text',
    },
  },
};
