import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AgencyQueryDto,
  RentalQueryDto,
  AdminUserQueryDto,
  CreateAdminUserDto,
  AssignAgencyDto,
  Status,
} from '@bthgrentalcar/sdk';

export const superAdminKeys = {
  dashboard: ['super-admin', 'dashboard'] as const,
  agencies: (query?: AgencyQueryDto) => ['super-admin', 'agencies', query] as const,
  rentals: (query?: RentalQueryDto) => ['super-admin', 'rentals', query] as const,
  users: (query?: AdminUserQueryDto) => ['super-admin', 'users', query] as const,
};

export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: superAdminKeys.dashboard,
    queryFn: () => api.superAdmin.getDashboard(),
  });
}

export function useSuperAdminAgencies(query?: AgencyQueryDto) {
  return useQuery({
    queryKey: superAdminKeys.agencies(query),
    queryFn: () => api.superAdmin.getAgencies(query),
  });
}

export function useSuperAdminRentals(query?: RentalQueryDto) {
  return useQuery({
    queryKey: superAdminKeys.rentals(query),
    queryFn: () => api.superAdmin.getRentals(query),
  });
}

export function useSuperAdminUsers(query?: AdminUserQueryDto) {
  return useQuery({
    queryKey: superAdminKeys.users(query),
    queryFn: () => api.superAdmin.getUsers(query),
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdminUserDto) => api.superAdmin.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.dashboard });
    },
  });
}

export function useAssignAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, agencyId }: { userId: number; agencyId: number }) =>
      api.superAdmin.assignAgency(userId, { agencyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: Status }) =>
      api.superAdmin.updateUserStatus(userId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: superAdminKeys.dashboard });
    },
  });
}
