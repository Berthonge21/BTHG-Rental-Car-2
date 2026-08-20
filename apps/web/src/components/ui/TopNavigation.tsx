'use client';

import { usePathname } from 'next/navigation';
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
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  VStack,
  Tooltip,
  Badge,
} from '@chakra-ui/react';
import {
  FiHome,
  FiTruck,
  FiCalendar,
  FiUser,
  FiUsers,
  FiGrid,
  FiMenu,
  FiSun,
  FiMoon,
  FiBell,
  FiLogOut,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { useAuthStore } from '@/stores/auth.store';

interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

interface TopNavigationProps {
  items: NavItem[];
  brandName?: string;
}

export function TopNavigation({ items, brandName = 'BTHG Rental' }: TopNavigationProps) {
  const pathname = usePathname();
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuthStore();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // All useColorModeValue calls at top of component
  const bgColor = useColorModeValue('white', 'navy.800');
  const borderColor = useColorModeValue('gray.100', 'navy.700');
  const textMuted = useColorModeValue('text.muted', 'gray.400');
  const navPillBg = useColorModeValue('gray.50', 'navy.700');
  const drawerBg = useColorModeValue('white', 'navy.800');
  const brandTextColor = useColorModeValue('navy.800', 'white');

  const handleLogout = () => {
    logout();
    window.location.href = '/admin/login';
  };

  return (
    <>
      {/* Main Top Navigation */}
      <Box
        as="nav"
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
        bg={bgColor}
        borderBottom="1px"
        borderColor={borderColor}
        boxShadow="sm"
        px={{ base: 4, md: 6 }}
        py={3}
      >
        <Flex align="center" justify="space-between" maxW="1600px" mx="auto">
          {/* Left: Brand Logo */}
          <HStack spacing={3}>
            {/* Mobile Menu Button */}
            <IconButton
              aria-label="Open menu"
              icon={<FiMenu />}
              variant="ghost"
              display={{ base: 'flex', lg: 'none' }}
              onClick={onOpen}
            />

            {/* Brand Logo */}
            <HStack spacing={3} as={NextLink} href="/admin/dashboard">
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
                color={brandTextColor}
                display={{ base: 'none', md: 'block' }}
              >
                {brandName}
              </Text>
            </HStack>
          </HStack>

          {/* Center: Navigation Links */}
          <HStack
            spacing={1}
            display={{ base: 'none', lg: 'flex' }}
            position="absolute"
            left="50%"
            transform="translateX(-50%)"
            bg={navPillBg}
            borderRadius="full"
            p={1}
          >
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <NavLink key={item.href} item={item} isActive={isActive} />
              );
            })}
          </HStack>

          {/* Right: Notifications, Theme, User + Logout */}
          <HStack spacing={2}>
            {/* Notifications */}
            <Tooltip label="Notifications" hasArrow>
              <IconButton
                aria-label="Notifications"
                icon={
                  <Box position="relative">
                    <FiBell />
                    <Badge
                      position="absolute"
                      top="-6px"
                      right="-6px"
                      colorScheme="red"
                      variant="solid"
                      borderRadius="full"
                      fontSize="10px"
                      minW={4}
                      h={4}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      3
                    </Badge>
                  </Box>
                }
                variant="ghost"
                borderRadius="full"
                size="md"
              />
            </Tooltip>

            {/* Color Mode Toggle */}
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

            {/* User info + logout icon */}
            <HStack spacing={2} pl={2}>
              <Avatar
                size="sm"
                name={`${user?.firstname} ${user?.name}`}
                src={user?.image}
                bg="brand.400"
                color="white"
              />
              <VStack
                spacing={0}
                alignItems="flex-start"
                display={{ base: 'none', md: 'flex' }}
              >
                <Text fontSize="sm" fontWeight="medium" lineHeight="short" color="text.primary">
                  {user?.firstname} {user?.name}
                </Text>
                <Text fontSize="xs" color={textMuted} lineHeight="short">
                  {user?.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
                </Text>
              </VStack>

              {/* Logout icon -- filled style for prominence */}
              <Tooltip label="Logout" hasArrow>
                <IconButton
                  aria-label="Logout"
                  icon={<FiLogOut />}
                  variant="ghost"
                  borderRadius="full"
                  size="md"
                  bg="red.50"
                  color="red.500"
                  onClick={handleLogout}
                  _hover={{ bg: 'red.100' }}
                />
              </Tooltip>
            </HStack>
          </HStack>
        </Flex>
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg={drawerBg}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
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
              <Text fontWeight="bold" color={brandTextColor}>
                {brandName}
              </Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody p={4}>
            <VStack spacing={1} align="stretch">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <MobileNavLink
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    onClick={onClose}
                  />
                );
              })}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const activeBg = 'accent.400';
  const activeColor = 'white';
  const hoverBg = useColorModeValue('gray.100', 'navy.600');
  const textColor = useColorModeValue('text.secondary', 'gray.300');

  return (
    <Box
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
      _hover={{
        bg: isActive ? activeBg : hoverBg,
        color: isActive ? activeColor : 'text.primary',
      }}
    >
      <Icon as={item.icon} boxSize={4} mr={2} />
      <Text>{item.label}</Text>
    </Box>
  );
}

function MobileNavLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const activeBg = 'accent.400';
  const activeColor = 'white';

  return (
    <Box
      as={NextLink}
      href={item.href}
      display="flex"
      alignItems="center"
      px={4}
      py={3}
      borderRadius="lg"
      bg={isActive ? activeBg : 'transparent'}
      color={isActive ? activeColor : undefined}
      fontWeight={isActive ? 'semibold' : 'medium'}
      onClick={onClick}
      _hover={{ bg: isActive ? activeBg : 'gray.50' }}
    >
      <Icon as={item.icon} boxSize={5} mr={3} />
      <Text>{item.label}</Text>
    </Box>
  );
}

// Navigation configs
export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: FiHome },
  { label: 'Cars', href: '/admin/cars', icon: FiTruck },
  { label: 'Rentals', href: '/admin/rentals', icon: FiCalendar },
  { label: 'Profile', href: '/admin/profile', icon: FiUser },
];

export const superAdminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/super-admin/dashboard', icon: FiHome },
  { label: 'Agencies', href: '/super-admin/agencies', icon: FiGrid },
  { label: 'Admins', href: '/super-admin/admins', icon: FiUsers },
  { label: 'Rentals', href: '/super-admin/rentals', icon: FiCalendar },
  { label: 'Profile', href: '/super-admin/profile', icon: FiUser },
];
