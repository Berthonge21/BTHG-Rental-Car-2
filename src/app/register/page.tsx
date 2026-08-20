'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import NextImage from 'next/image';
import {
  Box,
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
  SimpleGrid,
  Text,
  Link,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiEye, FiEyeOff, FiTruck } from 'react-icons/fi';
import { useAuthStore } from '@/stores/auth.store';
import { ProgressButton } from '@/components/ui/ProgressButton';

const registerSchema = z
  .object({
    firstname: z.string().min(2, 'First name must be at least 2 characters'),
    name: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    telephone: z.string().min(8, 'Phone number is required'),
    numPermis: z.string().min(5, 'Driver license number is required'),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      toast({
        title: 'Account created!',
        description: 'Welcome to BTHG Rental Car',
        status: 'success',
        duration: 3000,
      });
      router.push('/');
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const inputStyles = {
    border: '1px solid',
    borderColor: 'gray.200',
    borderRadius: 'lg',
    h: 12,
    _focus: {
      borderColor: 'navy.800',
      boxShadow: '0 0 0 1px var(--chakra-colors-navy-800)',
    },
    _placeholder: { color: 'gray.400' },
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
        overflowY="auto"
      >
        {/* Logo */}
        <HStack spacing={3} mb={8}>
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
        <Box maxW="500px" w="full">
          <VStack align="start" spacing={2} mb={6}>
            <Heading size="xl" color="navy.800" fontWeight="bold">
              Create Account
            </Heading>
            <Text color="gray.400" fontSize="sm">
              Sign up to get started with BTHG Rental
            </Text>
          </VStack>

          <Box as="form" onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4}>
              {/* First Name / Last Name */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl isInvalid={!!errors.firstname}>
                  <FormLabel fontWeight="medium" fontSize="sm" color="navy.800">
                    First Name
                  </FormLabel>
                  <Input placeholder="John" {...inputStyles} {...register('firstname')} />
                  <FormErrorMessage>{errors.firstname?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.name}>
                  <FormLabel fontWeight="medium" fontSize="sm" color="navy.800">
                    Last Name
                  </FormLabel>
                  <Input placeholder="Doe" {...inputStyles} {...register('name')} />
                  <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              {/* Email */}
              <FormControl isInvalid={!!errors.email}>
                <FormLabel fontWeight="medium" fontSize="sm" color="navy.800">
                  Email
                </FormLabel>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...inputStyles}
                  {...register('email')}
                />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>

              {/* Password / Confirm Password */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl isInvalid={!!errors.password}>
                  <FormLabel fontWeight="medium" fontSize="sm" color="navy.800">
                    Password
                  </FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      {...inputStyles}
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

                <FormControl isInvalid={!!errors.confirmPassword}>
                  <FormLabel fontWeight="medium" fontSize="sm" color="navy.800">
                    Confirm Password
                  </FormLabel>
                  <InputGroup>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      {...inputStyles}
                      {...register('confirmPassword')}
                    />
                    <InputRightElement h="full" pr={1}>
                      <IconButton
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        color="gray.400"
                        _hover={{ color: 'navy.800' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              {/* Phone / Driver License */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl isInvalid={!!errors.telephone}>
                  <FormLabel fontWeight="medium" fontSize="sm" color="navy.800">
                    Phone
                  </FormLabel>
                  <Input placeholder="+1 234 567 8900" {...inputStyles} {...register('telephone')} />
                  <FormErrorMessage>{errors.telephone?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.numPermis}>
                  <FormLabel fontWeight="medium" fontSize="sm" color="navy.800">
                    Driver License
                  </FormLabel>
                  <Input placeholder="License number" {...inputStyles} {...register('numPermis')} />
                  <FormErrorMessage>{errors.numPermis?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              {/* Address */}
              <FormControl isInvalid={!!errors.address}>
                <FormLabel fontWeight="medium" fontSize="sm" color="navy.800">
                  Address
                </FormLabel>
                <Input placeholder="123 Main St" {...inputStyles} {...register('address')} />
                <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
              </FormControl>

              {/* City */}
              <FormControl isInvalid={!!errors.city}>
                <FormLabel fontWeight="medium" fontSize="sm" color="navy.800">
                  City
                </FormLabel>
                <Input placeholder="New York" {...inputStyles} {...register('city')} />
                <FormErrorMessage>{errors.city?.message}</FormErrorMessage>
              </FormControl>

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
                Create Account
              </ProgressButton>
            </VStack>
          </Box>

          <Divider my={6} />

          <Text textAlign="center" fontSize="sm" color="gray.400">
            Already have an account?{' '}
            <Link as={NextLink} href="/login" color="navy.800" fontWeight="semibold">
              Sign In
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
