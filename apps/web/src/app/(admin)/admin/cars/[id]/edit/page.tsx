'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Heading,
  Button,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import { CarForm } from '@/components/forms/CarForm';
import { useCar, useUpdateCar } from '@/hooks';
import { LoadingSpinner } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';

export default function EditCarPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const carId = Number(params.id);
  const { user } = useAuthStore();

  // Prefetch destination route for instant navigation after save
  useEffect(() => {
    router.prefetch('/admin/cars');
  }, [router]);

  const { data: car, isLoading } = useCar(carId);
  const updateMutation = useUpdateCar();

  const isSuperAdmin = user?.role === 'superAdmin';

  const handleSubmit = async (data: any) => {
    try {
      // Remove agencyId from update data - agency can't be changed
      const { agencyId, ...updateData } = data;
      await updateMutation.mutateAsync({
        id: carId,
        data: updateData,
      });
      toast({
        title: 'Car updated',
        description: 'The car has been updated successfully',
        status: 'success',
        duration: 3000,
      });
      router.push('/admin/cars');
    } catch (error) {
      toast({
        title: 'Failed to update car',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading car details..." />;
  }

  if (!car) {
    return (
      <Box textAlign="center" py={10}>
        Car not found
      </Box>
    );
  }

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
        <Heading size="lg">
          Edit {car.brand} {car.model}
        </Heading>
      </HStack>

      <CarForm
        initialData={car}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
        submitLabel="Update Car"
        isSuperAdmin={isSuperAdmin}
      />
    </Box>
  );
}
