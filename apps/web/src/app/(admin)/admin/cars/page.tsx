'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Button,
  HStack,
  Image,
  Text,
  useToast,
  useDisclosure,
  Flex,
  SimpleGrid,
  VStack,
  Avatar,
  Icon,
  IconButton,
  Divider,
  Badge,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiInfo,
  FiClock,
} from 'react-icons/fi';
import { LoadingSpinner, useMinLoading, ConfirmDialog } from '@/components/ui';
import { useCars, useDeleteCar, useAdminRentals } from '@/hooks';
import { useAuthStore } from '@/stores/auth.store';
import type { Car, Rental } from '@bthgrentalcar/sdk';
import { format } from 'date-fns';
import { parseCarImages } from '@/lib/imageUtils';

/* ------------------------------------------------------------------ */
/*  Car Card Component                                                 */
/* ------------------------------------------------------------------ */
interface CarCardProps {
  car: Car;
  onView: () => void;
  onEdit: () => void;
  onAvailability: () => void;
  onDelete: () => void;
  onCardClick: () => void;
}

function CarCard({ car, onView, onEdit, onAvailability, onDelete, onCardClick }: CarCardProps) {
  const cardBg = useColorModeValue('white', 'navy.700');
  const cardBorder = useColorModeValue('gray.100', 'navy.600');
  const specColor = useColorModeValue('text.muted', 'gray.400');
  const specValueColor = useColorModeValue('text.secondary', 'gray.300');
  const titleColor = useColorModeValue('text.primary', 'white');
  const imageBg = useColorModeValue('gray.50', 'navy.800');

  return (
    <Box
      bg={cardBg}
      borderRadius="2xl"
      overflow="hidden"
      border="1px"
      borderColor={cardBorder}
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'cardHover',
      }}
      position="relative"
      cursor="pointer"
      onClick={onCardClick}
    >
      {/* Image area */}
      <Box position="relative" w="100%" h="240px" bg={imageBg}>
        <Image
          src={parseCarImages(car.image)[0] || 'https://via.placeholder.com/400x200?text=Car'}
          alt={`${car.brand} ${car.model}`}
          w="100%"
          h="100%"
          objectFit="cover"
        />

        {/* Action icons row - bottom right of image */}
        <HStack position="absolute" bottom={3} right={3} spacing={1}>
          <Tooltip label="View Details" hasArrow>
            <IconButton
              aria-label="View Details"
              icon={<FiEye />}
              size="sm"
              borderRadius="full"
              bg="blackAlpha.500"
              color="white"
              _hover={{ bg: 'accent.400', color: 'white' }}
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            />
          </Tooltip>
          <Tooltip label="Availability" hasArrow>
            <IconButton
              aria-label="Manage Availability"
              icon={<FiCalendar />}
              size="sm"
              borderRadius="full"
              bg="blackAlpha.500"
              color="white"
              _hover={{ bg: 'accent.400', color: 'white' }}
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onAvailability();
              }}
            />
          </Tooltip>
          <Tooltip label="Edit Car" hasArrow>
            <IconButton
              aria-label="Edit Car"
              icon={<FiEdit2 />}
              size="sm"
              borderRadius="full"
              bg="blackAlpha.500"
              color="white"
              _hover={{ bg: 'brand.400', color: 'white' }}
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            />
          </Tooltip>
          <Tooltip label="Delete Car" hasArrow>
            <IconButton
              aria-label="Delete Car"
              icon={<FiTrash2 />}
              size="sm"
              borderRadius="full"
              bg="blackAlpha.500"
              color="white"
              _hover={{ bg: 'red.500', color: 'white' }}
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            />
          </Tooltip>
        </HStack>
      </Box>

      {/* Card body */}
      <Box p={4}>
        <Text fontSize="lg" fontWeight="bold" color={titleColor} mb={1}>
          {car.brand} {car.model}
        </Text>

        {/* Specs row */}
        <HStack spacing={4} mb={2} flexWrap="wrap">
          <Text fontSize="xs" color={specColor}>
            Style:{' '}
            <Text as="span" color={specValueColor} fontWeight="medium">
              {car.brand}
            </Text>
          </Text>
          <Text fontSize="xs" color={specColor}>
            Type:{' '}
            <Text as="span" color={specValueColor} fontWeight="medium">
              {car.gearBox ?? 'Auto'}
            </Text>
          </Text>
          <Text fontSize="xs" color={specColor}>
            Fuel:{' '}
            <Text as="span" color={specValueColor} fontWeight="medium">
              {car.fuel ?? 'Petrol'}
            </Text>
          </Text>
        </HStack>

        {/* Price */}
        <Text fontSize="xl" fontWeight="bold" color="accent.400">
          $ {car.price?.toLocaleString() ?? '0'}
        </Text>
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent Activity Sidebar (Real Data)                                */
/* ------------------------------------------------------------------ */
function RecentActivitySidebar() {
  const { data: rentalsData } = useAdminRentals({ limit: 5 });
  const rentals = rentalsData?.data ?? [];

  const sidebarCardBg = useColorModeValue('white', 'navy.700');
  const sidebarBorder = useColorModeValue('gray.100', 'navy.600');
  const sidebarTitleColor = useColorModeValue('text.primary', 'white');
  const sidebarTextColor = useColorModeValue('text.secondary', 'gray.300');
  const sidebarMutedColor = useColorModeValue('text.muted', 'gray.400');
  const progressBg = useColorModeValue('gray.200', 'navy.600');
  const dividerColor = useColorModeValue('gray.200', 'navy.600');
  const imageThumbnailBg = useColorModeValue('gray.50', 'navy.800');

  const featuredRental = rentals[0];
  const infoRental = rentals[1];
  const bottomRental = rentals[2];

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'completed': return '100%';
      case 'ongoing': return '60%';
      case 'reserved': return '20%';
      default: return '0%';
    }
  };

  const getStatusDots = (status: string) => {
    switch (status) {
      case 'completed': return [true, true, true];
      case 'ongoing': return [true, true, false];
      case 'reserved': return [true, false, false];
      default: return [false, false, false];
    }
  };

  return (
    <VStack spacing={5} align="stretch">
      {/* Header */}
      <Flex align="center" justify="space-between">
        <HStack spacing={2}>
          <Text fontSize="lg" fontWeight="bold" color={sidebarTitleColor}>
            Recent Activity
          </Text>
          <Icon as={FiInfo} color={sidebarMutedColor} boxSize={4} />
        </HStack>
      </Flex>

      {/* Featured rental card */}
      {featuredRental && (
        <Box bg={sidebarCardBg} borderRadius="xl" border="1px" borderColor={sidebarBorder} p={4}>
          <Flex gap={4}>
            <Box
              w="100px"
              h="70px"
              borderRadius="lg"
              overflow="hidden"
              flexShrink={0}
              bg={imageThumbnailBg}
            >
              <Image
                src={featuredRental.car?.image || 'https://via.placeholder.com/100x70'}
                alt={featuredRental.car?.brand}
                w="100%"
                h="100%"
                objectFit="contain"
              />
            </Box>
            <VStack align="flex-start" spacing={1} flex="1" minW={0}>
              <Text fontSize="sm" fontWeight="bold" color={sidebarTitleColor} noOfLines={1}>
                {featuredRental.car?.brand} {featuredRental.car?.model}
              </Text>
              <HStack spacing={1}>
                <Icon as={FiClock} color={sidebarMutedColor} boxSize={3} />
                <Text fontSize="xs" color={sidebarMutedColor}>
                  {Math.ceil(
                    (new Date(featuredRental.endDate).getTime() - new Date(featuredRental.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  Day Rental
                </Text>
              </HStack>
              <Badge
                colorScheme={
                  featuredRental.status === 'ongoing'
                    ? 'blue'
                    : featuredRental.status === 'completed'
                    ? 'green'
                    : featuredRental.status === 'cancelled'
                    ? 'red'
                    : 'yellow'
                }
                fontSize="2xs"
                borderRadius="md"
              >
                {featuredRental.status}
              </Badge>
              <Text fontSize="sm" fontWeight="bold" color="accent.400">
                $ {featuredRental.total?.toLocaleString() ?? '0'}
              </Text>
            </VStack>
          </Flex>
        </Box>
      )}

      {/* Car Info section with rental details */}
      {infoRental && (
        <Box bg={sidebarCardBg} borderRadius="xl" border="1px" borderColor={sidebarBorder} p={4}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="sm" fontWeight="bold" color="accent.400">
              Car Info
            </Text>
            <Icon as={FiInfo} color={sidebarMutedColor} boxSize={4} />
          </Flex>

          {/* Client row */}
          <Flex align="center" gap={3} mb={4}>
            <Avatar
              size="sm"
              name={`${infoRental.client?.firstname} ${infoRental.client?.name}`}
              bg="brand.400"
            />
            <VStack align="flex-start" spacing={0} flex="1" minW={0}>
              <Text fontSize="sm" fontWeight="semibold" color={sidebarTitleColor} noOfLines={1}>
                {infoRental.client?.firstname} {infoRental.client?.name}
              </Text>
              <Text fontSize="xs" color={sidebarMutedColor} noOfLines={1}>
                {infoRental.client?.email}
              </Text>
            </VStack>
          </Flex>

          {/* Progress line */}
          <Box mb={4}>
            <Flex align="center" position="relative" h="24px">
              <Box
                position="absolute"
                top="50%"
                left="12px"
                right="12px"
                h="2px"
                bg={progressBg}
                transform="translateY(-50%)"
              />
              <Box
                position="absolute"
                top="50%"
                left="12px"
                w={getStatusProgress(infoRental.status)}
                h="2px"
                bg="accent.400"
                transform="translateY(-50%)"
                transition="width 0.3s"
              />
              <Flex justify="space-between" w="100%" position="relative" zIndex={1}>
                {getStatusDots(infoRental.status).map((active, i) => (
                  <Box
                    key={i}
                    w="10px"
                    h="10px"
                    borderRadius="full"
                    bg={active ? 'accent.400' : progressBg}
                    transition="background 0.3s"
                  />
                ))}
              </Flex>
            </Flex>
            <Flex justify="space-between" mt={1}>
              <Text fontSize="2xs" color={sidebarMutedColor}>Start</Text>
              <Text fontSize="2xs" color={sidebarMutedColor}>Active</Text>
              <Text fontSize="2xs" color={sidebarMutedColor}>Complete</Text>
            </Flex>
          </Box>

          <Divider borderColor={dividerColor} mb={4} />

          {/* Stats grid - real data */}
          <SimpleGrid columns={3} spacing={3} mb={3}>
            <StatItem
              label="Start Date"
              value={format(new Date(infoRental.startDate), 'MMM d')}
              titleColor={sidebarTitleColor}
              mutedColor={sidebarMutedColor}
            />
            <StatItem
              label="End Date"
              value={format(new Date(infoRental.endDate), 'MMM d')}
              titleColor={sidebarTitleColor}
              mutedColor={sidebarMutedColor}
            />
            <StatItem
              label="Duration"
              value={`${Math.ceil(
                (new Date(infoRental.endDate).getTime() - new Date(infoRental.startDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )} days`}
              titleColor={sidebarTitleColor}
              mutedColor={sidebarMutedColor}
            />
          </SimpleGrid>
          <SimpleGrid columns={3} spacing={3}>
            <StatItem
              label="Vehicle"
              value={infoRental.car?.brand ?? 'N/A'}
              titleColor={sidebarTitleColor}
              mutedColor={sidebarMutedColor}
            />
            <StatItem
              label="Model"
              value={infoRental.car?.model ?? 'N/A'}
              titleColor={sidebarTitleColor}
              mutedColor={sidebarMutedColor}
            />
            <StatItem
              label="Status"
              value={infoRental.status}
              titleColor={sidebarTitleColor}
              mutedColor={sidebarMutedColor}
            />
          </SimpleGrid>
        </Box>
      )}

      {/* Bottom client card */}
      {bottomRental && (
        <Box bg={sidebarCardBg} borderRadius="xl" border="1px" borderColor={sidebarBorder} p={4}>
          <Flex align="center" gap={3}>
            <Avatar
              size="sm"
              name={`${bottomRental.client?.firstname} ${bottomRental.client?.name}`}
              bg="accent.400"
            />
            <VStack align="flex-start" spacing={0} flex="1" minW={0}>
              <Text fontSize="sm" fontWeight="semibold" color={sidebarTitleColor} noOfLines={1}>
                {bottomRental.client?.firstname} {bottomRental.client?.name}
              </Text>
              <Text fontSize="xs" color={sidebarMutedColor} noOfLines={1}>
                {bottomRental.car?.brand} {bottomRental.car?.model}
              </Text>
            </VStack>
            <Badge
              bg="accent.400"
              color="white"
              fontWeight="bold"
              fontSize="xs"
              borderRadius="md"
              px={2}
              py={1}
            >
              ${bottomRental.total?.toLocaleString() ?? '0'}
            </Badge>
          </Flex>
        </Box>
      )}

      {/* Show remaining rentals as compact list */}
      {rentals.slice(3).map((rental) => (
        <Box key={rental.id} bg={sidebarCardBg} borderRadius="xl" border="1px" borderColor={sidebarBorder} p={4}>
          <Flex align="center" gap={3}>
            <Avatar
              size="sm"
              name={`${rental.client?.firstname} ${rental.client?.name}`}
              bg="brand.400"
            />
            <VStack align="flex-start" spacing={0} flex="1" minW={0}>
              <Text fontSize="sm" fontWeight="semibold" color={sidebarTitleColor} noOfLines={1}>
                {rental.client?.firstname} {rental.client?.name}
              </Text>
              <Text fontSize="xs" color={sidebarMutedColor} noOfLines={1}>
                {rental.car?.brand} {rental.car?.model}
              </Text>
            </VStack>
            <Badge
              colorScheme={
                rental.status === 'ongoing'
                  ? 'blue'
                  : rental.status === 'completed'
                  ? 'green'
                  : rental.status === 'cancelled'
                  ? 'red'
                  : 'yellow'
              }
              fontSize="2xs"
              borderRadius="md"
            >
              {rental.status}
            </Badge>
          </Flex>
        </Box>
      ))}
    </VStack>
  );
}

/* ------------------------------------------------------------------ */
/*  Small stat item                                                    */
/* ------------------------------------------------------------------ */
function StatItem({
  label,
  value,
  titleColor,
  mutedColor,
}: {
  label: string;
  value: string;
  titleColor: string;
  mutedColor: string;
}) {
  return (
    <VStack spacing={0} align="center">
      <Text fontSize="xs" fontWeight="bold" color={titleColor}>
        {value}
      </Text>
      <Text fontSize="2xs" color={mutedColor} textAlign="center">
        {label}
      </Text>
    </VStack>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */
export default function AdminCarsPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuthStore();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const titleAccent = useColorModeValue('accent.500', 'accent.400');
  const titleColor = useColorModeValue('text.primary', 'white');

  // Prefetch common navigation targets for instant transitions
  useEffect(() => {
    router.prefetch('/admin/cars/new');
  }, [router]);

  // Filter by agency for admin users
  const agencyId = user?.role === 'superAdmin' ? undefined : user?.agency?.id;
  const { data, isLoading, isFetching } = useCars({ agencyId });
  const showLoading = useMinLoading(isLoading);
  const deleteMutation = useDeleteCar();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast({
        title: 'Car deleted',
        status: 'success',
        duration: 3000,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to delete car',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // Only show full spinner on first load — show cached data during background refetch
  if (showLoading && !data) {
    return <LoadingSpinner />;
  }

  const cars = data?.data ?? [];
  const CARDS_BESIDE_SIDEBAR = 4; // 2 rows × 2 columns next to sidebar
  const topCars = cars.slice(0, CARDS_BESIDE_SIDEBAR);
  const bottomCars = cars.slice(CARDS_BESIDE_SIDEBAR);

  const renderCard = (car: Car) => (
    <CarCard
      key={car.id}
      car={car}
      onCardClick={() => router.push(`/admin/cars/${car.id}/edit`)}
      onView={() => router.push(`/admin/cars/${car.id}`)}
      onEdit={() => router.push(`/admin/cars/${car.id}/edit`)}
      onAvailability={() => router.push(`/admin/cars/${car.id}/availability`)}
      onDelete={() => {
        setDeleteId(car.id);
        onOpen();
      }}
    />
  );

  return (
    <Box>
      {/* Page Title */}
      <Heading size="xl" mb={8} fontWeight="bold">
        <Text as="span" color={titleAccent}>
          Available
        </Text>{' '}
        <Text as="span" color={titleColor}>
          Cars
        </Text>
      </Heading>

      {/* Top section: 2-col grid + sidebar */}
      <Flex gap={5} align="flex-start" mb={bottomCars.length > 0 ? 5 : 0}>
        <Box flex="1" minW={0}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            {topCars.map(renderCard)}
          </SimpleGrid>
        </Box>

        {/* Recent Activity Sidebar */}
        <Box
          w={{ base: '100%', lg: '340px' }}
          flexShrink={0}
          display={{ base: 'none', lg: 'block' }}
        >
          <RecentActivitySidebar />
        </Box>
      </Flex>

      {/* Bottom section: 3-col full width after sidebar */}
      {bottomCars.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
          {bottomCars.map(renderCard)}
        </SimpleGrid>
      )}

      {/* Add Car FAB */}
      <Box position="fixed" bottom={8} right={8} zIndex={10}>
        <Button
          leftIcon={<FiPlus />}
          size="lg"
          bg="brand.400"
          color="white"
          _hover={{ bg: 'brand.500' }}
          onClick={() => router.push('/admin/cars/new')}
          boxShadow="xl"
          borderRadius="full"
          px={8}
        >
          Add Car
        </Button>
      </Box>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleDelete}
        title="Delete Car"
        message="Are you sure you want to delete this car? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
