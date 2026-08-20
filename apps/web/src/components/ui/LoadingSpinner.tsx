'use client';

import { useState, useEffect } from 'react';
import { Box, Center, Text, VStack, Icon, useColorModeValue } from '@chakra-ui/react';
import { FiTruck } from 'react-icons/fi';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullPage?: boolean;
}

export function LoadingSpinner({
  text = 'Loading...',
  size = 'lg',
  fullPage = false,
}: LoadingSpinnerProps) {
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const barTrackBg = useColorModeValue('gray.100', 'navy.600');

  return (
    <>
      <style>{`
        @keyframes carDrive {
          0%, 100% {
            transform: translateX(-8px) translateY(0px);
          }
          25% {
            transform: translateX(8px) translateY(-3px);
          }
          50% {
            transform: translateX(-4px) translateY(0px);
          }
          75% {
            transform: translateX(6px) translateY(-2px);
          }
        }
        @keyframes progressBar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
      <Center minH={fullPage ? '100vh' : '60vh'} w="100%">
        <VStack spacing={5}>
          {/* Animated car icon */}
          <Box
            style={{
              animation: 'carDrive 1.8s ease-in-out infinite',
            }}
          >
            <Icon
              as={FiTruck}
              boxSize={size === 'sm' ? 8 : size === 'md' ? 10 : size === 'xl' ? 14 : 12}
              color="brand.400"
            />
          </Box>

          {/* Progress bar */}
          <Box
            w="120px"
            h="3px"
            borderRadius="full"
            bg={barTrackBg}
            overflow="hidden"
            position="relative"
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              w="50%"
              h="100%"
              borderRadius="full"
              bg="brand.400"
              style={{
                animation: 'progressBar 1.4s ease-in-out infinite',
              }}
            />
          </Box>

          {/* Loading text */}
          {text && (
            <Text fontSize="sm" color={textColor} fontWeight="medium">
              {text}
            </Text>
          )}
        </VStack>
      </Center>
    </>
  );
}

/**
 * Ensures a loading state is shown for at least `minMs` milliseconds.
 *
 * When `isLoading` transitions from true to false the hook keeps
 * returning true until `minMs` has elapsed since mount, preventing
 * the loading spinner from flashing away too quickly on fast/cached loads.
 *
 * MUST be called unconditionally at the top of a component (React hooks rules).
 */
export function useMinLoading(isLoading: boolean, minMs = 1200): boolean {
  const [showMin, setShowMin] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowMin(false), minMs);
      return () => clearTimeout(timer);
    } else {
      setShowMin(true);
    }
  }, [isLoading, minMs]);

  return isLoading || showMin;
}
