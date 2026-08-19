import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useApiRequest from '../../useRequest';
import { downloadFile } from '../../useDownloadFile';
import { quotationsKeys } from './query-keys';

export function useQuotations(query?: Record<string, unknown>) {
  const apiRequest = useApiRequest();
  return useQuery({
    queryKey: quotationsKeys.list(query),
    queryFn: () =>
      apiRequest.get('sale-quotations', { params: query }).then((res) => res.data),
  });
}

export function useQuotation(quotationId?: number) {
  const apiRequest = useApiRequest();
  return useQuery({
    queryKey: quotationsKeys.detail(quotationId),
    queryFn: () =>
      apiRequest.get(`sale-quotations/${quotationId}`).then((res) => res.data),
    enabled: Boolean(quotationId),
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();
  return useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      apiRequest.post('sale-quotations', values).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationsKeys.all() });
    },
  });
}

export function useEditQuotation() {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();
  return useMutation({
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      apiRequest.put(`sale-quotations/${id}`, values).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationsKeys.all() });
    },
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();
  return useMutation({
    mutationFn: (id: number) => apiRequest.delete(`sale-quotations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationsKeys.all() });
    },
  });
}

export function useDownloadStatutoryQuotation() {
  const apiRequest = useApiRequest();

  return useMutation({
    mutationFn: ({
      quotationId,
      fileKind,
      quotationNo,
    }: {
      quotationId: number;
      fileKind: 'xlsx' | 'pdf';
      quotationNo: string;
    }) => {
      const accept =
        fileKind === 'pdf' ? 'application/pdf' : 'application/xlsx';
      const extension = fileKind === 'pdf' ? 'pdf' : 'xlsx';

      return apiRequest
        .get(`sale-quotations/${quotationId}/statutory-invoice`, {
          responseType: 'blob',
          headers: { accept },
        })
        .then((res) => {
          downloadFile(
            res.data,
            `${quotationNo}_QUOTATION.${extension}`,
            fileKind === 'pdf'
              ? 'application/pdf'
              : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          );
          return res;
        });
    },
  });
}
