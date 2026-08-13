// @ts-nocheck
import { getUniversalSearchBind } from '@/containers/UniversalSearch/utils';
import { useResourceData } from '../GenericResource';

/**
 * Transformes the resource data to search entries based on
 * the given resource type.
 * @param {string} type
 * @param {any} resource
 * @returns
 */
function transfromResourceDataToSearch(resource) {
  // A bad/empty search response (or one still resolving) may not carry an
  // `items` array yet; without this guard, typing quickly re-renders with
  // `resource` undefined and crashes the whole SPA (blank screen).
  if (!resource || !Array.isArray(resource.items)) {
    return [];
  }
  const selectItem = getUniversalSearchBind(resource._type, 'itemSelect');

  return resource.items.map((item) => ({
    ...(selectItem ? selectItem(item) : {}),
    _type: resource._type,
  }));
}

/**
 *
 * @param {*} type
 * @param {*} searchKeyword
 * @returns
 */
export function useUniversalSearch(type, searchKeyword, props) {
  const { data, ...restProps } = useResourceData(
    type,
    {
      search_keyword: searchKeyword,
    },
    props,
  );
  const searchData = transfromResourceDataToSearch(data);

  return {
    data: searchData,
    ...restProps,
  };
}
