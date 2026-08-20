'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Button, Flex, Grid, GridItem, Heading, HStack, Icon, Image,
  Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter,
  ModalHeader, ModalOverlay, SimpleGrid, Spinner, Step, StepIcon,
  StepIndicator, StepNumber, Stepper, StepSeparator, StepStatus,
  StepTitle, Text, Textarea, useColorModeValue, useDisclosure,
  useSteps, useToast, VStack, Badge, Avatar, FormControl,
  FormLabel, Input, Center,
} from '@chakra-ui/react';
import { FiArrowLeft, FiCalendar, FiUsers, FiZap, FiCheckCircle } from 'react-icons/fi';
import { useCar, useCarAvailabilityCalendar, useCreateRental } from '@/hooks';
import { useAuthStore } from '@/stores/auth.store';
import { parseCarImages } from '@/lib/imageUtils';
import { format, addDays, differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { Suspense } from 'react';

/* ── Availability calendar (read-only) ── */
function MiniCalendar({ carId }: { carId: number }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const { data } = useCarAvailabilityCalendar(carId, viewYear, viewMonth);

  const blockedSet = new Set<string>((data?.blockedDates ?? []).map((b) => b.date));
  const textMuted = useColorModeValue('text.muted', 'gray.400');
  const calBg = useColorModeValue('white', 'navy.700');
  const calBorder = useColorModeValue('gray.100', 'navy.600');

  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <Box bg={calBg} border="1px" borderColor={calBorder} borderRadius="xl" p={4}>
      <HStack justify="space-between" mb={3}>
        <Button size="xs" variant="ghost" onClick={prevMonth}>&lsaquo;</Button>
        <Text fontWeight="semibold" fontSize="sm">
          {new Date(viewYear, viewMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        <Button size="xs" variant="ghost" onClick={nextMonth}>&rsaquo;</Button>
      </HStack>
      <Grid templateColumns="repeat(7, 1fr)" gap={1}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <Center key={d}><Text fontSize="2xs" color={textMuted} fontWeight="bold">{d}</Text></Center>
        ))}
        {blanks.map(i => <Box key={`b${i}`} />)}
        {days.map(d => {
          const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isBlocked = blockedSet.has(dateStr);
          const isPast = new Date(dateStr) < new Date(format(today, 'yyyy-MM-dd'));
          return (
            <Center key={d}>
              <Box
                w="28px"
                h="28px"
                borderRadius="full"
                bg={isBlocked || isPast ? 'red.100' : 'green.50'}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xs" color={isBlocked || isPast ? 'red.500' : 'green.600'} fontWeight="medium">{d}</Text>
              </Box>
            </Center>
          );
        })}
      </Grid>
      <HStack mt={3} spacing={4} fontSize="xs" color={textMuted}>
        <HStack><Box w={3} h={3} borderRadius="full" bg="green.50" border="1px solid" borderColor="green.200" /><Text>Available</Text></HStack>
        <HStack><Box w={3} h={3} borderRadius="full" bg="red.100" /><Text>Unavailable</Text></HStack>
      </HStack>
    </Box>
  );
}

/* ── Booking wizard ── */
const STEPS = [
  { title: 'Dates & Times' },
  { title: 'Your Info' },
  { title: 'Confirm' },
];

interface BookingData {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  notes: string;
}

function BookingWizard({ carId, pricePerDay, onSuccess }: { carId: number; pricePerDay: number; onSuccess: () => void }) {
  const toast = useToast();
  const { user } = useAuthStore();
  const { activeStep, setActiveStep } = useSteps({ index: 0, count: STEPS.length });
  const [form, setForm] = useState<BookingData>({
    startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '18:00',
    notes: '',
  });
  const createRental = useCreateRental();

  const textMuted = useColorModeValue('text.muted', 'gray.400');
  const infoBg = useColorModeValue('gray.50', 'navy.600');

  const days = (() => {
    try {
      const s = parseISO(form.startDate);
      const e = parseISO(form.endDate);
      if (isValid(s) && isValid(e) && e > s) return differenceInCalendarDays(e, s);
    } catch { /* ignore */ }
    return 0;
  })();
  const total = days * pricePerDay;

  const setField = (k: keyof BookingData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const canGoNext = () => {
    if (activeStep === 0) return !!form.startDate && !!form.endDate && days > 0;
    return true;
  };

  const handleConfirm = async () => {
    try {
      await createRental.mutateAsync({
        carId,
        startDate: form.startDate,
        endDate: form.endDate,
        startTime: form.startTime,
        endTime: form.endTime,
        total,
      });
      toast({ title: 'Booking confirmed!', description: 'Your reservation is now active.', status: 'success', duration: 4000 });
      onSuccess();
    } catch (err) {
      toast({ title: 'Booking failed', description: err instanceof Error ? err.message : 'An error occurred', status: 'error', duration: 5000 });
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Stepper index={activeStep} colorScheme="brand" size="sm">
        {STEPS.map((step, i) => (
          <Step key={i}>
            <StepIndicator>
              <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
            </StepIndicator>
            <Box flexShrink={0}><StepTitle>{step.title}</StepTitle></Box>
            <StepSeparator />
          </Step>
        ))}
      </Stepper>

      {/* Step 1 — Dates */}
      {activeStep === 0 && (
        <VStack spacing={4} align="stretch">
          <SimpleGrid columns={2} spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Pick-up Date</FormLabel>
              <Input type="date" value={form.startDate} onChange={setField('startDate')} min={format(addDays(new Date(), 1), 'yyyy-MM-dd')} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Return Date</FormLabel>
              <Input type="date" value={form.endDate} onChange={setField('endDate')} min={form.startDate} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Pick-up Time</FormLabel>
              <Input type="time" value={form.startTime} onChange={setField('startTime')} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Return Time</FormLabel>
              <Input type="time" value={form.endTime} onChange={setField('endTime')} />
            </FormControl>
          </SimpleGrid>
          {days > 0 && (
            <Box bg={infoBg} borderRadius="xl" p={4}>
              <Flex justify="space-between">
                <Text fontSize="sm" color={textMuted}>${pricePerDay}/day x {days} days</Text>
                <Text fontWeight="bold" color="accent.400" fontSize="lg">${total}</Text>
              </Flex>
            </Box>
          )}
        </VStack>
      )}

      {/* Step 2 — Your Info */}
      {activeStep === 1 && (
        <VStack spacing={4} align="stretch">
          <Box bg={infoBg} borderRadius="xl" p={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="semibold">{user?.firstname} {user?.name}</Text>
              <Text fontSize="sm" color={textMuted}>{user?.email}</Text>
              {user?.telephone && <Text fontSize="sm" color={textMuted}>{user.telephone}</Text>}
            </VStack>
          </Box>
          <FormControl>
            <FormLabel fontSize="sm">Additional Notes (optional)</FormLabel>
            <Textarea
              placeholder="Any special requests or information for the agency..."
              value={form.notes}
              onChange={setField('notes')}
              rows={3}
              borderRadius="xl"
              resize="none"
            />
          </FormControl>
        </VStack>
      )}

      {/* Step 3 — Confirm */}
      {activeStep === 2 && (
        <VStack spacing={3} align="stretch">
          <Box bg={infoBg} borderRadius="xl" p={4}>
            <VStack spacing={2} align="stretch">
              {[
                ['Pick-up', `${format(parseISO(form.startDate), 'MMM d, yyyy')} at ${form.startTime}`],
                ['Return', `${format(parseISO(form.endDate), 'MMM d, yyyy')} at ${form.endTime}`],
                ['Duration', `${days} day${days !== 1 ? 's' : ''}`],
                ['Rate', `$${pricePerDay}/day`],
              ].map(([label, value]) => (
                <Flex key={label} justify="space-between">
                  <Text fontSize="sm" color={textMuted}>{label}</Text>
                  <Text fontSize="sm" fontWeight="medium">{value}</Text>
                </Flex>
              ))}
              <Box borderTop="1px" borderColor="gray.200" pt={2} mt={1}>
                <Flex justify="space-between">
                  <Text fontWeight="bold">Total</Text>
                  <Text fontWeight="bold" color="accent.400" fontSize="lg">${total}</Text>
                </Flex>
              </Box>
              {form.notes && (
                <Box pt={1}>
                  <Text fontSize="xs" color={textMuted}>Notes: {form.notes}</Text>
                </Box>
              )}
            </VStack>
          </Box>
        </VStack>
      )}

      {/* Navigation */}
      <HStack justify="space-between">
        <Button variant="ghost" onClick={() => setActiveStep(activeStep - 1)} isDisabled={activeStep === 0}>
          Back
        </Button>
        {activeStep < STEPS.length - 1 ? (
          <Button bg="brand.400" color="white" _hover={{ bg: 'brand.500' }} onClick={() => setActiveStep(activeStep + 1)} isDisabled={!canGoNext()}>
            Next
          </Button>
        ) : (
          <Button bg="accent.400" color="white" _hover={{ bg: 'accent.500' }} onClick={handleConfirm} isLoading={createRental.isPending} leftIcon={<FiCheckCircle />}>
            Confirm Booking
          </Button>
        )}
      </HStack>
    </VStack>
  );
}

/* ── Inner page content ── */
function CarDetailContent() {
  const params = useParams();
  const router = useRouter();
  const carId = Number(params.id);
  const { data: car, isLoading } = useCar(carId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isAuthenticated } = useAuthStore();

  const cardBg = useColorModeValue('white', 'navy.700');
  const cardBorder = useColorModeValue('gray.100', 'navy.600');
  const textMuted = useColorModeValue('text.muted', 'gray.400');
  const specBg = useColorModeValue('gray.50', 'navy.600');

  const [currentImage, setCurrentImage] = useState(0);
  const images = car ? parseCarImages(car.image) : [];

  const handleBookClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/cars/${carId}`);
      return;
    }
    onOpen();
  };

  if (isLoading) return (
    <Center h="60vh"><Spinner size="xl" color="brand.400" thickness="4px" /></Center>
  );
  if (!car) return (
    <Center h="60vh"><VStack><Text>Car not found</Text><Button onClick={() => router.back()}>Go Back</Button></VStack></Center>
  );

  const specs = [
    { icon: FiCalendar, label: 'Year', value: String(car.year) },
    { icon: FiZap, label: 'Fuel', value: car.fuel },
    { icon: FiUsers, label: 'Doors', value: String(car.door) },
    { icon: FiCalendar, label: 'Gearbox', value: car.gearBox },
  ];

  return (
    <Box>
      {/* Back */}
      <Button variant="ghost" leftIcon={<FiArrowLeft />} mb={4} onClick={() => router.back()}>
        Back to Cars
      </Button>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 380px' }} gap={6}>
        {/* Left column */}
        <GridItem>
          {/* Main image */}
          <Box borderRadius="2xl" overflow="hidden" mb={3} h={{ base: '240px', md: '400px' }} bg="navy.800">
            <Image
              src={images[currentImage] || 'https://via.placeholder.com/800x400?text=No+Image'}
              alt={`${car.brand} ${car.model}`}
              w="100%"
              h="100%"
              objectFit="cover"
            />
          </Box>
          {/* Thumbnails */}
          {images.length > 1 && (
            <HStack spacing={2} mb={4} overflowX="auto">
              {images.map((img, i) => (
                <Box
                  key={i}
                  w="70px"
                  h="50px"
                  borderRadius="lg"
                  overflow="hidden"
                  cursor="pointer"
                  border="2px solid"
                  borderColor={i === currentImage ? 'brand.400' : 'transparent'}
                  flexShrink={0}
                  onClick={() => setCurrentImage(i)}
                >
                  <Image src={img} alt={`thumb ${i}`} w="100%" h="100%" objectFit="cover" />
                </Box>
              ))}
            </HStack>
          )}

          {/* Info */}
          <Box bg={cardBg} border="1px" borderColor={cardBorder} borderRadius="2xl" p={6} mb={4}>
            <Flex justify="space-between" align="flex-start" mb={4}>
              <Box>
                <Heading size="lg">{car.brand} {car.model}</Heading>
                <Text color={textMuted}>{car.mileage?.toLocaleString()} km</Text>
              </Box>
              <Box textAlign="right">
                <Text fontSize="2xl" fontWeight="bold" color="accent.400">${car.price}</Text>
                <Text fontSize="sm" color={textMuted}>per day</Text>
              </Box>
            </Flex>

            {/* Specs grid */}
            <SimpleGrid columns={4} spacing={3} mb={4}>
              {specs.map((s) => (
                <VStack key={s.label} bg={specBg} borderRadius="xl" p={3} spacing={1}>
                  <Icon as={s.icon} color="brand.400" boxSize={5} />
                  <Text fontSize="xs" color={textMuted}>{s.label}</Text>
                  <Text fontSize="xs" fontWeight="bold">{s.value}</Text>
                </VStack>
              ))}
            </SimpleGrid>

            {car.description && (
              <Text fontSize="sm" color={textMuted} lineHeight="tall">{car.description}</Text>
            )}
          </Box>

          {/* Agency */}
          {car.Agency && (
            <Box bg={cardBg} border="1px" borderColor={cardBorder} borderRadius="2xl" p={4}>
              <HStack spacing={3}>
                <Avatar size="md" name={car.Agency.name} bg="brand.400" color="white" borderRadius="xl" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="semibold">{car.Agency.name}</Text>
                </VStack>
              </HStack>
            </Box>
          )}
        </GridItem>

        {/* Right column — calendar + book */}
        <GridItem>
          <VStack spacing={4} align="stretch" position={{ lg: 'sticky' }} top="100px">
            {/* Booking CTA */}
            <Box bg={cardBg} border="1px" borderColor={cardBorder} borderRadius="2xl" p={5}>
              <Flex justify="space-between" align="center" mb={4}>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold" color="accent.400">${car.price}</Text>
                  <Text fontSize="sm" color={textMuted}>per day</Text>
                </Box>
                <Badge colorScheme="green" borderRadius="full" px={3} py={1}>Available</Badge>
              </Flex>
              <Button
                w="full"
                size="lg"
                bg="brand.400"
                color="white"
                _hover={{ bg: 'brand.500' }}
                borderRadius="xl"
                leftIcon={<FiCalendar />}
                onClick={handleBookClick}
              >
                Book This Car
              </Button>
            </Box>

            {/* Availability calendar */}
            <MiniCalendar carId={carId} />
          </VStack>
        </GridItem>
      </Grid>

      {/* Booking modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            Book {car.brand} {car.model}
            <Text fontSize="sm" color={textMuted} fontWeight="normal">${car.price}/day</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={2}>
            <BookingWizard
              carId={carId}
              pricePerDay={car.price}
              onSuccess={() => { onClose(); router.push('/rentals'); }}
            />
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </Modal>
    </Box>
  );
}

/* ── Page with Suspense boundary ── */
export default function CarDetailPage() {
  return (
    <Suspense fallback={<Center h="60vh"><Spinner size="xl" color="brand.400" thickness="4px" /></Center>}>
      <CarDetailContent />
    </Suspense>
  );
}
