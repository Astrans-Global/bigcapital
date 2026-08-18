/**
 * Blueprint Select/MultiSelect crash if `items` is undefined
 * (`items.find` / `items.filter`). Report "Customize Report" drawers
 * often pass a list that is still loading or nested under a different
 * response key (`items` / `customers` / `data`). Always return an array.
 */
export function asSelectItems<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of [
      'items',
      'customers',
      'vendors',
      'accounts',
      'warehouses',
      'branches',
      'data',
    ]) {
      if (Array.isArray(obj[key])) {
        return obj[key] as T[];
      }
    }
  }
  return [];
}
