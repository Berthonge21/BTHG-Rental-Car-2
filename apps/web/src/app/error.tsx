'use client';

import { useEffect } from 'react';
import { Button, Center, Heading, Text, VStack, Icon, useColorModeValue } from '@chakra-ui/react';
import { FiAlertOctagon } from 'react-icons/fi';

// Next.js route-level error boundary — catches any uncaught render error
// in a descendant page/layout and shows this instead of a blank screen or
// the framework's own crash overlay. `reset()` re-renders the segment
// without a full page reload.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const textColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <Center minH="100vh" w="100%" p={6}>
      <VStack spacing={5} textAlign="center" maxW="md">
        <Icon as={FiAlertOctagon} boxSize={12} color="red.400" />
        <Heading size="md">Something went wrong</Heading>
        <Text fontSize="sm" color={textColor}>
          An unexpected error occurred while rendering this page. You can try again, or head back
          to the dashboard.
        </Text>
        <Button colorScheme="red" variant="outline" onClick={() => reset()}>
          Try again
        </Button>
      </VStack>
    </Center>
  );
}
