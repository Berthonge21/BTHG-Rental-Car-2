import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AgencyQueryDto, CreateAgencyDto, UpdateAgencyDto, CarQueryDto } from '@bthgrentalcar/sdk';

export const agencyKeys = {
  all: ['agencies'] as const,
  lists: () => [...agencyKeys.all, 'list'] as const,
  list: (query?: AgencyQueryDto) => [...agencyKeys.lists(), query] as const,
  details: () => [...agencyKeys.all, 'detail'] as const,
  detail: (id: number) => [...agencyKeys.details(), id] as const,
  cars: (id: number, query?: CarQueryDto) => [...agencyKeys.detail(id), 'cars', query] as const,
  stats: (id: number) => [...agencyKeys.detail(id), 'stats'] as const,
};

export function useAgencies(query?: AgencyQueryDto) {
  return useQuery({
    queryKey: agencyKeys.list(query),
    queryFn: () => api.agencies.list(query),
  });
}

export function useAgency(id: number) {
  return useQuery({
    queryKey: agencyKeys.detail(id),
    queryFn: () => api.agencies.get(id),
    enabled: !!id,
  });
}

export function useAgencyCars(id: number, query?: CarQueryDto) {
  return useQuery({
    queryKey: agencyKeys.cars(id, query),
    queryFn: () => api.agencies.getCars(id, query),
    enabled: !!id,
  });
}

export function useAgencyStats(id: number) {
  return useQuery({
    queryKey: agencyKeys.stats(id),
    queryFn: () => api.agencies.getStats(id),
    enabled: !!id,
  });
}

export function useCreateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAgencyDto) => api.agencies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'agencies'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
    },
  });
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAgencyDto }) =>
      api.agencies.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agencyKeys.detail(id) });
    },
  });
}

export function useDeleteAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.agencies.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agencyKeys.lists() });
    },
  });
}
