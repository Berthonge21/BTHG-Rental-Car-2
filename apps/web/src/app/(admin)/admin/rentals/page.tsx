'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  HStack,
  Badge,
  Text,
  VStack,
  IconButton,
  useToast,
  Avatar,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiEye, FiCheck, FiX, FiPlay } from 'react-icons/fi';
import { LoadingSpinner } from '@/components/ui';
import { useAdminRentals, useUpdateRentalStatus } from '@/hooks';
import type { RentalStatus } from '@bthgrentalcar/sdk';
import { format } from 'date-fns';

const statusColors: Record<RentalStatus, string> = {
  reserved: 'yellow',
  ongoing: 'blue',
  completed: 'green',
  cancelled: 'red',
};

const statusLabels: Record<RentalStatus, string> = {
  reserved: 'Scheduled',
  ongoing: 'Ongoing',
  completed: 'Finished',
  cancelled: 'Cancelled',
};

export default function AdminRentalsPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RentalStatus | ''>('');

  const cardBg = useColorModeValue('white', 'navy.700');
  const headerBg = useColorModeValue('gray.50', 'navy.600');
  const borderColor = useColorModeValue('gray.200', 'navy.600');
  const textMuted = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'navy.600');
  const selectBg = useColorModeValue('white', 'navy.700');

  const { data, isLoading } = useAdminRentals({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });
  const updateStatusMutation = useUpdateRentalStatus();

  const handleStatusUpdate = async (id: number, status: RentalStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
      toast({
        title: 'Status updated',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Failed to update status',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg" color="text.primary">Rentals</Heading>
        <Select
          placeholder="All Statuses"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as RentalStatus | ''); setPage(1); }}
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

      {/* Rentals Table */}
      <Box bg={cardBg} borderRadius="2xl" boxShadow="sm" overflow="hidden">
        <Box overflowX="auto">
          <Box as="table" w="100%" style={{ borderSpacing: '0', borderCollapse: 'separate' }}>
            <Box as="thead" bg={headerBg}>
              <Box as="tr">
                <Box
                  as="th"
                  textAlign="left"
                  p={4}
                  fontSize="sm"
                  color={textMuted}
                  fontWeight="600"
                  borderBottom="1px"
                  borderColor={borderColor}
                >
                  Renter name
                </Box>
                <Box
                  as="th"
                  textAlign="left"
                  p={4}
                  fontSize="sm"
                  color={textMuted}
                  fontWeight="600"
                  borderBottom="1px"
                  borderColor={borderColor}
                >
                  Email
                </Box>
                <Box
                  as="th"
                  textAlign="left"
                  p={4}
                  fontSize="sm"
                  color={textMuted}
                  fontWeight="600"
                  borderBottom="1px"
                  borderColor={borderColor}
                >
                  Phone number
                </Box>
                <Box
                  as="th"
                  textAlign="left"
                  p={4}
                  fontSize="sm"
                  color={textMuted}
                  fontWeight="600"
                  borderBottom="1px"
                  borderColor={borderColor}
                >
                  Pick-up date
                </Box>
                <Box
                  as="th"
                  textAlign="left"
                  p={4}
                  fontSize="sm"
                  color={textMuted}
                  fontWeight="600"
                  borderBottom="1px"
                  borderColor={borderColor}
                >
                  Return date
                </Box>
                <Box
                  as="th"
                  textAlign="left"
                  p={4}
                  fontSize="sm"
                  color={textMuted}
                  fontWeight="600"
                  borderBottom="1px"
                  borderColor={borderColor}
                >
                  Amount
                </Box>
                <Box
                  as="th"
                  textAlign="left"
                  p={4}
                  fontSize="sm"
                  color={textMuted}
                  fontWeight="600"
                  borderBottom="1px"
                  borderColor={borderColor}
                >
                  Status
                </Box>
                <Box
                  as="th"
                  textAlign="center"
                  p={4}
                  fontSize="sm"
                  color={textMuted}
                  fontWeight="600"
                  borderBottom="1px"
                  borderColor={borderColor}
                >
                  Actions
                </Box>
              </Box>
            </Box>
            <Box as="tbody">
              {data?.data?.map((rental) => (
                <Box
                  as="tr"
                  key={rental.id}
                  borderBottom="1px"
                  borderColor={borderColor}
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                  onClick={() => router.push(`/admin/rentals/${rental.id}`)}
                >
                  <Box as="td" p={4}>
                    <HStack spacing={3}>
                      <Avatar
                        size="sm"
                        name={`${rental.client?.firstname} ${rental.client?.name}`}
                        src={(rental.client as any)?.image}
                      />
                      <Text fontSize="sm" fontWeight="medium" color="text.primary">
                        {rental.client?.firstname} {rental.client?.name}
                      </Text>
                    </HStack>
                  </Box>
                  <Box as="td" p={4}>
                    <Text fontSize="sm" color="text.primary">
                      {rental.client?.email}
                    </Text>
                  </Box>
                  <Box as="td" p={4}>
                    <Text fontSize="sm" color="text.primary">
                      {(rental.client as any)?.telephone || 'N/A'}
                    </Text>
                  </Box>
                  <Box as="td" p={4}>
                    <Text fontSize="sm" color="text.primary">
                      {format(new Date(rental.startDate), 'MMMM dd, yyyy • hh:mm a')}
                    </Text>
                  </Box>
                  <Box as="td" p={4}>
                    <Text fontSize="sm" color="text.primary">
                      {format(new Date(rental.endDate), 'MMMM dd, yyyy • hh:mm a')}
                    </Text>
                  </Box>
                  <Box as="td" p={4}>
                    <Text fontSize="sm" fontWeight="medium" color="text.primary">
                      ${rental.total?.toFixed(2) || '0.00'}
                    </Text>
                  </Box>
                  <Box as="td" p={4}>
                    <Badge
                      colorScheme={statusColors[rental.status]}
                      textTransform="capitalize"
                      borderRadius="md"
                      px={3}
                      py={1}
                      fontSize="xs"
                      fontWeight="600"
                    >
                      {statusLabels[rental.status]}
                    </Badge>
                  </Box>
                  <Box as="td" p={4} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <HStack spacing={1} justify="center">
                      <IconButton
                        icon={<FiEye />}
                        aria-label="View Details"
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/rentals/${rental.id}`)}
                      />
                      {rental.status === 'reserved' && (
                        <>
                          <IconButton
                            icon={<FiPlay />}
                            aria-label="Start Rental"
                            variant="ghost"
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleStatusUpdate(rental.id, 'ongoing' as RentalStatus)}
                            isLoading={updateStatusMutation.isPending}
                          />
                          <IconButton
                            icon={<FiX />}
                            aria-label="Cancel Rental"
                            variant="ghost"
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleStatusUpdate(rental.id, 'cancelled' as RentalStatus)}
                            isLoading={updateStatusMutation.isPending}
                          />
                        </>
                      )}
                      {rental.status === 'ongoing' && (
                        <IconButton
                          icon={<FiCheck />}
                          aria-label="Complete Rental"
                          variant="ghost"
                          size="sm"
                          colorScheme="green"
                          onClick={() => handleStatusUpdate(rental.id, 'completed' as RentalStatus)}
                          isLoading={updateStatusMutation.isPending}
                        />
                      )}
                    </HStack>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Empty State */}
        {(!data?.data || data.data.length === 0) && (
          <Box py={12} textAlign="center">
            <Text color={textMuted}>No rentals found</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
