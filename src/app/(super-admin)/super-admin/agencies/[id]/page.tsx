'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Box,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  SimpleGrid,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  useToast,
  useColorModeValue,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
} from '@chakra-ui/react';
import { FiArrowLeft, FiEdit2, FiSave, FiX, FiTruck, FiUsers, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoadingSpinner, StatCard, DataTable, type Column } from '@/components/ui';
import { useAgency, useAgencyStats, useAgencyCars, useUpdateAgency, useSuperAdminUsers } from '@/hooks';
import { ProgressButton } from '@/components/ui/ProgressButton';
import { Status } from '@bthgrentalcar/sdk';
import type { Car, AdminUser, UserRole } from '@bthgrentalcar/sdk';

const agencySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  telephone: z.string().min(8, 'Phone must be at least 8 characters'),
  status: z.enum(['activate', 'deactivate']),
});

type AgencyFormData = z.infer<typeof agencySchema>;

const statusColors: Record<Status, string> = {
  activate: 'green',
  deactivate: 'red',
};

const roleColors: Record<UserRole, string> = {
  admin: 'blue',
  superAdmin: 'purple',
};

export default function AgencyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const agencyId = Number(params.id);

  const [isEditing, setIsEditing] = useState(false);

  const { data: agency, isLoading: agencyLoading } = useAgency(agencyId);
  const { data: stats, isLoading: statsLoading } = useAgencyStats(agencyId);
  const { data: carsData, isLoading: carsLoading } = useAgencyCars(agencyId, { limit: 5 });
  const { data: usersData } = useSuperAdminUsers({ limit: 100 });
  const updateMutation = useUpdateAgency();

  const cardBg = useColorModeValue('white', 'gray.800');

  // Filter admins assigned to this agency
  const agencyAdmins = usersData?.data?.filter(
    (user) => user.agencyId === agencyId
  ) || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AgencyFormData>({
    resolver: zodResolver(agencySchema),
    values: agency ? {
      name: agency.name,
      email: agency.email,
      address: agency.address,
      telephone: agency.telephone,
      status: agency.status,
    } : undefined,
  });

  const onSubmit = async (data: AgencyFormData) => {
    try {
      await updateMutation.mutateAsync({
        id: agencyId,
        data: {
          ...data,
          status: data.status as Status,
        },
      });
      toast({
        title: 'Agency updated',
        status: 'success',
        duration: 3000,
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Failed to update agency',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const carColumns: Column<Car>[] = [
    {
      header: 'Car',
      accessor: (row) => (
        <HStack spacing={3}>
          {row.image && (
            <Box w={12} h={8} borderRadius="md" overflow="hidden" position="relative">
              <Image src={row.image} alt={row.model} fill style={{ objectFit: 'cover' }} unoptimized />
            </Box>
          )}
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium">{row.brand} {row.model}</Text>
            <Text fontSize="sm" color="gray.500">{row.year}</Text>
          </VStack>
        </HStack>
      ),
    },
    {
      header: 'Price/Day',
      accessor: (row) => <Text>${row.price}</Text>,
    },
    {
      header: 'Registration',
      accessor: (row) => <Text fontSize="sm">{row.registration}</Text>,
    },
  ];

  const adminColumns: Column<AdminUser>[] = [
    {
      header: 'Admin',
      accessor: (row) => (
        <HStack spacing={3}>
          <Avatar size="sm" name={`${row.firstname} ${row.name}`} src={row.image} bg="brand.400" />
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium">{row.firstname} {row.name}</Text>
            <Text fontSize="sm" color="gray.500">{row.email}</Text>
          </VStack>
        </HStack>
      ),
    },
    {
      header: 'Role',
      accessor: (row) => (
        <Badge colorScheme={roleColors[row.role]} textTransform="capitalize">
          {row.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
        </Badge>
      ),
    },
  ];

  if (agencyLoading) {
    return <LoadingSpinner text="Loading agency..." />;
  }

  if (!agency) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Agency not found</Text>
        <Button mt={4} onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <HStack>
          <Button
            variant="ghost"
            leftIcon={<FiArrowLeft />}
            onClick={() => router.push('/super-admin/agencies')}
          >
            Back
          </Button>
          <Heading size="lg">{agency.name}</Heading>
          <Badge colorScheme={statusColors[agency.status]} textTransform="capitalize" ml={2}>
            {agency.status}
          </Badge>
        </HStack>
        {!isEditing ? (
          <Button leftIcon={<FiEdit2 />} colorScheme="brand" onClick={() => setIsEditing(true)}>
            Edit Agency
          </Button>
        ) : (
          <HStack>
            <Button leftIcon={<FiX />} variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <ProgressButton
              leftIcon={<FiSave />}
              colorScheme="brand"
              onClick={handleSubmit(onSubmit)}
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </ProgressButton>
          </HStack>
        )}
      </HStack>

      {/* Stats */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        <StatCard
          label="Total Cars"
          value={stats?.totalCars || 0}
          icon={FiTruck}
          iconBg="blue.500"
        />
        <StatCard
          label="Total Admins"
          value={agencyAdmins.length}
          icon={FiUsers}
          iconBg="purple.500"
        />
        <StatCard
          label="Active Rentals"
          value={stats?.activeRentals || 0}
          icon={FiCalendar}
          iconBg="accent.400"
        />
        <StatCard
          label="Total Revenue"
          value={`$${stats?.totalRevenue?.toFixed(2) || '0.00'}`}
          icon={FiDollarSign}
          iconBg="brand.400"
        />
      </SimpleGrid>

      <Tabs colorScheme="brand">
        <TabList>
          <Tab>Details</Tab>
          <Tab>Cars ({carsData?.data?.length || 0})</Tab>
          <Tab>Admins ({agencyAdmins.length})</Tab>
        </TabList>

        <TabPanels>
          {/* Details Tab */}
          <TabPanel px={0}>
            <Box bg={cardBg} p={6} borderRadius="xl" boxShadow="sm">
              {isEditing ? (
                <form>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl isInvalid={!!errors.name}>
                      <FormLabel>Agency Name</FormLabel>
                      <Input {...register('name')} />
                      <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.email}>
                      <FormLabel>Email</FormLabel>
                      <Input {...register('email')} type="email" />
                      <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.telephone}>
                      <FormLabel>Phone</FormLabel>
                      <Input {...register('telephone')} />
                      <FormErrorMessage>{errors.telephone?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.status}>
                      <FormLabel>Status</FormLabel>
                      <Select {...register('status')}>
                        <option value="activate">Active</option>
                        <option value="deactivate">Inactive</option>
                      </Select>
                      <FormErrorMessage>{errors.status?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.address} gridColumn={{ md: 'span 2' }}>
                      <FormLabel>Address</FormLabel>
                      <Input {...register('address')} />
                      <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>
                </form>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Agency Name</Text>
                    <Text fontWeight="medium">{agency.name}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Email</Text>
                    <Text fontWeight="medium">{agency.email}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Phone</Text>
                    <Text fontWeight="medium">{agency.telephone}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Status</Text>
                    <Badge colorScheme={statusColors[agency.status]} textTransform="capitalize">
                      {agency.status}
                    </Badge>
                  </Box>
                  <Box gridColumn={{ md: 'span 2' }}>
                    <Text color="gray.500" fontSize="sm">Address</Text>
                    <Text fontWeight="medium">{agency.address}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500" fontSize="sm">Created</Text>
                    <Text fontWeight="medium">
                      {new Date(agency.createdAt).toLocaleDateString()}
                    </Text>
                  </Box>
                </SimpleGrid>
              )}
            </Box>
          </TabPanel>

          {/* Cars Tab */}
          <TabPanel px={0}>
            <DataTable
              columns={carColumns}
              data={carsData?.data || []}
              isLoading={carsLoading}
              keyExtractor={(row) => row.id}
              emptyMessage="No cars found for this agency"
            />
          </TabPanel>

          {/* Admins Tab */}
          <TabPanel px={0}>
            <DataTable
              columns={adminColumns}
              data={agencyAdmins}
              isLoading={false}
              keyExtractor={(row) => row.id}
              emptyMessage="No admins assigned to this agency"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
