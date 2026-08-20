'use client';

import { useState } from 'react';
import {
  Box,
  Heading,
  HStack,
  Badge,
  Text,
  VStack,
  Avatar,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';
import { DataTable, type Column } from '@/components/ui';
import { useSuperAdminRentals } from '@/hooks';
import type { Rental, RentalStatus } from '@bthgrentalcar/sdk';
import { format } from 'date-fns';

const statusColors: Record<RentalStatus, string> = {
  reserved: 'yellow',
  ongoing: 'blue',
  completed: 'green',
  cancelled: 'red',
};

export default function SuperAdminRentalsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RentalStatus | ''>('');

  const { data, isLoading } = useSuperAdminRentals({
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  const cardBg = useColorModeValue('white', 'navy.700');
  const cardBorder = useColorModeValue('gray.100', 'navy.600');
  const textMuted = useColorModeValue('text.muted', 'gray.400');
  const selectBg = useColorModeValue('white', 'navy.700');

  const columns: Column<Rental>[] = [
    {
      header: 'Client',
      accessor: (row) => (
        <HStack spacing={3}>
          <Avatar size="sm" name={`${row.client?.firstname} ${row.client?.name}`} src={(row.client as any)?.image} bg="brand.400" color="white" />
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium" color="text.primary">
              {row.client?.firstname} {row.client?.name}
            </Text>
            <Text fontSize="sm" color={textMuted}>
              {row.client?.email}
            </Text>
          </VStack>
        </HStack>
      ),
    },
    {
      header: 'Car',
      accessor: (row) => (
        <VStack align="start" spacing={0}>
          <Text fontWeight="medium" color="text.primary">
            {row.car?.brand} {row.car?.model}
          </Text>
          <Text fontSize="sm" color={textMuted}>
            {row.car?.year}
          </Text>
        </VStack>
      ),
    },
    {
      header: 'Period',
      accessor: (row) => (
        <VStack align="start" spacing={0}>
          <Text fontSize="sm" color="text.primary">
            {format(new Date(row.startDate), 'MMM d, yyyy')}
          </Text>
          <Text fontSize="sm" color={textMuted}>
            to {format(new Date(row.endDate), 'MMM d, yyyy')}
          </Text>
        </VStack>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge colorScheme={statusColors[row.status]} textTransform="capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Total',
      accessor: (row) => (
        <Text fontWeight="semibold" color="text.primary">${row.total.toFixed(2)}</Text>
      ),
    },
  ];

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg" color="text.primary">All Rentals</Heading>
        <Select
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RentalStatus | '')}
          maxW="200px"
          bg={cardBg}
          borderRadius="lg"
          sx={{ option: { bg: selectBg } }}
        >
          <option value="reserved">Reserved</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </HStack>

      <Box
        bg={cardBg}
        borderRadius="2xl"
        border="1px"
        borderColor={cardBorder}
        boxShadow="sm"
        overflow="hidden"
        p={5}
      >
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          page={page}
          totalPages={data?.meta.totalPages || 1}
          onPageChange={setPage}
          keyExtractor={(row) => row.id}
          emptyMessage="No rentals found"
        />
      </Box>
    </Box>
  );
}
