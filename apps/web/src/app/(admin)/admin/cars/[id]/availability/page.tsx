'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Heading,
  Button,
  HStack,
  VStack,
  Text,
  SimpleGrid,
  Badge,
  useColorModeValue,
  useToast,
  IconButton,
  Flex,
  Tooltip,
  Divider,
  Icon,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiLock,
  FiUnlock,
  FiX,
} from 'react-icons/fi';
import { LoadingSpinner, useMinLoading, ProgressButton } from '@/components/ui';
import { useCar, useCarAvailabilityCalendar, useBlockDates, useUnblockDates } from '@/hooks';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  isAfter,
  startOfDay,
  addMonths,
  subMonths,
  getDay,
  isSameDay,
} from 'date-fns';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CarAvailabilityPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const carId = Number(params.id);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: car, isLoading: carLoading } = useCar(carId);
  const { data: calendar, isLoading: calendarLoading, refetch } = useCarAvailabilityCalendar(
    carId,
    year,
    month
  );

  const showLoading = useMinLoading(carLoading || calendarLoading);

  const blockMutation = useBlockDates();
  const unblockMutation = useUnblockDates();

  // All useColorModeValue calls at top of component
  const pageBg = useColorModeValue('gray.50', 'navy.900');
  const cardBg = useColorModeValue('white', 'navy.700');
  const cardBorder = useColorModeValue('gray.100', 'navy.600');
  const headerTextColor = useColorModeValue('text.primary', 'white');
  const mutedTextColor = useColorModeValue('text.muted', 'gray.400');
  const weekdayColor = useColorModeValue('gray.500', 'gray.400');
  const dayTextColor = useColorModeValue('text.primary', 'white');
  const dayHoverBg = useColorModeValue('gray.50', 'navy.600');
  const pastDayColor = useColorModeValue('gray.300', 'gray.600');
  const todayRingColor = useColorModeValue('accent.400', 'accent.300');
  const rangeBg = useColorModeValue('brand.50', 'brand.900');
  const rangeEndpointBg = useColorModeValue('brand.400', 'brand.500');
  const sidebarDivider = useColorModeValue('gray.100', 'navy.600');
  const statLabelColor = useColorModeValue('gray.500', 'gray.400');
  const statValueColor = useColorModeValue('text.primary', 'white');
  const selectionCardBg = useColorModeValue('brand.50', 'navy.600');
  const selectionCardBorder = useColorModeValue('brand.200', 'brand.700');

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startPadding = getDay(monthStart);
    const paddedDays: (Date | null)[] = Array(startPadding).fill(null);

    return [...paddedDays, ...days];
  }, [currentDate]);

  // Build a map of blocked and rental dates
  const dateStatusMap = useMemo(() => {
    const map = new Map<string, 'blocked' | 'rental'>();

    if (calendar) {
      calendar.blockedDates.forEach((bd) => {
        const dateStr = format(new Date(bd.date), 'yyyy-MM-dd');
        map.set(dateStr, 'blocked');
      });

      calendar.rentals.forEach((rental) => {
        const start = new Date(rental.startDate);
        const end = new Date(rental.endDate);
        const days = eachDayOfInterval({ start, end });
        days.forEach((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          if (!map.has(dateStr)) {
            map.set(dateStr, 'rental');
          }
        });
      });
    }

    return map;
  }, [calendar]);

  // Get selected dates as array
  const selectedDates = useMemo(() => {
    if (!rangeStart) return [];

    const end = rangeEnd || rangeStart;
    const start = isBefore(rangeStart, end) ? rangeStart : end;
    const endDate = isAfter(rangeStart, end) ? rangeStart : end;

    return eachDayOfInterval({ start, end: endDate }).map(d => format(d, 'yyyy-MM-dd'));
  }, [rangeStart, rangeEnd]);

  // Check if a date is in the selection range
  const isInRange = (date: Date) => {
    if (!rangeStart) return false;

    const end = rangeEnd || hoverDate || rangeStart;
    const start = isBefore(rangeStart, end) ? rangeStart : end;
    const endDate = isAfter(rangeStart, end) ? rangeStart : end;

    return !isBefore(date, start) && !isAfter(date, endDate);
  };

  const isRangeStart = (date: Date) => rangeStart && isSameDay(date, rangeStart);
  const isRangeEnd = (date: Date) => rangeEnd && isSameDay(date, rangeEnd);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const status = dateStatusMap.get(dateStr);

    if (status === 'rental') {
      toast({
        title: 'Cannot modify',
        description: 'This date has an active rental',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    if (isBefore(date, startOfDay(new Date()))) {
      return;
    }

    if (!rangeStart || rangeEnd) {
      setRangeStart(date);
      setRangeEnd(null);
    } else {
      if (isBefore(date, rangeStart)) {
        setRangeEnd(rangeStart);
        setRangeStart(date);
      } else {
        setRangeEnd(date);
      }
    }
  };

  const handleDateHover = (date: Date | null) => {
    if (rangeStart && !rangeEnd) {
      setHoverDate(date);
    }
  };

  const clearSelection = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setHoverDate(null);
  };

  const handleBlockSelected = async () => {
    const datesToBlock = selectedDates.filter(
      (d) => !dateStatusMap.has(d)
    );

    if (datesToBlock.length === 0) {
      toast({
        title: 'No dates to block',
        description: 'Selected dates are already blocked or have rentals',
        status: 'info',
        duration: 2000,
      });
      return;
    }

    try {
      await blockMutation.mutateAsync({ carId, dates: datesToBlock });
      toast({
        title: 'Dates blocked',
        description: `${datesToBlock.length} date(s) blocked successfully`,
        status: 'success',
        duration: 2000,
      });
      clearSelection();
      refetch();
    } catch (error) {
      toast({
        title: 'Failed to block dates',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleUnblockSelected = async () => {
    const datesToUnblock = selectedDates.filter(
      (d) => dateStatusMap.get(d) === 'blocked'
    );

    if (datesToUnblock.length === 0) {
      toast({
        title: 'No dates to unblock',
        description: 'Selected dates are not blocked',
        status: 'info',
        duration: 2000,
      });
      return;
    }

    try {
      await unblockMutation.mutateAsync({ carId, dates: datesToUnblock });
      toast({
        title: 'Dates unblocked',
        description: `${datesToUnblock.length} date(s) unblocked successfully`,
        status: 'success',
        duration: 2000,
      });
      clearSelection();
      refetch();
    } catch (error) {
      toast({
        title: 'Failed to unblock dates',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  if (showLoading) {
    return <LoadingSpinner text="Loading availability..." />;
  }

  if (!car) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Car not found</Text>
        <Button mt={4} onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header card with car info and navigation */}
      <Box
        bg={cardBg}
        borderRadius="2xl"
        border="1px"
        borderColor={cardBorder}
        p={4}
        mb={4}
      >
        <Flex align="center" justify="space-between" flexWrap="wrap" gap={3}>
          <HStack spacing={4}>
            <IconButton
              aria-label="Back to car"
              icon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => router.push(`/admin/cars/${carId}`)}
              borderRadius="full"
            />
            <Box>
              <Text fontSize="lg" fontWeight="bold" color={headerTextColor}>
                {car.brand} {car.model}
              </Text>
              <Text fontSize="sm" color={mutedTextColor}>
                Availability Calendar
              </Text>
            </Box>
          </HStack>

          {/* Month navigation */}
          <HStack spacing={3}>
            <IconButton
              aria-label="Previous month"
              icon={<FiChevronLeft />}
              onClick={handlePrevMonth}
              variant="ghost"
              borderRadius="full"
              size="sm"
            />
            <Text fontWeight="semibold" fontSize="md" color={headerTextColor} minW="140px" textAlign="center">
              {format(currentDate, 'MMMM yyyy')}
            </Text>
            <IconButton
              aria-label="Next month"
              icon={<FiChevronRight />}
              onClick={handleNextMonth}
              variant="ghost"
              borderRadius="full"
              size="sm"
            />
          </HStack>
        </Flex>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
        {/* Calendar grid */}
        <Box
          bg={cardBg}
          p={3}
          borderRadius="2xl"
          border="1px"
          borderColor={cardBorder}
          gridColumn={{ lg: 'span 2' }}
        >
          {/* Weekday headers */}
          <SimpleGrid columns={7} spacing={0} mb={1}>
            {WEEKDAYS.map((day) => (
              <Box key={day} textAlign="center" py={1}>
                <Text fontSize="xs" fontWeight="semibold" color={weekdayColor} textTransform="uppercase" letterSpacing="wider">
                  {day}
                </Text>
              </Box>
            ))}
          </SimpleGrid>

          {/* Calendar days */}
          <SimpleGrid columns={7} spacing={0}>
            {calendarDays.map((day, index) => {
              if (!day) {
                return <Box key={`empty-${index}`} h="36px" />;
              }

              const dateStr = format(day, 'yyyy-MM-dd');
              const status = dateStatusMap.get(dateStr);
              const isPast = isBefore(day, startOfDay(new Date()));
              const isCurrentMonth = isSameMonth(day, currentDate);
              const inRange = isInRange(day);
              const isStart = isRangeStart(day);
              const isEnd = isRangeEnd(day);
              const isDayToday = isToday(day);
              const isInteractive = !isPast && status !== 'rental';

              // Determine range visual styling
              let cellBorderRadius = 'xl';
              let cellBg = 'transparent';

              if (isStart && isEnd) {
                cellBg = rangeEndpointBg;
                cellBorderRadius = 'xl';
              } else if (isStart) {
                cellBg = rangeEndpointBg;
                cellBorderRadius = 'xl 0 0 xl';
              } else if (isEnd) {
                cellBg = rangeEndpointBg;
                cellBorderRadius = '0 xl xl 0';
              } else if (inRange) {
                cellBg = rangeBg;
                cellBorderRadius = '0';
              }

              // Text color for range endpoints
              const isEndpoint = isStart || isEnd;
              const textColor = isEndpoint
                ? 'white'
                : isPast
                ? pastDayColor
                : dayTextColor;

              // Determine which status dot to show
              let dotColor: string | null = null;
              if (isPast) {
                dotColor = 'gray.300';
              } else if (status === 'blocked') {
                dotColor = 'red.400';
              } else if (status === 'rental') {
                dotColor = 'orange.400';
              } else if (!isPast && isCurrentMonth) {
                dotColor = 'green.400';
              }

              return (
                <Tooltip
                  key={dateStr}
                  label={
                    status === 'rental'
                      ? 'Booked'
                      : status === 'blocked'
                      ? 'Blocked'
                      : isPast
                      ? 'Past date'
                      : rangeStart && !rangeEnd
                      ? 'Click to complete range'
                      : 'Available'
                  }
                  hasArrow
                  placement="top"
                >
                  <Flex
                    h="36px"
                    direction="column"
                    align="center"
                    justify="center"
                    borderRadius={cellBorderRadius}
                    bg={cellBg}
                    opacity={isCurrentMonth ? 1 : 0.4}
                    cursor={isInteractive ? 'pointer' : 'default'}
                    onClick={() => isInteractive && handleDateClick(day)}
                    onMouseEnter={() => isInteractive && handleDateHover(day)}
                    onMouseLeave={() => handleDateHover(null)}
                    _hover={
                      isInteractive && !isEndpoint
                        ? { bg: inRange ? rangeBg : dayHoverBg }
                        : undefined
                    }
                    transition="all 0.15s ease"
                    position="relative"
                  >
                    {/* Today ring indicator */}
                    {isDayToday && !isEndpoint && (
                      <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        w="28px"
                        h="28px"
                        borderRadius="full"
                        border="2px solid"
                        borderColor={todayRingColor}
                        pointerEvents="none"
                      />
                    )}

                    <Text
                      fontSize="sm"
                      fontWeight={isDayToday || isEndpoint ? 'bold' : 'medium'}
                      color={textColor}
                      zIndex={1}
                    >
                      {format(day, 'd')}
                    </Text>

                    {/* Status dot */}
                    {dotColor && !isEndpoint && (
                      <Box
                        w="5px"
                        h="5px"
                        borderRadius="full"
                        bg={dotColor}
                        mt="1px"
                      />
                    )}
                  </Flex>
                </Tooltip>
              );
            })}
          </SimpleGrid>
        </Box>

        {/* Right sidebar: combined stats, legend, selection, and actions */}
        <Box
          bg={cardBg}
          borderRadius="2xl"
          border="1px"
          borderColor={cardBorder}
          overflow="hidden"
        >
          {/* Selection info at top if active */}
          {rangeStart && (
            <Box
              bg={selectionCardBg}
              p={4}
              borderBottom="1px"
              borderColor={selectionCardBorder}
            >
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontSize="sm" fontWeight="bold" color={headerTextColor}>
                  Selection
                </Text>
                <IconButton
                  aria-label="Clear selection"
                  icon={<FiX />}
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  onClick={clearSelection}
                />
              </Flex>
              <VStack align="stretch" spacing={2}>
                <Flex justify="space-between">
                  <Text fontSize="sm" color={statLabelColor}>Start</Text>
                  <Text fontSize="sm" fontWeight="semibold" color={statValueColor}>
                    {format(rangeStart, 'MMM d, yyyy')}
                  </Text>
                </Flex>
                {rangeEnd && (
                  <>
                    <Flex justify="space-between">
                      <Text fontSize="sm" color={statLabelColor}>End</Text>
                      <Text fontSize="sm" fontWeight="semibold" color={statValueColor}>
                        {format(rangeEnd, 'MMM d, yyyy')}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontSize="sm" color={statLabelColor}>Days</Text>
                      <Badge colorScheme="brand" borderRadius="full" px={2}>
                        {selectedDates.length}
                      </Badge>
                    </Flex>
                  </>
                )}
                {!rangeEnd && (
                  <Text fontSize="xs" color="orange.500" fontWeight="medium">
                    Click another date to complete range
                  </Text>
                )}
              </VStack>
            </Box>
          )}

          {/* Stats section */}
          <Box p={4}>
            <Text fontSize="sm" fontWeight="bold" color={headerTextColor} mb={4}>
              Monthly Overview
            </Text>
            {calendar && (
              <VStack align="stretch" spacing={2}>
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color={statLabelColor}>Total Days</Text>
                  <Text fontSize="sm" fontWeight="bold" color={statValueColor}>
                    {calendar.stats.totalDays}
                  </Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Box w="8px" h="8px" borderRadius="full" bg="green.400" />
                    <Text fontSize="sm" color={statLabelColor}>Available</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold" color="green.500">
                    {calendar.stats.availableDays}
                  </Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Box w="8px" h="8px" borderRadius="full" bg="orange.400" />
                    <Text fontSize="sm" color={statLabelColor}>Booked</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold" color="orange.500">
                    {calendar.stats.rentalBlockedDays}
                  </Text>
                </Flex>
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Box w="8px" h="8px" borderRadius="full" bg="red.400" />
                    <Text fontSize="sm" color={statLabelColor}>Blocked</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold" color="red.500">
                    {calendar.stats.manuallyBlockedDays}
                  </Text>
                </Flex>
              </VStack>
            )}
          </Box>

          <Divider borderColor={sidebarDivider} />

          {/* Legend section */}
          <Box p={4}>
            <Text fontSize="sm" fontWeight="bold" color={headerTextColor} mb={3}>
              Legend
            </Text>
            <Flex flexWrap="wrap" gap={3}>
              <HStack spacing={2}>
                <Box w="8px" h="8px" borderRadius="full" bg="green.400" />
                <Text fontSize="xs" color={statLabelColor}>Available</Text>
              </HStack>
              <HStack spacing={2}>
                <Box w="8px" h="8px" borderRadius="full" bg="orange.400" />
                <Text fontSize="xs" color={statLabelColor}>Booked (Rental)</Text>
              </HStack>
              <HStack spacing={2}>
                <Box w="8px" h="8px" borderRadius="full" bg="red.400" />
                <Text fontSize="xs" color={statLabelColor}>Manually Blocked</Text>
              </HStack>
              <HStack spacing={2}>
                <Box w="8px" h="8px" borderRadius="full" bg="gray.300" />
                <Text fontSize="xs" color={statLabelColor}>Past Date</Text>
              </HStack>
              <HStack spacing={2}>
                <Box
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  border="2px solid"
                  borderColor="accent.400"
                />
                <Text fontSize="xs" color={statLabelColor}>Today</Text>
              </HStack>
            </Flex>
          </Box>

          <Divider borderColor={sidebarDivider} />

          {/* Actions section */}
          <Box p={4}>
            <Text fontSize="sm" fontWeight="bold" color={headerTextColor} mb={3}>
              Actions
            </Text>
            <HStack spacing={2}>
              <ProgressButton
                flex={1}
                leftIcon={<FiLock />}
                colorScheme="red"
                size="sm"
                onClick={handleBlockSelected}
                isLoading={blockMutation.isPending}
                isDisabled={selectedDates.length === 0 || !rangeEnd}
                borderRadius="lg"
              >
                Block ({selectedDates.length})
              </ProgressButton>
              <ProgressButton
                flex={1}
                leftIcon={<FiUnlock />}
                colorScheme="green"
                variant="outline"
                size="sm"
                onClick={handleUnblockSelected}
                isLoading={unblockMutation.isPending}
                isDisabled={selectedDates.length === 0 || !rangeEnd}
                borderRadius="lg"
              >
                Unblock
              </ProgressButton>
              <IconButton
                aria-label="Clear selection"
                icon={<FiX />}
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                isDisabled={!rangeStart}
                borderRadius="lg"
              />
            </HStack>
          </Box>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
