'use client';

import { Button, Center, Text, VStack, Icon, useColorModeValue } from '@chakra-ui/react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

/**
 * Renders a real error state instead of letting a failed query fall
 * through and look identical to "no data yet" — pass the `error` from a
 * TanStack Query result (or its `.message`) as `message`.
 */
export function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load this. Please try again.",
  onRetry,
  fullPage = false,
}: ErrorStateProps) {
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const titleColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <Center minH={fullPage ? '100vh' : '40vh'} w="100%">
      <VStack spacing={4} textAlign="center" maxW="sm">
        <Icon as={FiAlertTriangle} boxSize={10} color="red.400" />
        <Text fontWeight="semibold" color={titleColor}>
          {title}
        </Text>
        <Text fontSize="sm" color={textColor}>
          {message}
        </Text>
        {onRetry && (
          <Button size="sm" leftIcon={<FiRefreshCw />} onClick={onRetry} variant="outline">
            Try again
          </Button>
        )}
      </VStack>
    </Center>
  );
}
