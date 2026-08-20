'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import {
  Box, Badge, Button, Center, Flex, Heading, HStack, Icon, Image, Spinner,
  Tab, TabList, TabPanel, TabPanels, Tabs, Text, VStack,
  useColorModeValue, useDisclosure, useToast,
} from '@chakra-ui/react';
import { FiCalendar, FiArrowRight, FiSearch, FiX } from 'react-icons/fi';
import { useRentals, useCancelRental } from '@/hooks';
import { ConfirmDialog } from '@/components/ui';
import { RentalStatus } from '@bthgrentalcar/sdk';
import { format, parseISO } from 'date-fns';
import type { Rental } from '@bthgrentalcar/sdk';

const STATUS_COLOR: Record<string, string> = {
  reserved: 'yellow',
  ongoing: 'blue',
  completed: 'green',
  cancelled: 'red',
};

function RentalCard({ rental, onCancel }: { rental: Rental; onCancel?: (id: number) => void }) {
  const cardBg = useColorModeValue('white', 'navy.700');
  const cardBorder = useColorModeValue('gray.100', 'navy.600');
  const textMuted = useColorModeValue('text.muted', 'gray.400');
  const imageBg = useColorModeValue('gray.100', 'navy.800');

  const days = Math.ceil(
    (new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Box bg={cardBg} border="1px" borderColor={cardBorder} borderRadius="2xl" overflow="hidden" transition="all 0.2s" _hover={{ boxShadow: 'md' }}>
      <Flex>
        {/* Car image */}
        <Box w={{ base: '100px', md: '160px' }} flexShrink={0} bg={imageBg}>
          <Image
            src={rental.car?.image || 'https://via.placeholder.com/160x120?text=Car'}
            alt={`${rental.car?.brand} ${rental.car?.model}`}
            w="100%"
            h="100%"
            objectFit="cover"
            minH="120px"
          />
        </Box>

        {/* Info */}
        <Box p={4} flex="1" minW={0}>
          <Flex justify="space-between" align="flex-start" mb={2}>
            <Box>
              <Text fontWeight="bold" fontSize="md">{rental.car?.brand} {rental.car?.model}</Text>
              <Text fontSize="sm" color={textMuted}>{rental.car?.year}</Text>
            </Box>
            <Badge colorScheme={STATUS_COLOR[rental.status] ?? 'gray'} borderRadius="full" px={3} py={1} textTransform="capitalize">
              {rental.status}
            </Badge>
          </Flex>

          <HStack spacing={4} mb={3} flexWrap="wrap">
            <HStack spacing={1}>
              <Icon as={FiCalendar} boxSize={3} color={textMuted} />
              <Text fontSize="sm" color={textMuted}>
                {format(parseISO(rental.startDate), 'MMM d')} → {format(parseISO(rental.endDate), 'MMM d, yyyy')}
              </Text>
            </HStack>
            <Text fontSize="sm" color={textMuted}>{days} day{days !== 1 ? 's' : ''}</Text>
          </HStack>

          <Flex justify="space-between" align="center">
            <Text fontWeight="bold" color="accent.400" fontSize="lg">${rental.total?.toLocaleString()}</Text>
            <HStack spacing={2}>
              {rental.status === 'reserved' && onCancel && (
                <Button
                  size="xs"
                  colorScheme="red"
                  variant="outline"
                  leftIcon={<FiX />}
                  onClick={() => onCancel(rental.id)}
                >
                  Cancel
                </Button>
              )}
              <Button
                as={NextLink}
                href={`/rentals/${rental.id}`}
                size="xs"
                variant="outline"
                colorScheme="brand"
                rightIcon={<FiArrowRight />}
              >
                Details
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}

export default function RentalsPage() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [cancelId, setCancelId] = useState<number | null>(null);
  const cancelMutation = useCancelRental();

  const { data: activeData, isLoading: activeLoading } = useRentals({ status: RentalStatus.RESERVED });
  const { data: ongoingData } = useRentals({ status: RentalStatus.ONGOING });
  const { data: historyData, isLoading: historyLoading } = useRentals({ status: RentalStatus.COMPLETED });

  const textMuted = useColorModeValue('text.muted', 'gray.400');

  const activeRentals = [...(activeData?.data ?? []), ...(ongoingData?.data ?? [])];
  const historyRentals = historyData?.data ?? [];

  const handleCancelRequest = (id: number) => {
    setCancelId(id);
    onOpen();
  };

  const handleConfirmCancel = async () => {
    if (!cancelId) return;
    try {
      await cancelMutation.mutateAsync(cancelId);
      toast({ title: 'Rental cancelled', status: 'success', duration: 3000 });
    } catch (err) {
      toast({ title: 'Failed to cancel', description: err instanceof Error ? err.message : 'An error occurred', status: 'error', duration: 5000 });
    } finally {
      onClose();
      setCancelId(null);
    }
  };

  return (
    <Box>
      <VStack align="start" spacing={1} mb={6}>
        <HStack>
          <Icon as={FiCalendar} color="brand.400" boxSize={6} />
          <Heading size="lg">My Rentals</Heading>
        </HStack>
        <Text color={textMuted} fontSize="sm">Track and manage your car reservations</Text>
      </VStack>

      <Tabs colorScheme="brand" variant="soft-rounded">
        <TabList mb={6}>
          <Tab>Active ({activeRentals.length})</Tab>
          <Tab>History ({historyRentals.length})</Tab>
        </TabList>

        <TabPanels>
          {/* Active */}
          <TabPanel px={0}>
            {activeLoading ? (
              <Center py={10}><Spinner size="lg" color="brand.400" /></Center>
            ) : activeRentals.length === 0 ? (
              <Center py={20}>
                <VStack spacing={4}>
                  <Icon as={FiSearch} boxSize={10} color={textMuted} />
                  <Text color={textMuted}>No active rentals</Text>
                  <Button as={NextLink} href="/cars" colorScheme="brand" borderRadius="full">Browse Cars</Button>
                </VStack>
              </Center>
            ) : (
              <VStack spacing={4} align="stretch">
                {activeRentals.map(r => (
                  <RentalCard key={r.id} rental={r} onCancel={handleCancelRequest} />
                ))}
              </VStack>
            )}
          </TabPanel>

          {/* History */}
          <TabPanel px={0}>
            {historyLoading ? (
              <Center py={10}><Spinner size="lg" color="brand.400" /></Center>
            ) : historyRentals.length === 0 ? (
              <Center py={20}>
                <VStack spacing={3}>
                  <Icon as={FiCalendar} boxSize={10} color={textMuted} />
                  <Text color={textMuted}>No past rentals</Text>
                </VStack>
              </Center>
            ) : (
              <VStack spacing={4} align="stretch">
                {historyRentals.map(r => <RentalCard key={r.id} rental={r} />)}
              </VStack>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleConfirmCancel}
        title="Cancel Rental"
        message="Are you sure you want to cancel this reservation? This action cannot be undone."
        confirmText="Cancel Booking"
        isLoading={cancelMutation.isPending}
        colorScheme="red"
      />
    </Box>
  );
}
