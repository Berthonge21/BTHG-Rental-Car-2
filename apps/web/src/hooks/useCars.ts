import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CarQueryDto, CreateCarDto, UpdateCarDto } from '@bthgrentalcar/sdk';

export const carKeys = {
  all: ['cars'] as const,
  lists: () => [...carKeys.all, 'list'] as const,
  list: (query?: CarQueryDto) => [...carKeys.lists(), query] as const,
  details: () => [...carKeys.all, 'detail'] as const,
  detail: (id: number) => [...carKeys.details(), id] as const,
};

export function useCars(query?: CarQueryDto) {
  return useQuery({
    queryKey: carKeys.list(query),
    queryFn: () => api.cars.list(query),
  });
}

export function useCar(id: number) {
  return useQuery({
    queryKey: carKeys.detail(id),
    queryFn: () => api.cars.get(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes — show cached car data instantly
  });
}

export function useCarAvailability(id: number, startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...carKeys.detail(id), 'availability', startDate, endDate],
    queryFn: () => api.cars.checkAvailability(id, startDate, endDate),
    enabled: !!id && !!startDate && !!endDate,
  });
}

export function useCarAvailabilityCalendar(id: number, year: number, month?: number) {
  return useQuery({
    queryKey: [...carKeys.detail(id), 'calendar', year, month],
    queryFn: () => api.cars.getAvailabilityCalendar(id, year, month),
    enabled: !!id && !!year,
  });
}

export function useBlockDates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ carId, dates }: { carId: number; dates: string[] }) =>
      api.cars.blockDates(carId, dates),
    onSuccess: (_, { carId }) => {
      queryClient.invalidateQueries({ queryKey: carKeys.detail(carId) });
    },
  });
}

export function useUnblockDates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ carId, dates }: { carId: number; dates: string[] }) =>
      api.cars.unblockDates(carId, dates),
    onSuccess: (_, { carId }) => {
      queryClient.invalidateQueries({ queryKey: carKeys.detail(carId) });
    },
  });
}

export function useCreateCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCarDto) => api.cars.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'dashboard'] });
    },
  });
}

export function useUpdateCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCarDto }) =>
      api.cars.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: carKeys.lists() });
      queryClient.invalidateQueries({ queryKey: carKeys.detail(id) });
    },
  });
}

export function useDeleteCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.cars.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'dashboard'] });
    },
  });
}
