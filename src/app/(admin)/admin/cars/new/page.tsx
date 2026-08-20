'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Button,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import { CarForm } from '@/components/forms/CarForm';
import { useCreateCar, useSuperAdminAgencies } from '@/hooks';
import { useAuthStore } from '@/stores/auth.store';

export default function NewCarPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuthStore();
  const createMutation = useCreateCar();

  // Prefetch destination route for instant navigation after save
  useEffect(() => {
    router.prefetch('/admin/cars');
  }, [router]);

  const isSuperAdmin = user?.role === 'superAdmin';

  // Fetch agencies only for super admin
  const { data: agenciesData, isLoading: agenciesLoading } = useSuperAdminAgencies(
    isSuperAdmin ? { limit: 100 } : undefined
  );

  const handleSubmit = async (data: any) => {
    // For regular admins, use their agency
    // For super admins, use the selected agency from form
    let agencyId = data.agencyId;

    if (!isSuperAdmin) {
      if (!user?.agency?.id) {
        toast({
          title: 'Error',
          description: 'No agency assigned to your account',
          status: 'error',
          duration: 5000,
        });
        return;
      }
      agencyId = user.agency.id;
    }

    if (!agencyId) {
      toast({
        title: 'Error',
        description: 'Please select an agency',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...data,
        agencyId,
      });
      toast({
        title: 'Car created',
        description: 'The car has been added successfully',
        status: 'success',
        duration: 3000,
      });
      router.push('/admin/cars');
    } catch (error) {
      toast({
        title: 'Failed to create car',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Box>
      <HStack mb={6}>
        <Button
          variant="ghost"
          leftIcon={<FiArrowLeft />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Heading size="lg">Add New Car</Heading>
      </HStack>

      <CarForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        submitLabel="Create Car"
        isSuperAdmin={isSuperAdmin}
        agencies={agenciesData?.data || []}
        agenciesLoading={agenciesLoading}
      />
    </Box>
  );
}
