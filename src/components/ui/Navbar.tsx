'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Text,
  useColorMode,
  useColorModeValue,
  Button,
} from '@chakra-ui/react';
import { FiMenu, FiMoon, FiSun, FiLogOut, FiUser, FiBell } from 'react-icons/fi';
import { useAuthStore } from '@/stores/auth.store';

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuthStore();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <Box
      as="header"
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      px={6}
      py={4}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex justify="space-between" align="center">
        {/* Left side */}
        <HStack spacing={4}>
          <IconButton
            aria-label="Open menu"
            icon={<FiMenu />}
            variant="ghost"
            display={{ base: 'flex', lg: 'none' }}
            onClick={onMenuClick}
          />
          <Text fontSize="lg" fontWeight="semibold" display={{ base: 'none', md: 'block' }}>
            Welcome back, {user?.firstname || 'User'}!
          </Text>
        </HStack>

        {/* Right side */}
        <HStack spacing={3}>
          <IconButton
            aria-label="Notifications"
            icon={<FiBell />}
            variant="ghost"
            borderRadius="full"
          />

          <IconButton
            aria-label={colorMode === 'light' ? 'Dark mode' : 'Light mode'}
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            variant="ghost"
            borderRadius="full"
            onClick={toggleColorMode}
          />

          <Menu>
            <MenuButton>
              <Avatar
                size="sm"
                name={`${user?.firstname} ${user?.name}`}
                src={user?.image}
                bg="brand.400"
              />
            </MenuButton>
            <MenuList>
              <Box px={4} py={2}>
                <Text fontWeight="medium">{user?.firstname} {user?.name}</Text>
                <Text fontSize="sm" color="gray.500">{user?.email}</Text>
              </Box>
              <MenuDivider />
              <MenuItem icon={<FiUser />} onClick={() => {
                const profilePath = user?.role === 'superAdmin'
                  ? '/super-admin/profile'
                  : user?.role === 'admin'
                    ? '/admin/profile'
                    : '/profile';
                router.push(profilePath);
              }}>
                Profile
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<FiLogOut />} color="red.500" onClick={handleLogout}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
}
