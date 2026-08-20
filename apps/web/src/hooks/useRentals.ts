import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RentalQueryDto, CreateRentalDto, UpdateRentalDto } from '@bthgrentalcar/sdk';

export const rentalKeys = {
  all: ['rentals'] as const,
  lists: () => [...rentalKeys.all, 'list'] as const,
  list: (query?: RentalQueryDto) => [...rentalKeys.lists(), query] as const,
  details: () => [...rentalKeys.all, 'detail'] as const,
  detail: (id: number) => [...rentalKeys.details(), id] as const,
};

export function useRentals(query?: RentalQueryDto) {
  return useQuery({
    queryKey: rentalKeys.list(query),
    queryFn: () => api.rentals.list(query),
  });
}

export function useRental(id: number) {
  return useQuery({
    queryKey: rentalKeys.detail(id),
    queryFn: () => api.rentals.get(id),
    enabled: !!id,
  });
}

export function useCreateRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRentalDto) => api.rentals.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
    },
  });
}

export function useUpdateRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRentalDto }) =>
      api.rentals.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(id) });
    },
  });
}

export function useCancelRental() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.rentals.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.lists() });
    },
  });
}
