'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Badge, Box, Button, Center, Divider, Flex, HStack, Heading, Icon,
  Image, Spinner, Text, VStack, useColorModeValue, useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FiArrowLeft, FiCalendar, FiClock, FiX, FiCheckCircle } from 'react-icons/fi';
import { useRental, useCancelRental } from '@/hooks';
import { ConfirmDialog } from '@/components/ui';
import { format, parseISO } from 'date-fns';

const STATUS_COLOR: Record<string, string> = {
  reserved: 'yellow',
  ongoing: 'blue',
  completed: 'green',
  cancelled: 'red',
};

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const rentalId = Number(params.id);
  const { data: rental, isLoading } = useRental(rentalId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelMutation = useCancelRental();

  const cardBg = useColorModeValue('white', 'navy.700');
  const cardBorder = useColorModeValue('gray.100', 'navy.600');
  const textMuted = useColorModeValue('text.muted', 'gray.400');
  const rowBg = useColorModeValue('gray.50', 'navy.600');

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(rentalId);
      toast({ title: 'Rental cancelled successfully', status: 'success', duration: 3000 });
      router.push('/rentals');
    } catch (err) {
      toast({ title: 'Failed to cancel', description: err instanceof Error ? err.message : 'An error occurred', status: 'error', duration: 5000 });
    } finally {
      onClose();
    }
  };

  if (isLoading) return <Center h="60vh"><Spinner size="xl" color="brand.400" thickness="4px" /></Center>;
  if (!rental) return (
    <Center h="60vh">
      <VStack><Text>Rental not found</Text><Button onClick={() => router.back()}>Go Back</Button></VStack>
    </Center>
  );

  const days = Math.ceil(
    (new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <Flex justify="space-between" align="center" py={3} px={4} bg={rowBg} borderRadius="lg">
      <Text fontSize="sm" color={textMuted}>{label}</Text>
      <Text fontSize="sm" fontWeight="medium">{value}</Text>
    </Flex>
  );

  return (
    <Box maxW="700px">
      <Button variant="ghost" leftIcon={<FiArrowLeft />} mb={4} onClick={() => router.push('/rentals')}>
        My Rentals
      </Button>

      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Rental #{rental.id}</Heading>
        <Badge
          colorScheme={STATUS_COLOR[rental.status] ?? 'gray'}
          borderRadius="full"
          px={4}
          py={1}
          fontSize="sm"
          textTransform="capitalize"
        >
          {rental.status}
        </Badge>
      </Flex>

      {/* Car card */}
      <Box bg={cardBg} border="1px" borderColor={cardBorder} borderRadius="2xl" overflow="hidden" mb={4}>
        <Box h="200px" bg="navy.800">
          <Image
            src={rental.car?.image || 'https://via.placeholder.com/700x200?text=Car'}
            alt={`${rental.car?.brand} ${rental.car?.model}`}
            w="100%"
            h="100%"
            objectFit="cover"
          />
        </Box>
        <Box p={4}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontWeight="bold" fontSize="lg">{rental.car?.brand} {rental.car?.model}</Text>
              <Text color={textMuted} fontSize="sm">{rental.car?.year}</Text>
            </Box>
            <Box textAlign="right">
              <Text fontWeight="bold" color="accent.400" fontSize="xl">${rental.total?.toLocaleString()}</Text>
              <Text fontSize="xs" color={textMuted}>Total</Text>
            </Box>
          </Flex>
        </Box>
      </Box>

      {/* Details */}
      <Box bg={cardBg} border="1px" borderColor={cardBorder} borderRadius="2xl" p={5} mb={4}>
        <HStack mb={4} spacing={2}>
          <Icon as={FiCalendar} color="brand.400" />
          <Text fontWeight="semibold">Rental Details</Text>
        </HStack>
        <VStack spacing={2} align="stretch">
          <InfoRow label="Pick-up Date" value={format(parseISO(rental.startDate), 'MMMM d, yyyy')} />
          <InfoRow label="Return Date" value={format(parseISO(rental.endDate), 'MMMM d, yyyy')} />
          {rental.startTime && <InfoRow label="Pick-up Time" value={rental.startTime} />}
          {rental.endTime && <InfoRow label="Return Time" value={rental.endTime} />}
          <InfoRow label="Duration" value={`${days} day${days !== 1 ? 's' : ''}`} />
        </VStack>

        <Divider my={4} />

        <VStack spacing={2} align="stretch">
          <Flex justify="space-between" py={2}>
            <Text color={textMuted}>Rate × Days</Text>
            <Text fontWeight="medium">${days > 0 && rental.total ? (rental.total / days).toFixed(0) : rental.car?.price ?? '—'}/day × {days}</Text>
          </Flex>
          <Flex justify="space-between" py={2}>
            <Text fontWeight="bold" fontSize="lg">Total</Text>
            <Text fontWeight="bold" color="accent.400" fontSize="xl">${rental.total?.toLocaleString()}</Text>
          </Flex>
        </VStack>
      </Box>

      {/* Status timeline */}
      <Box bg={cardBg} border="1px" borderColor={cardBorder} borderRadius="2xl" p={5} mb={6}>
        <HStack mb={4} spacing={2}>
          <Icon as={FiClock} color="brand.400" />
          <Text fontWeight="semibold">Status</Text>
        </HStack>
        <HStack spacing={0} align="center">
          {['reserved', 'ongoing', 'completed'].map((s, i) => {
            const statuses = ['reserved', 'ongoing', 'completed', 'cancelled'];
            const currentIdx = statuses.indexOf(rental.status);
            const stepIdx = i;
            const isDone = rental.status === 'cancelled' ? false : currentIdx > stepIdx;
            const isActive = rental.status === s;
            return (
              <HStack key={s} spacing={0} flex={i < 2 ? 1 : 0} align="center">
                <VStack spacing={1}>
                  <Box
                    w={8}
                    h={8}
                    borderRadius="full"
                    bg={isActive ? 'brand.400' : isDone ? 'accent.400' : 'gray.200'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {(isDone || isActive) && <Icon as={FiCheckCircle} color="white" boxSize={4} />}
                  </Box>
                  <Text fontSize="2xs" color={isActive ? 'brand.400' : isDone ? 'accent.400' : textMuted} fontWeight={isActive ? 'bold' : 'normal'} textTransform="capitalize">
                    {s}
                  </Text>
                </VStack>
                {i < 2 && <Box flex={1} h="2px" bg={isDone ? 'accent.400' : 'gray.200'} mx={1} mb={4} />}
              </HStack>
            );
          })}
        </HStack>
      </Box>

      {/* Cancel button */}
      {rental.status === 'reserved' && (
        <Button
          colorScheme="red"
          variant="outline"
          leftIcon={<FiX />}
          onClick={onOpen}
          w="full"
        >
          Cancel Reservation
        </Button>
      )}

      <ConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleCancel}
        title="Cancel Reservation"
        message="Are you sure you want to cancel this reservation? This action cannot be undone."
        confirmText="Yes, Cancel"
        isLoading={cancelMutation.isPending}
        colorScheme="red"
      />
    </Box>
  );
}
