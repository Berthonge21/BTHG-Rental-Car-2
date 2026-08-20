'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider, ColorModeScript, Center, Spinner } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';
import { theme } from '@/theme';
import { useAuthStore } from '@/stores/auth.store';

function AuthInitializer({ children }: { children: ReactNode }) {
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  useEffect(() => {
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isInitializing) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.400" thickness="4px" />
      </Center>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <QueryClientProvider client={queryClient}>
          <AuthInitializer>{children}</AuthInitializer>
        </QueryClientProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}
