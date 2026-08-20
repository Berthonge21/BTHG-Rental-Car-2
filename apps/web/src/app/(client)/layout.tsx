'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Flex,
  HStack,
  Icon,
  Text,
  IconButton,
  Avatar,
  useColorMode,
  useColorModeValue,
  Tooltip,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { FiTruck, FiSearch, FiCalendar, FiUser, FiLogOut, FiSun, FiMoon } from 'react-icons/fi';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

function ClientNav() {
  const pathname = usePathname();
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const bgColor = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.100', 'navy.700');
  const textMuted = useColorModeValue('text.muted', 'gray.400');
  const navPillBg = useColorModeValue('gray.50', 'navy.700');
  const brandTextColor = useColorModeValue('navy.800', 'white');
  const activeBg = 'accent.400';
  const activeColor = 'white';
  const hoverBg = useColorModeValue('gray.100', 'navy.600');
  const textColor = useColorModeValue('text.secondary', 'gray.300');

  const navItems = [
    { label: 'Browse Cars', href: '/cars', icon: FiSearch },
    { label: 'My Rentals', href: '/rentals', icon: FiCalendar },
    { label: 'Profile', href: '/profile', icon: FiUser },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Box
      as="nav"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={100}
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      boxShadow="sm"
      px={{ base: 4, md: 6 }}
      py={3}
    >
      <Flex align="center" justify="space-between" maxW="1400px" mx="auto">
        {/* Brand */}
        <HStack spacing={3} as={NextLink} href="/cars" _hover={{ textDecoration: 'none' }}>
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
          <Text fontSize="lg" fontWeight="bold" color={brandTextColor} display={{ base: 'none', md: 'block' }}>
            BTHG Rental
          </Text>
        </HStack>

        {/* Nav links */}
        <HStack
          spacing={1}
          display={{ base: 'none', md: 'flex' }}
          bg={navPillBg}
          borderRadius="full"
          p={1}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Box
                key={item.href}
                as={NextLink}
                href={item.href}
                display="flex"
                alignItems="center"
                px={4}
                py={2}
                borderRadius="full"
                bg={isActive ? activeBg : 'transparent'}
                color={isActive ? activeColor : textColor}
                fontWeight={isActive ? 'semibold' : 'medium'}
                fontSize="sm"
                transition="all 0.2s"
                _hover={{ bg: isActive ? activeBg : hoverBg, color: isActive ? activeColor : 'text.primary', textDecoration: 'none' }}
              >
                <Icon as={item.icon} boxSize={4} mr={2} />
                <Text>{item.label}</Text>
              </Box>
            );
          })}
        </HStack>

        {/* Right: theme toggle + user */}
        <HStack spacing={2}>
          <Tooltip label={colorMode === 'light' ? 'Dark mode' : 'Light mode'} hasArrow>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              variant="ghost"
              borderRadius="full"
              size="md"
              onClick={toggleColorMode}
            />
          </Tooltip>
          <HStack spacing={2} pl={1}>
            <Avatar
              size="sm"
              name={`${user?.firstname} ${user?.name}`}
              src={user?.image}
              bg="brand.400"
              color="white"
            />
            <Text fontSize="sm" fontWeight="medium" color="text.primary" display={{ base: 'none', md: 'block' }}>
              {user?.firstname}
            </Text>
            <Tooltip label="Logout" hasArrow>
              <IconButton
                aria-label="Logout"
                icon={<FiLogOut />}
                variant="ghost"
                borderRadius="full"
                size="sm"
                color="red.500"
                bg="red.50"
                _hover={{ bg: 'red.100' }}
                onClick={handleLogout}
              />
            </Tooltip>
          </HStack>
        </HStack>
      </Flex>
    </Box>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const bgColor = useColorModeValue('surface.light', 'surface.dark');

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role === 'admin') { router.push('/admin/dashboard'); return; }
    if (user?.role === 'superAdmin') { router.push('/super-admin/dashboard'); }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !isAuthenticated || user?.role === 'admin' || user?.role === 'superAdmin') {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.400" thickness="4px" />
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      <ClientNav />
      <Box as="main" pt="80px" px={{ base: 4, md: 6, lg: 8 }} pb={8} maxW="1400px" mx="auto">
        {children}
      </Box>
    </Box>
  );
}
