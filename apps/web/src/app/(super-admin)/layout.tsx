'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { useAuthStore } from '@/stores/auth.store';
import { TopNavigation, superAdminNavItems } from '@/components/ui/TopNavigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  const bgColor = useColorModeValue('surface.light', 'surface.dark');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    if (user?.role !== 'superAdmin') {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, user, isLoading, mounted, router]);

  if (!mounted || isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (!isAuthenticated || user?.role !== 'superAdmin') {
    return <LoadingSpinner fullPage />;
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Top Navigation */}
      <TopNavigation items={superAdminNavItems} brandName="BTHG Admin" />

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
