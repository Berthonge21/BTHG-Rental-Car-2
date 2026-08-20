'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import NextImage from 'next/image';
import { ProgressButton } from '@/components/ui/ProgressButton';
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Text,
  Link,
  useToast,
  VStack,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiEye, FiEyeOff, FiTruck, FiRefreshCw } from 'react-icons/fi';
import { useAuthStore } from '@/stores/auth.store';
import type { DeactivationErrorResponse } from '@bthgrentalcar/sdk';
import { ApiError } from '@bthgrentalcar/sdk';
import { Suspense } from 'react';

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

interface DeactivationState {
  message: string;
  canReactivate: boolean;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { login, reactivateAccount, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [deactivation, setDeactivation] = useState<DeactivationState | null>(null);

  const redirectTo = searchParams.get('redirect') || '/';

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setDeactivation(null);

    try {
      await login(data.email, data.password);
      toast({
        title: 'Welcome back!',
        status: 'success',
        duration: 3000,
      });
      router.push(redirectTo);
    } catch (error) {
      const deactivationError = getDeactivationError(error);

      if (deactivationError) {
        if (deactivationError.selfDeactivated) {
          setDeactivation({
            message:
              'Your account has been deactivated. You can reactivate it by clicking the button below.',
            canReactivate: true,
          });
        } else {
          setDeactivation({
            message:
              'Your account has been deactivated by an administrator. Please contact support for assistance.',
            canReactivate: false,
          });
        }
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

  const handleReactivate = async () => {
    const { email, password } = getValues();
    setIsReactivating(true);

    try {
      await reactivateAccount(email, password);
      toast({
        title: 'Account reactivated',
        description: 'Welcome back! Your account has been successfully reactivated.',
        status: 'success',
        duration: 4000,
      });
      setDeactivation(null);
      router.push(redirectTo);
    } catch (error) {
      toast({
        title: 'Reactivation failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsReactivating(false);
    }
  };

  return (
    <Flex minH="100vh">
      {/* Left column — white card */}
      <Flex
        w={{ base: '100%', lg: '45%' }}
        bg="white"
        direction="column"
        justify="center"
        px={{ base: 6, md: 12, lg: 16 }}
        py={12}
      >
        {/* Logo */}
        <HStack spacing={3} mb={12}>
          <Box
            w={10}
            h={10}
            bg="navy.800"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={FiTruck} color="brand.400" boxSize={5} />
          </Box>
          <Text fontSize="lg" fontWeight="bold" color="navy.800">
            BTHG Rental
          </Text>
        </HStack>

        {/* Form area */}
        <Box maxW="400px" w="full">
          <VStack align="start" spacing={2} mb={8}>
            <Heading size="xl" color="navy.800" fontWeight="bold">
              Welcome Back
            </Heading>
            <Text color="gray.400" fontSize="sm">
              Please enter your details
            </Text>
          </VStack>

          {/* Deactivation Alert */}
          {deactivation && (
            <Alert
              status={deactivation.canReactivate ? 'warning' : 'error'}
              borderRadius="lg"
              variant="left-accent"
              flexDirection="column"
              alignItems="flex-start"
              mb={6}
            >
              <HStack mb={deactivation.canReactivate ? 2 : 0}>
                <AlertIcon />
                <AlertDescription fontSize="sm">{deactivation.message}</AlertDescription>
              </HStack>
              {deactivation.canReactivate && (
                <Button
                  size="sm"
                  colorScheme="brand"
                  leftIcon={<FiRefreshCw />}
                  onClick={handleReactivate}
                  isLoading={isReactivating}
                  loadingText="Reactivating..."
                  ml={8}
                >
                  Reactivate Account
                </Button>
              )}
            </Alert>
          )}

          <Box as="form" onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={5}>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel fontWeight="medium" fontSize="sm" color="navy.800">
                  Email
                </FormLabel>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="lg"
                  h={12}
                  _focus={{
                    borderColor: 'navy.800',
                    boxShadow: '0 0 0 1px var(--chakra-colors-navy-800)',
                  }}
                  _placeholder={{ color: 'gray.400' }}
                  {...register('email')}
                />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel fontWeight="medium" fontSize="sm" color="navy.800">
                  Password
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="lg"
                    h={12}
                    _focus={{
                      borderColor: 'navy.800',
                      boxShadow: '0 0 0 1px var(--chakra-colors-navy-800)',
                    }}
                    _placeholder={{ color: 'gray.400' }}
                    {...register('password')}
                  />
                  <InputRightElement h="full" pr={1}>
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      color="gray.400"
                      _hover={{ color: 'navy.800' }}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <Flex w="full" justify="flex-end">
                <Text fontSize="xs" color="gray.400" cursor="pointer" _hover={{ color: 'navy.800' }}>
                  Forgot password?
                </Text>
              </Flex>

              <ProgressButton
                type="submit"
                size="lg"
                w="full"
                bg="navy.800"
                color="white"
                borderRadius="lg"
                h={12}
                fontWeight="semibold"
                isLoading={isLoading}
                _hover={{ bg: 'navy.700' }}
                _active={{ bg: 'navy.900' }}
              >
                Sign In
              </ProgressButton>
            </VStack>
          </Box>

          <Divider my={6} />

          <Text textAlign="center" fontSize="sm" color="gray.400">
            Are you new?{' '}
            <Link as={NextLink} href="/register" color="navy.800" fontWeight="semibold">
              Create an Account
            </Link>
          </Text>
        </Box>
      </Flex>

      {/* Right column — car image */}
      <Box
        flex={1}
        display={{ base: 'none', lg: 'flex' }}
        position="relative"
        overflow="hidden"
      >
        <NextImage
          src="/img/bthg-signin.png"
          alt="Premium rental car"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </Box>
    </Flex>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
