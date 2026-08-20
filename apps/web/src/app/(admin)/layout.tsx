'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { useAuthStore } from '@/stores/auth.store';
import { TopNavigation, adminNavItems } from '@/components/ui/TopNavigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  const bgColor = useColorModeValue('surface.light', 'surface.dark');

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    if (user?.role !== 'admin' && user?.role !== 'superAdmin') {
      router.push('/login');
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !isAuthenticated || (user?.role !== 'admin' && user?.role !== 'superAdmin')) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Top Navigation */}
      <TopNavigation items={adminNavItems} />

      {/* Main content with top padding for fixed nav */}
      <Box
        as="main"
        pt="80px"
        px={{ base: 4, md: 6, lg: 8 }}
        pb={8}
        maxW="1600px"
        mx="auto"
      >
        {children}
      </Box>
    </Box>
  );
}
