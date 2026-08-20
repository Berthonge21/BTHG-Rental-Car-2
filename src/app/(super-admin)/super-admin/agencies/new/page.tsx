'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Button,
  HStack,
  SimpleGrid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateAgency, useSuperAdminUsers } from '@/hooks';
import { ProgressButton } from '@/components/ui/ProgressButton';
import { Status } from '@bthgrentalcar/sdk';

const agencySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  telephone: z.string().min(8, 'Phone must be at least 8 characters'),
  responsibleId: z.number().min(1, 'Please select an admin'),
  status: z.enum(['activate', 'deactivate']),
});

type AgencyFormData = z.infer<typeof agencySchema>;

export default function NewAgencyPage() {
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  const createMutation = useCreateAgency();
  const { data: usersData } = useSuperAdminUsers({ limit: 100 });

  // Filter admins without agency
  const availableAdmins = usersData?.data?.filter(
    (user) => user.role === 'admin' && !user.agency
  ) || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgencyFormData>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      status: 'activate',
    },
  });

  const onSubmit = async (data: AgencyFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        status: data.status as Status,
      });
      toast({
        title: 'Agency created',
        description: 'The agency has been created successfully',
        status: 'success',
        duration: 3000,
      });
      router.push('/super-admin/agencies');
    } catch (error) {
      toast({
        title: 'Failed to create agency',
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
        <Heading size="lg">Create New Agency</Heading>
      </HStack>

      <Box bg={cardBg} p={6} borderRadius="xl" boxShadow="sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Agency Name</FormLabel>
              <Input {...register('name')} placeholder="Enter agency name" />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input {...register('email')} type="email" placeholder="agency@example.com" />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.telephone}>
              <FormLabel>Phone Number</FormLabel>
              <Input {...register('telephone')} placeholder="+1234567890" />
              <FormErrorMessage>{errors.telephone?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.responsibleId}>
              <FormLabel>Assign Admin</FormLabel>
              <Select {...register('responsibleId', { valueAsNumber: true })} placeholder="Select an admin">
                {availableAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.firstname} {admin.name} ({admin.email})
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.responsibleId?.message}</FormErrorMessage>
              {availableAdmins.length === 0 && (
                <Box fontSize="sm" color="orange.500" mt={1}>No unassigned admins available.</Box>
              )}
            </FormControl>
            <FormControl isInvalid={!!errors.address} gridColumn={{ md: 'span 2' }}>
              <FormLabel>Address</FormLabel>
              <Input {...register('address')} placeholder="Enter full address" />
              <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.status} gridColumn={{ md: 'span 2' }}>
              <FormLabel>Status</FormLabel>
              <Select {...register('status')}>
                <option value="activate">Active</option>
                <option value="deactivate">Inactive</option>
              </Select>
              <FormErrorMessage>{errors.status?.message}</FormErrorMessage>
            </FormControl>
          </SimpleGrid>
          <HStack justify="flex-end" pt={4}>
            <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <ProgressButton type="submit" colorScheme="brand" isLoading={createMutation.isPending}>Create Agency</ProgressButton>
          </HStack>
        </form>
      </Box>
    </Box>
  );
}
