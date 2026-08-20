'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  SimpleGrid,
  Image,
  Divider,
  Flex,
  Icon,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiPlay,
  FiCheck,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiTruck,
} from 'react-icons/fi';
import { LoadingSpinner, useMinLoading, ProgressButton } from '@/components/ui';
import { useAdminRental, useUpdateRentalStatus } from '@/hooks';
import type { RentalStatus } from '@bthgrentalcar/sdk';
import { format, differenceInDays } from 'date-fns';

// --- Status configuration ---

interface StatusConfig {
  color: string;
  bg: string;
  borderColor: string;
  label: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  reserved: {
    color: 'orange.700',
    bg: 'orange.50',
    borderColor: 'orange.200',
    label: 'Reserved',
  },
  ongoing: {
    color: 'blue.700',
    bg: 'blue.50',
    borderColor: 'blue.200',
    label: 'Ongoing',
  },
  completed: {
    color: 'green.700',
    bg: 'green.50',
    borderColor: 'green.200',
    label: 'Completed',
  },
  cancelled: {
    color: 'red.700',
    bg: 'red.50',
    borderColor: 'red.200',
    label: 'Cancelled',
  },
};

const BADGE_COLOR_SCHEME: Record<string, string> = {
  reserved: 'orange',
  ongoing: 'blue',
  completed: 'green',
  cancelled: 'red',
};

// --- Timeline step order ---

const TIMELINE_STEPS: { key: string; label: string }[] = [
  { key: 'reserved', label: 'Reserved' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
];

/**
 * Returns the 0-based index of how far the rental has progressed
 * through the timeline. Cancelled is treated as stuck at reserved.
 */
function getTimelineProgress(status: string): number {
  switch (status) {
    case 'completed':
      return 2;
    case 'ongoing':
      return 1;
    case 'reserved':
    case 'cancelled':
    default:
      return 0;
  }
}

// --- Reusable detail row ---

interface DetailRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  valueColor?: string;
  valueFontSize?: string;
  valueFontWeight?: string;
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
  valueFontSize = 'md',
  valueFontWeight = 'semibold',
}: DetailRowProps) {
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const iconBg = useColorModeValue('gray.50', 'navy.600');
  const iconColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <HStack spacing={3} align="start">
      <Box
        p={2}
        borderRadius="lg"
        bg={iconBg}
        color={iconColor}
        flexShrink={0}
      >
        <Icon as={icon} boxSize={4} />
      </Box>
      <Box>
        <Text fontSize="xs" color={labelColor} fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
          {label}
        </Text>
        <Text
          fontSize={valueFontSize}
          fontWeight={valueFontWeight}
          color={valueColor}
          mt={0.5}
        >
          {value}
        </Text>
      </Box>
    </HStack>
  );
}

// --- Main page component ---

export default function RentalDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const rentalId = Number(params.id);

  const { data: rental, isLoading } = useAdminRental(rentalId);
  const showLoading = useMinLoading(isLoading);
  const updateStatusMutation = useUpdateRentalStatus();

  // Theme-aware colors -- all at top of component
  const cardBg = useColorModeValue('white', 'navy.700');
  const cardBorder = useColorModeValue('gray.100', 'navy.600');
  const subtleBg = useColorModeValue('gray.50', 'navy.600');
  const dividerColor = useColorModeValue('gray.100', 'navy.600');
  const stepperTrackBg = useColorModeValue('gray.200', 'navy.600');
  const stepperInactiveText = useColorModeValue('gray.400', 'gray.500');
  const stepperInactiveCircleBg = useColorModeValue('gray.100', 'navy.600');
  const stepperInactiveCircleColor = useColorModeValue('gray.400', 'gray.500');
  const pickupBorder = useColorModeValue('green.100', 'navy.500');
  const returnBorder = useColorModeValue('red.100', 'navy.500');
  const headerBg = useColorModeValue('white', 'navy.700');
  const headerBorder = useColorModeValue('gray.100', 'navy.600');

  const handleStatusUpdate = async (status: RentalStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: rentalId, status });
      toast({
        title: 'Status updated',
        description: `Rental status changed to ${status}.`,
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

  // Compute rental duration and daily rate summary
  const rentalDays = useMemo(() => {
    if (!rental) return 0;
    const start = new Date(rental.startDate);
    const end = new Date(rental.endDate);
    const diff = differenceInDays(end, start);
    return diff > 0 ? diff : 1;
  }, [rental]);

  if (showLoading) {
    return <LoadingSpinner text="Loading rental details..." />;
  }

  if (!rental) {
    return (
      <Box textAlign="center" py={16}>
        <Icon as={FiTruck} boxSize={12} color="gray.300" mb={4} />
        <Heading size="md" color="gray.500" mb={2}>
          Rental not found
        </Heading>
        <Text color="gray.400" mb={6}>
          The rental you are looking for does not exist or has been removed.
        </Text>
        <Button
          leftIcon={<FiArrowLeft />}
          variant="outline"
          onClick={() => router.push('/admin/rentals')}
        >
          Back to Rentals
        </Button>
      </Box>
    );
  }

  const statusConfig = STATUS_CONFIG[rental.status];
  const timelineProgress = getTimelineProgress(rental.status);
  const isCancelled = rental.status === 'cancelled';
  const carName = `${rental.car?.brand ?? ''} ${rental.car?.model ?? ''}`.trim() || 'Vehicle';

  return (
    <Box>
      {/* ---- Top bar: back button + car name title + status badge + actions ---- */}
      <Flex
        justify="space-between"
        align="center"
        mb={6}
        flexWrap="wrap"
        gap={3}
      >
        <HStack spacing={3}>
          <Button
            variant="ghost"
            leftIcon={<FiArrowLeft />}
            onClick={() => router.back()}
            size="sm"
            fontWeight="medium"
          >
            Back
          </Button>
          <Divider orientation="vertical" h="20px" borderColor={dividerColor} />
          <Heading size="md" color="text.primary">
            {carName}
          </Heading>
          <Badge
            colorScheme={BADGE_COLOR_SCHEME[rental.status]}
            fontSize="xs"
            px={3}
            py={1}
            borderRadius="full"
            textTransform="capitalize"
          >
            {statusConfig.label}
          </Badge>
        </HStack>

        <HStack spacing={3}>
          {rental.status === 'reserved' && (
            <>
              <ProgressButton
                leftIcon={<FiPlay />}
                colorScheme="blue"
                size="sm"
                onClick={() => handleStatusUpdate('ongoing' as RentalStatus)}
                isLoading={updateStatusMutation.isPending}
              >
                Start Rental
              </ProgressButton>
              <ProgressButton
                leftIcon={<FiX />}
                colorScheme="red"
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate('cancelled' as RentalStatus)}
                isLoading={updateStatusMutation.isPending}
              >
                Cancel
              </ProgressButton>
            </>
          )}
          {rental.status === 'ongoing' && (
            <ProgressButton
              leftIcon={<FiCheck />}
              colorScheme="green"
              size="sm"
              onClick={() => handleStatusUpdate('completed' as RentalStatus)}
              isLoading={updateStatusMutation.isPending}
            >
              Complete Rental
            </ProgressButton>
          )}
        </HStack>
      </Flex>

      {/* ---- Hero section: car image + summary ---- */}
      <Box
        bg={cardBg}
        borderRadius="2xl"
        border="1px"
        borderColor={cardBorder}
        overflow="hidden"
        mb={6}
      >
        <Grid templateColumns={{ base: '1fr', lg: '380px 1fr' }} minH="260px">
          {/* Car image */}
          <GridItem
            bg={subtleBg}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={6}
          >
            <Image
              src={rental.car?.image || '/placeholder-car.jpg'}
              alt={carName}
              maxW="100%"
              maxH="220px"
              objectFit="contain"
              borderRadius="xl"
              fallbackSrc="https://via.placeholder.com/360x200?text=Vehicle"
            />
          </GridItem>

          {/* Summary panel */}
          <GridItem p={{ base: 5, md: 8 }}>
            <Flex direction="column" justify="space-between" h="full">
              <Box>
                {/* Car title */}
                <Heading size="lg" mb={1} color="text.primary">
                  {carName}
                </Heading>
                <Text color="gray.500" fontSize="sm" mb={4}>
                  {rental.car?.year}
                </Text>

                {/* Quick stats row */}
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                      Duration
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" color="text.primary">
                      {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                      Daily Rate
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" color="text.primary">
                      ${rental.car?.price}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                      Total
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" color="brand.500">
                      ${rental.total.toFixed(2)}
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>
            </Flex>
          </GridItem>
        </Grid>
      </Box>

      {/* ---- Rental Progress Stepper ---- */}
      <Box
        bg={cardBg}
        borderRadius="2xl"
        border="1px"
        borderColor={cardBorder}
        p={{ base: 5, md: 6 }}
        mb={6}
      >
        <Text fontSize="sm" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={5}>
          Rental Progress
        </Text>

        {isCancelled ? (
          <Alert status="error" borderRadius="xl" variant="subtle">
            <AlertIcon />
            <Box>
              <Text fontWeight="semibold" color="red.600">
                Rental Cancelled
              </Text>
              <Text fontSize="sm" color="red.500">
                This rental has been cancelled and is no longer active.
              </Text>
            </Box>
          </Alert>
        ) : (
          <Box px={{ base: 2, md: 8 }} py={4}>
            <Flex align="flex-start" position="relative">
              {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = index < timelineProgress;
                const isCurrent = index === timelineProgress;
                const isActive = index <= timelineProgress;

                // Determine which date/time to show under each step
                let stepDateInfo = '';
                if (index === 0 && rental.startDate) {
                  stepDateInfo = format(new Date(rental.startDate), 'MMM d, yyyy');
                } else if (index === 2 && rental.status === 'completed' && rental.endDate) {
                  stepDateInfo = format(new Date(rental.endDate), 'MMM d, yyyy');
                }

                return (
                  <Flex
                    key={step.key}
                    flex="1"
                    direction="column"
                    align="center"
                    position="relative"
                  >
                    {/* Connector bar to the right of this step (not on last step) */}
                    {index < TIMELINE_STEPS.length - 1 && (
                      <Box
                        position="absolute"
                        top="18px"
                        left="50%"
                        right="-50%"
                        h="4px"
                        borderRadius="full"
                        bg={isCompleted ? 'accent.400' : stepperTrackBg}
                        transition="background 0.4s ease"
                        zIndex={0}
                      />
                    )}

                    {/* Step number circle */}
                    <Flex
                      w={isCurrent ? '44px' : '36px'}
                      h={isCurrent ? '44px' : '36px'}
                      borderRadius="full"
                      bg={isActive ? 'accent.400' : stepperInactiveCircleBg}
                      color={isActive ? 'white' : stepperInactiveCircleColor}
                      align="center"
                      justify="center"
                      fontWeight="bold"
                      fontSize={isCurrent ? 'md' : 'sm'}
                      zIndex={1}
                      transition="all 0.3s"
                      boxShadow={isCurrent ? '0 0 0 4px rgba(27, 197, 189, 0.2)' : 'none'}
                    >
                      {isCompleted ? (
                        <Icon as={FiCheck} boxSize={isCurrent ? 5 : 4} />
                      ) : (
                        index + 1
                      )}
                    </Flex>

                    {/* Step label */}
                    <Text
                      fontSize="sm"
                      fontWeight={isCurrent ? 'bold' : 'medium'}
                      color={isActive ? 'accent.500' : stepperInactiveText}
                      mt={2}
                      textAlign="center"
                    >
                      {step.label}
                    </Text>

                    {/* Date/time info below label */}
                    {stepDateInfo && (
                      <Text
                        fontSize="xs"
                        color={stepperInactiveText}
                        mt={0.5}
                        textAlign="center"
                      >
                        {stepDateInfo}
                      </Text>
                    )}
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        )}
      </Box>

      {/* ---- Detail cards grid ---- */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Client Information */}
        <Box
          bg={cardBg}
          borderRadius="2xl"
          border="1px"
          borderColor={cardBorder}
          p={{ base: 5, md: 6 }}
        >
          <HStack mb={5}>
            <Box
              p={2}
              borderRadius="lg"
              bg="blue.50"
            >
              <Icon as={FiUser} color="blue.500" boxSize={4} />
            </Box>
            <Heading size="sm" color="text.primary">
              Client Information
            </Heading>
          </HStack>

          <VStack align="stretch" spacing={4}>
            <DetailRow
              icon={FiUser}
              label="Full Name"
              value={`${rental.client?.firstname ?? ''} ${rental.client?.name ?? ''}`.trim() || 'N/A'}
            />
            <DetailRow
              icon={FiMail}
              label="Email Address"
              value={rental.client?.email || 'N/A'}
            />
            <DetailRow
              icon={FiPhone}
              label="Phone Number"
              value={(rental.client as any)?.telephone || 'N/A'}
            />
          </VStack>
        </Box>

        {/* Vehicle Information */}
        <Box
          bg={cardBg}
          borderRadius="2xl"
          border="1px"
          borderColor={cardBorder}
          p={{ base: 5, md: 6 }}
        >
          <HStack mb={5}>
            <Box
              p={2}
              borderRadius="lg"
              bg="purple.50"
            >
              <Icon as={FiTruck} color="purple.500" boxSize={4} />
            </Box>
            <Heading size="sm" color="text.primary">
              Vehicle Information
            </Heading>
          </HStack>

          <VStack align="stretch" spacing={4}>
            <DetailRow
              icon={FiTruck}
              label="Vehicle"
              value={carName}
            />
            <DetailRow
              icon={FiCalendar}
              label="Year"
              value={String(rental.car?.year ?? 'N/A')}
            />
            <DetailRow
              icon={FiDollarSign}
              label="Daily Rate"
              value={`$${rental.car?.price ?? 0} / day`}
              valueColor="brand.500"
            />
          </VStack>
        </Box>

        {/* Rental Period */}
        <Box
          bg={cardBg}
          borderRadius="2xl"
          border="1px"
          borderColor={cardBorder}
          p={{ base: 5, md: 6 }}
        >
          <HStack mb={5}>
            <Box
              p={2}
              borderRadius="lg"
              bg="green.50"
            >
              <Icon as={FiCalendar} color="green.500" boxSize={4} />
            </Box>
            <Heading size="sm" color="text.primary">
              Rental Period
            </Heading>
          </HStack>

          <SimpleGrid columns={2} spacing={4}>
            {/* Pick-up */}
            <Box
              p={4}
              borderRadius="xl"
              bg={subtleBg}
              border="1px"
              borderColor={pickupBorder}
            >
              <Text fontSize="xs" color="green.500" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" mb={2}>
                Pick-up
              </Text>
              <Text fontWeight="semibold" fontSize="md" color="text.primary">
                {format(new Date(rental.startDate), 'MMM d, yyyy')}
              </Text>
              <HStack mt={1} spacing={1}>
                <Icon as={FiClock} boxSize={3} color="gray.400" />
                <Text fontSize="sm" color="gray.500">
                  {format(new Date(rental.startTime), 'h:mm a')}
                </Text>
              </HStack>
            </Box>

            {/* Return */}
            <Box
              p={4}
              borderRadius="xl"
              bg={subtleBg}
              border="1px"
              borderColor={returnBorder}
            >
              <Text fontSize="xs" color="red.400" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" mb={2}>
                Return
              </Text>
              <Text fontWeight="semibold" fontSize="md" color="text.primary">
                {format(new Date(rental.endDate), 'MMM d, yyyy')}
              </Text>
              <HStack mt={1} spacing={1}>
                <Icon as={FiClock} boxSize={3} color="gray.400" />
                <Text fontSize="sm" color="gray.500">
                  {format(new Date(rental.endTime), 'h:mm a')}
                </Text>
              </HStack>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Payment Summary */}
        <Box
          bg={cardBg}
          borderRadius="2xl"
          border="1px"
          borderColor={cardBorder}
          p={{ base: 5, md: 6 }}
        >
          <HStack mb={5}>
            <Box
              p={2}
              borderRadius="lg"
              bg="brand.50"
            >
              <Icon as={FiDollarSign} color="brand.500" boxSize={4} />
            </Box>
            <Heading size="sm" color="text.primary">
              Payment Summary
            </Heading>
          </HStack>

          <VStack align="stretch" spacing={3}>
            <Flex justify="space-between" align="center">
              <Text color="gray.500" fontSize="sm">
                Daily Rate
              </Text>
              <Text fontWeight="medium" fontSize="sm">
                ${rental.car?.price ?? 0}
              </Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="gray.500" fontSize="sm">
                Duration
              </Text>
              <Text fontWeight="medium" fontSize="sm">
                {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
              </Text>
            </Flex>

            <Divider borderColor={dividerColor} />

            <Flex justify="space-between" align="center">
              <Text fontWeight="bold" color="text.primary">
                Total Amount
              </Text>
              <Text fontWeight="bold" fontSize="2xl" color="brand.500">
                ${rental.total.toFixed(2)}
              </Text>
            </Flex>
          </VStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
