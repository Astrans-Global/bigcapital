export const CustomerRouteCityMeta = {
  defaultFilterField: 'name',
  defaultSort: {
    sortField: 'name',
    sortOrder: 'ASC',
  },
  importable: false,
  exportable: false,
  fields: {
    name: {
      name: 'customer_route_city.field.name',
      column: 'name',
      fieldType: 'text',
    },
    area_id: {
      name: 'customer_route_city.field.area_id',
      column: 'area_id',
      fieldType: 'number',
    },
    created_at: {
      name: 'customer_route_city.field.created_at',
      column: 'created_at',
      columnType: 'date',
    },
  },
  columns: {
    name: {
      name: 'customer_route_city.field.name',
      type: 'text',
    },
    areaId: {
      name: 'customer_route_city.field.area_id',
      type: 'number',
    },
    createdAt: {
      name: 'customer_route_city.field.created_at',
      type: 'text',
    },
  },
};
