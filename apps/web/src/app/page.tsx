'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Spinner, VStack, Text } from '@chakra-ui/react';
import { useAuthStore } from '@/stores/auth.store';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/admin/login');
      return;
    }

    // Redirect based on user role
    if (user?.role === 'superAdmin') {
      router.replace('/super-admin/dashboard');
    } else if (user?.role === 'admin') {
      router.replace('/admin/dashboard');
    } else {
      // Client portal not yet available — redirect to login
      router.replace('/login');
    }
  }, [isAuthenticated, user, isLoading, router]);

  return (
    <Center h="100vh">
      <VStack spacing={4}>
        <Spinner size="xl" color="brand.400" thickness="4px" />
        <Text color="gray.500">Loading...</Text>
      </VStack>
    </Center>
  );
}
