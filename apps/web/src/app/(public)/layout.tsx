'use client';

import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Text,
  Avatar,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FiTruck, FiSearch, FiCalendar, FiUser, FiLogOut } from 'react-icons/fi';
import { useAuthStore } from '@/stores/auth.store';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const clientNavItems = [
    { label: 'Browse Cars', href: '/cars', icon: FiSearch },
    { label: 'My Rentals', href: '/rentals', icon: FiCalendar },
    { label: 'Profile', href: '/profile', icon: FiUser },
  ];

  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';

  return (
    <Box minH="100vh" bg="white">
      {/* Nav */}
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
        <Flex align="center" justify="space-between" maxW="1400px" mx="auto">
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
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="navy.800"
              display={{ base: 'none', md: 'block' }}
            >
              BTHG Rental
            </Text>
          </HStack>

          {/* Center nav — only for authenticated clients */}
          {isAuthenticated && user && !isAdmin && (
            <HStack
              spacing={1}
              display={{ base: 'none', md: 'flex' }}
              bg="gray.50"
              borderRadius="full"
              p={1}
            >
              {clientNavItems.map((item) => {
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
                    bg={isActive ? 'accent.400' : 'transparent'}
                    color={isActive ? 'white' : 'gray.600'}
                    fontWeight={isActive ? 'semibold' : 'medium'}
                    fontSize="sm"
                    transition="all 0.2s"
                    _hover={{
                      bg: isActive ? 'accent.400' : 'gray.100',
                      color: isActive ? 'white' : 'navy.800',
                      textDecoration: 'none',
                    }}
                  >
                    <Icon as={item.icon} boxSize={4} mr={2} />
                    <Text>{item.label}</Text>
                  </Box>
                );
              })}
            </HStack>
          )}

          {/* Right side */}
          {isAuthenticated && user ? (
            isAdmin ? (
              <Button
                as={NextLink}
                href={user.role === 'superAdmin' ? '/super-admin/dashboard' : '/admin/dashboard'}
                bg="navy.800"
                color="white"
                size="sm"
                borderRadius="lg"
                _hover={{ bg: 'navy.700' }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <HStack spacing={2}>
                <Avatar
                  size="sm"
                  name={`${user.firstname} ${user.name}`}
                  src={user.image}
                  bg="brand.400"
                  color="white"
                />
                <Text
                  fontSize="sm"
                  fontWeight="medium"
                  color="navy.800"
                  display={{ base: 'none', lg: 'block' }}
                >
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
            )
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

      {/* Main content */}
      <Box as="main" pt="72px" px={{ base: 4, md: 6, lg: 8 }} pb={8} maxW="1400px" mx="auto">
        {children}
      </Box>
    </Box>
  );
}
