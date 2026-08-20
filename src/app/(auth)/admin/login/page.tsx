'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressButton } from '@/components/ui/ProgressButton';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  IconButton,
  Stack,
  Text,
  useToast,
  useColorModeValue,
  Icon,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiEye, FiEyeOff, FiTruck, FiLock, FiMail } from 'react-icons/fi';
import { useAuthStore } from '@/stores/auth.store';
import type { DeactivationErrorResponse } from '@bthgrentalcar/sdk';
import { ApiError } from '@bthgrentalcar/sdk';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/** Extract deactivation error data from an ApiError if present */
function getDeactivationError(error: unknown): DeactivationErrorResponse | null {
  if (error instanceof ApiError && error.originalError) {
    const data = error.originalError.response?.data as Record<string, unknown> | undefined;
    if (data && data.code === 'ACCOUNT_DEACTIVATED') {
      return data as unknown as DeactivationErrorResponse;
    }
  }
  return null;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { loginAdmin, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [deactivatedMessage, setDeactivatedMessage] = useState<string | null>(null);

  const cardBg = useColorModeValue('white', 'navy.700');
  const inputBg = useColorModeValue('gray.50', 'navy.600');
  const textMuted = useColorModeValue('text.muted', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'navy.500');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // Clear any previous deactivation message
    setDeactivatedMessage(null);

    try {
      await loginAdmin(data.email, data.password);
      const user = useAuthStore.getState().user;
      toast({
        title: user?.role === 'superAdmin' ? 'Welcome back, Super Admin!' : 'Welcome back, Admin!',
        status: 'success',
        duration: 3000,
      });
      if (user?.role === 'superAdmin') {
        router.push('/super-admin/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (error) {
      const deactivationError = getDeactivationError(error);

      if (deactivationError) {
        // Admins cannot self-reactivate -- show informational message
        setDeactivatedMessage(
          'Your account has been deactivated. Please contact your Administrator to reactivate.'
        );
        return;
      }

      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Box
      bg={cardBg}
      p={{ base: 6, md: 8 }}
      borderRadius="xl"
      boxShadow="card"
      maxW="420px"
      w="full"
    >
      <VStack spacing={6}>
        {/* Logo and Header */}
        <VStack spacing={3}>
          <Box
            w={14}
            h={14}
            bg="brand.400"
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={FiTruck} color="white" boxSize={7} />
          </Box>
          <VStack spacing={1}>
            <Heading size="lg" color="text.primary">
              Welcome Back
            </Heading>
            <Text color={textMuted} textAlign="center" fontSize="sm">
              Sign in to access the admin portal
            </Text>
          </VStack>
        </VStack>

        {/* Deactivation Alert */}
        {deactivatedMessage && (
          <Alert status="warning" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            <AlertDescription fontSize="sm">{deactivatedMessage}</AlertDescription>
          </Alert>
        )}

        {/* Login Form */}
        <Box as="form" onSubmit={handleSubmit(onSubmit)} w="full">
          <Stack spacing={4}>
            <FormControl isInvalid={!!errors.email}>
              <FormLabel fontWeight="medium" fontSize="sm" color="text.primary">
                Email Address
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" h="full">
                  <Icon as={FiMail} color={textMuted} />
                </InputLeftElement>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  bg={inputBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="lg"
                  h={12}
                  pl={10}
                  _focus={{
                    borderColor: 'brand.400',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                  }}
                  _placeholder={{ color: textMuted }}
                  {...register('email')}
                />
              </InputGroup>
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.password}>
              <FormLabel fontWeight="medium" fontSize="sm" color="text.primary">
                Password
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" h="full">
                  <Icon as={FiLock} color={textMuted} />
                </InputLeftElement>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  bg={inputBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="lg"
                  h={12}
                  pl={10}
                  _focus={{
                    borderColor: 'brand.400',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
                  }}
                  _placeholder={{ color: textMuted }}
                  {...register('password')}
                />
                <InputRightElement h="full" pr={1}>
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    icon={showPassword ? <FiEyeOff /> : <FiEye />}
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    color={textMuted}
                    _hover={{ color: 'brand.400' }}
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>

            <ProgressButton
              type="submit"
              size="lg"
              w="full"
              bg="brand.400"
              color="white"
              borderRadius="lg"
              h={12}
              fontWeight="semibold"
              isLoading={isLoading}
              _hover={{
                bg: 'brand.500',
              }}
              _active={{
                bg: 'brand.600',
              }}
            >
              Sign In
            </ProgressButton>
          </Stack>
        </Box>

        {/* Footer */}
        <VStack spacing={2} pt={2}>
          <Text textAlign="center" fontSize="sm" color={textMuted}>
            This portal is for agency administrators only.
          </Text>
          <HStack spacing={1} fontSize="xs" color={textMuted}>
            <Text>Powered by</Text>
            <Text fontWeight="semibold" color="brand.400">
              BTHG Rental
            </Text>
          </HStack>
        </VStack>
      </VStack>
    </Box>
  );
}
