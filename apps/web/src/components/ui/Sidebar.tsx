'use client';

import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Flex,
  Icon,
  Text,
  VStack,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import {
  FiHome,
  FiTruck,
  FiCalendar,
  FiUser,
  FiUsers,
  FiGrid,
  FiSettings,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';

interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

interface SidebarProps {
  items: NavItem[];
  brandName?: string;
}

export function Sidebar({ items, brandName = 'BTHG Rental' }: SidebarProps) {
  const pathname = usePathname();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="nav"
      pos="fixed"
      left={0}
      top={0}
      h="100vh"
      w="240px"
      bg={bg}
      borderRight="1px"
      borderColor={borderColor}
      py={6}
      display={{ base: 'none', lg: 'block' }}
    >
      {/* Brand */}
      <Flex px={6} mb={8} alignItems="center">
        <Box
          w={10}
          h={10}
          bg="brand.400"
          borderRadius="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mr={3}
        >
          <Icon as={FiTruck} color="white" boxSize={5} />
        </Box>
        <Text fontSize="lg" fontWeight="bold" color="brand.400">
          {brandName}
        </Text>
      </Flex>

      {/* Navigation */}
      <VStack spacing={1} align="stretch" px={3}>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <NavLink key={item.href} item={item} isActive={isActive} />
          );
        })}
      </VStack>
    </Box>
  );
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const activeBg = useColorModeValue('brand.50', 'brand.900');
  const activeColor = useColorModeValue('brand.600', 'brand.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');

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
      color={isActive ? activeColor : textColor}
      fontWeight={isActive ? 'semibold' : 'medium'}
      transition="all 0.2s"
      _hover={{
        bg: isActive ? activeBg : hoverBg,
      }}
    >
      <Icon as={item.icon} boxSize={5} mr={3} />
      <Text>{item.label}</Text>
    </Box>
  );
}

// Predefined navigation configs
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

export const clientNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: FiHome },
  { label: 'Browse Cars', href: '/cars', icon: FiTruck },
  { label: 'My Rentals', href: '/rentals', icon: FiCalendar },
  { label: 'Profile', href: '/profile', icon: FiUser },
];
