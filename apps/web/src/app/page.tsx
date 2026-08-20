'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Center,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Badge,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
} from '@chakra-ui/react';
import {
  FiTruck,
  FiArrowRight,
  FiUsers,
  FiAward,
  FiShield,
  FiClock,
  FiLogOut,
  FiUser,
  FiCalendar,
} from 'react-icons/fi';
import { useAuthStore } from '@/stores/auth.store';
import { useCars, useAgencies } from '@/hooks';
import { parseCarImages } from '@/lib/imageUtils';
import type { Car, Agency } from '@bthgrentalcar/sdk';

/* ── Featured car card ── */
function FeaturedCarCard({ car }: { car: Car }) {
  return (
    <Box
      as={NextLink}
      href={`/cars/${car.id}`}
      bg="white"
      borderRadius="2xl"
      overflow="hidden"
      border="1px"
      borderColor="gray.100"
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg', textDecoration: 'none' }}
      display="block"
    >
      <Box h="200px" bg="gray.100" overflow="hidden" position="relative">
        <Image
          src={parseCarImages(car.image)[0] || 'https://via.placeholder.com/400x200?text=Car'}
          alt={`${car.brand} ${car.model}`}
          w="100%"
          h="100%"
          objectFit="cover"
        />
        <Box position="absolute" top={3} right={3}>
          <Badge bg="brand.400" color="white" borderRadius="full" px={3} py={1} fontSize="sm" fontWeight="bold">
            ${car.price}/day
          </Badge>
        </Box>
      </Box>
      <Box p={4}>
        <Text fontWeight="bold" fontSize="md" color="navy.800" mb={1}>
          {car.brand} {car.model}
        </Text>
        <HStack spacing={3} mb={1}>
          <Text fontSize="xs" color="gray.500">{car.year}</Text>
          <Text fontSize="xs" color="gray.500">·</Text>
          <Text fontSize="xs" color="gray.500">{car.fuel}</Text>
          <Text fontSize="xs" color="gray.500">·</Text>
          <Text fontSize="xs" color="gray.500">{car.gearBox}</Text>
        </HStack>
      </Box>
    </Box>
  );
}

/* ── Landing page nav ── */
function LandingNav() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <Box
      as="nav"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={100}
      bg="white"
      borderBottom="1px"
      borderColor="gray.100"
      px={{ base: 4, md: 8, lg: 12 }}
      py={3}
    >
      <Flex align="center" justify="space-between" maxW="1200px" mx="auto">
        {/* Logo */}
        <HStack spacing={3} as={NextLink} href="/" _hover={{ textDecoration: 'none' }}>
          <Box
            w={10}
            h={10}
            bg="navy.800"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={FiTruck} color="brand.400" boxSize={5} />
          </Box>
          <Text fontSize="lg" fontWeight="bold" color="navy.800">
            BTHG Rental
          </Text>
        </HStack>

        {/* Center */}
        <Button
          as={NextLink}
          href="/cars"
          variant="ghost"
          color="navy.800"
          fontWeight="medium"
          fontSize="sm"
          _hover={{ color: 'brand.400' }}
          display={{ base: 'none', md: 'inline-flex' }}
        >
          Browse Cars
        </Button>

        {/* Right */}
        {isAuthenticated && user ? (
          <HStack spacing={3}>
            <Button
              as={NextLink}
              href="/rentals"
              variant="ghost"
              size="sm"
              color="navy.800"
              fontWeight="medium"
              leftIcon={<FiCalendar />}
              display={{ base: 'none', md: 'inline-flex' }}
            >
              My Rentals
            </Button>
            <Button
              as={NextLink}
              href="/profile"
              variant="ghost"
              size="sm"
              color="navy.800"
              fontWeight="medium"
              leftIcon={<FiUser />}
              display={{ base: 'none', md: 'inline-flex' }}
            >
              Profile
            </Button>
            <HStack spacing={2}>
              <Avatar
                size="sm"
                name={`${user.firstname} ${user.name}`}
                src={user.image}
                bg="brand.400"
                color="white"
              />
              <Text fontSize="sm" fontWeight="medium" color="navy.800" display={{ base: 'none', lg: 'block' }}>
                {user.firstname}
              </Text>
              <Tooltip label="Logout" hasArrow>
                <IconButton
                  aria-label="Logout"
                  icon={<FiLogOut />}
                  variant="ghost"
                  size="sm"
                  color="red.500"
                  _hover={{ bg: 'red.50' }}
                  onClick={handleLogout}
                />
              </Tooltip>
            </HStack>
          </HStack>
        ) : (
          <HStack spacing={3}>
            <Button
              as={NextLink}
              href="/login"
              variant="ghost"
              color="navy.800"
              size="sm"
              fontWeight="medium"
            >
              Sign In
            </Button>
            <Button
              as={NextLink}
              href="/register"
              bg="navy.800"
              color="white"
              _hover={{ bg: 'navy.700' }}
              size="sm"
              borderRadius="lg"
            >
              Sign Up
            </Button>
          </HStack>
        )}
      </Flex>
    </Box>
  );
}

/* ── Landing page (public) ── */
function LandingPage() {
  const { data: carsData } = useCars({ limit: 6 });
  const { data: agenciesData } = useAgencies({ limit: 6 });
  const cars = carsData?.data ?? [];
  const agencies = agenciesData?.data ?? [];

  const stats = [
    { value: '500+', label: 'Vehicles' },
    { value: '50+', label: 'Agencies' },
    { value: '10K+', label: 'Clients' },
  ];

  const features = [
    { icon: FiShield, title: 'Fully Insured', desc: 'All rentals come with comprehensive insurance coverage for your peace of mind.' },
    { icon: FiUsers, title: 'Top Agencies', desc: 'Vetted, professional rental agencies with the best fleet in the market.' },
    { icon: FiAward, title: 'Best Price', desc: 'Transparent daily rates with no hidden fees. What you see is what you pay.' },
    { icon: FiClock, title: '24/7 Support', desc: 'Round-the-clock customer support to assist you whenever you need help.' },
  ];

  return (
    <Box bg="white">
      <LandingNav />

      {/* Hero */}
      <Box minH="85vh" pt="80px" px={{ base: 4, md: 8, lg: 12 }}>
        <Grid
          maxW="1200px"
          mx="auto"
          templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
          gap={{ base: 8, lg: 12 }}
          alignItems="center"
          minH="calc(85vh - 80px)"
        >
          {/* Left */}
          <GridItem>
            <VStack align="start" spacing={6}>
              <Badge
                bg="brand.50"
                color="brand.400"
                borderRadius="full"
                px={4}
                py={1.5}
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Premium Car Rental Platform
              </Badge>

              <Heading
                fontSize={{ base: '3xl', md: '4xl', lg: '5xl', xl: '6xl' }}
                fontWeight="extrabold"
                color="navy.800"
                lineHeight="1.1"
              >
                Find Your{' '}
                <Text as="span" color="brand.400">
                  Perfect
                </Text>{' '}
                Ride
              </Heading>

              <Text fontSize={{ base: 'md', lg: 'lg' }} color="gray.500" maxW="480px" lineHeight="tall">
                Browse hundreds of vehicles from top agencies. Book in minutes, drive with confidence.
                The easiest way to rent a car online.
              </Text>

              <HStack spacing={4} flexWrap="wrap" pt={2}>
                <Button
                  as={NextLink}
                  href="/cars"
                  size="lg"
                  bg="navy.800"
                  color="white"
                  _hover={{ bg: 'navy.700' }}
                  borderRadius="lg"
                  px={8}
                  rightIcon={<FiArrowRight />}
                >
                  Browse Cars
                </Button>
                <Button
                  as={NextLink}
                  href="/register"
                  size="lg"
                  variant="outline"
                  color="navy.800"
                  borderColor="navy.800"
                  _hover={{ bg: 'gray.50' }}
                  borderRadius="lg"
                  px={8}
                >
                  Get Started
                </Button>
              </HStack>

              {/* Stats */}
              <HStack spacing={10} pt={6}>
                {stats.map((s) => (
                  <VStack key={s.label} spacing={0}>
                    <Text fontSize="2xl" fontWeight="bold" color="brand.400">
                      {s.value}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      {s.label}
                    </Text>
                  </VStack>
                ))}
              </HStack>
            </VStack>
          </GridItem>

          {/* Right — car image */}
          <GridItem display={{ base: 'none', lg: 'block' }}>
            <Box position="relative">
              <Box
                borderRadius="3xl"
                overflow="hidden"
                bg="gray.50"
                position="relative"
              >
                <Image
                  src="/img/bthg-signin.png"
                  alt="Premium rental car"
                  w="100%"
                  h={{ lg: '480px', xl: '520px' }}
                  objectFit="cover"
                  borderRadius="3xl"
                />
                {/* Floating price badge */}
                <Box
                  position="absolute"
                  bottom={4}
                  left={4}
                  bg="white"
                  borderRadius="xl"
                  px={4}
                  py={2}
                  boxShadow="lg"
                >
                  <Text fontSize="xs" color="gray.400">
                    Starting from
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="accent.400">
                    $29/day
                  </Text>
                </Box>
                {/* Floating rating badge */}
                <Box
                  position="absolute"
                  top={4}
                  right={4}
                  bg="white"
                  borderRadius="xl"
                  px={3}
                  py={1.5}
                  boxShadow="lg"
                >
                  <Text fontSize="sm" fontWeight="bold" color="navy.800">
                    4.9/5
                  </Text>
                </Box>
              </Box>
            </Box>
          </GridItem>
        </Grid>
      </Box>

      {/* Brand / Agencies bar */}
      <Box bg="gray.50" py={12} px={{ base: 4, md: 8, lg: 12 }}>
        <VStack spacing={6} maxW="1200px" mx="auto">
          <Text fontSize="sm" color="gray.400" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
            Featuring vehicles from
          </Text>
          {agencies.length > 0 ? (
            <HStack spacing={4} flexWrap="wrap" justify="center">
              {agencies.map((agency) => (
                <HStack
                  key={agency.id}
                  bg="white"
                  borderRadius="full"
                  px={4}
                  py={2}
                  spacing={2}
                  border="1px"
                  borderColor="gray.100"
                >
                  <Avatar size="xs" name={agency.name} src={agency.image} bg="brand.400" color="white" />
                  <Text fontSize="sm" fontWeight="medium" color="navy.800">
                    {agency.name}
                  </Text>
                </HStack>
              ))}
            </HStack>
          ) : (
            <HStack spacing={8} flexWrap="wrap" justify="center">
              {['Premium Motors', 'AutoElite', 'DriveMax', 'CarPoint', 'SpeedRent'].map((name) => (
                <Text key={name} fontSize="lg" fontWeight="bold" color="gray.300">
                  {name}
                </Text>
              ))}
            </HStack>
          )}
        </VStack>
      </Box>

      {/* Vehicle Fleet */}
      {cars.length > 0 && (
        <Box bg="white" py={20} px={{ base: 4, md: 8, lg: 12 }}>
          <VStack spacing={10} maxW="1200px" mx="auto">
            <VStack spacing={3} textAlign="center">
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="accent.400"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Our Fleet
              </Text>
              <Heading size="xl" color="navy.800">
                Our Vehicle Fleet
              </Heading>
              <Text color="gray.500" maxW="500px">
                Discover our selection of premium vehicles from trusted agencies
              </Text>
            </VStack>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6} w="full">
              {cars.map((car) => (
                <FeaturedCarCard key={car.id} car={car} />
              ))}
            </SimpleGrid>
            <Button
              as={NextLink}
              href="/cars"
              variant="outline"
              color="navy.800"
              borderColor="navy.800"
              rightIcon={<FiArrowRight />}
              borderRadius="lg"
              size="lg"
              _hover={{ bg: 'gray.50' }}
            >
              View All Cars
            </Button>
          </VStack>
        </Box>
      )}

      {/* Features */}
      <Box bg="gray.50" py={20} px={{ base: 4, md: 8, lg: 12 }}>
        <VStack spacing={12} maxW="1200px" mx="auto">
          <VStack spacing={3} textAlign="center">
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="brand.400"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Why Choose Us
            </Text>
            <Heading size="xl" color="navy.800">
              The Smarter Way to Rent
            </Heading>
          </VStack>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} w="full">
            {features.map((f) => (
              <VStack
                key={f.title}
                p={8}
                bg="white"
                borderRadius="2xl"
                spacing={4}
                align="start"
                border="1px"
                borderColor="gray.100"
                transition="all 0.2s"
                _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
              >
                <Box
                  w={12}
                  h={12}
                  bg="brand.50"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={f.icon} boxSize={6} color="brand.400" />
                </Box>
                <Text fontWeight="bold" fontSize="lg" color="navy.800">
                  {f.title}
                </Text>
                <Text color="gray.500" fontSize="sm" lineHeight="tall">
                  {f.desc}
                </Text>
              </VStack>
            ))}
          </SimpleGrid>
        </VStack>
      </Box>

      {/* Dark CTA Banner */}
      <Box py={16} px={{ base: 4, md: 8, lg: 12 }}>
        <Box
          maxW="1200px"
          mx="auto"
          bg="navy.800"
          borderRadius="3xl"
          py={16}
          px={{ base: 6, md: 12 }}
          textAlign="center"
          position="relative"
          overflow="hidden"
        >
          {/* Decorative elements */}
          <Box
            position="absolute"
            top="-20%"
            right="-5%"
            w="300px"
            h="300px"
            borderRadius="full"
            bg="rgba(201,162,39,0.08)"
          />
          <Box
            position="absolute"
            bottom="-15%"
            left="-5%"
            w="250px"
            h="250px"
            borderRadius="full"
            bg="rgba(27,197,189,0.06)"
          />

          <VStack spacing={6} position="relative">
            <Heading size="xl" color="white">
              Drive with BTHG Today
            </Heading>
            <Text color="whiteAlpha.700" maxW="500px" fontSize="lg">
              Join thousands of happy customers who trust us for their car rental needs.
            </Text>
            <HStack spacing={4} flexWrap="wrap" justify="center" pt={2}>
              <Button
                as={NextLink}
                href="/register"
                size="lg"
                bg="brand.400"
                color="white"
                _hover={{ bg: 'brand.500' }}
                borderRadius="lg"
                px={8}
              >
                Create Free Account
              </Button>
              <Button
                as={NextLink}
                href="/cars"
                size="lg"
                variant="outline"
                color="white"
                borderColor="whiteAlpha.400"
                _hover={{ bg: 'whiteAlpha.100' }}
                borderRadius="lg"
                px={8}
              >
                Browse Cars
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Box>

      {/* Footer */}
      <Box bg="gray.50" py={10} px={{ base: 4, md: 8, lg: 12 }}>
        <Flex maxW="1200px" mx="auto" justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <HStack spacing={3}>
            <Box
              w={8}
              h={8}
              bg="navy.800"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FiTruck} color="brand.400" boxSize={4} />
            </Box>
            <Text fontWeight="bold" color="navy.800">
              BTHG Rental Car
            </Text>
          </HStack>
          <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
            <Text as={NextLink} href="/cars" fontSize="sm" color="gray.500" _hover={{ color: 'navy.800' }}>
              Browse Cars
            </Text>
            <Text as={NextLink} href="/login" fontSize="sm" color="gray.500" _hover={{ color: 'navy.800' }}>
              Sign In
            </Text>
            <Text as={NextLink} href="/register" fontSize="sm" color="gray.500" _hover={{ color: 'navy.800' }}>
              Sign Up
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            &copy; {new Date().getFullYear()} BTHG Rental. All rights reserved.
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

/* ── Root page ── */
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, isInitializing } = useAuthStore();

  useEffect(() => {
    if (isInitializing || isLoading) return;
    if (!isAuthenticated) return;
    if (user?.role === 'superAdmin') {
      router.replace('/super-admin/dashboard');
      return;
    }
    if (user?.role === 'admin') {
      router.replace('/admin/dashboard');
      return;
    }
    // Client role: stay on landing page (don't redirect)
  }, [isAuthenticated, user, isLoading, isInitializing, router]);

  // Show spinner while initializing auth state
  if (isInitializing) {
    return (
      <Center h="100vh" bg="white">
        <Spinner size="xl" color="brand.400" thickness="4px" />
      </Center>
    );
  }

  // Admin/superAdmin authenticated — waiting for redirect
  if (isAuthenticated && (user?.role === 'admin' || user?.role === 'superAdmin')) {
    return (
      <Center h="100vh" bg="white">
        <Spinner size="xl" color="brand.400" thickness="4px" />
      </Center>
    );
  }

  // Show landing page for guests AND authenticated clients
  return <LandingPage />;
}
