'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Stack,
  Text,
  Link,
  SimpleGrid,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiEye, FiEyeOff } from 'react-icons/fi';
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

  const cardBg = useColorModeValue('white', 'gray.800');

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

  return (
    <Box bg={cardBg} p={8} borderRadius="xl" boxShadow="lg">
      <Stack spacing={6}>
        <Box textAlign="center">
          <Heading size="lg" mb={2}>
            Create Account
          </Heading>
          <Text color="gray.500">Sign up to get started</Text>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={!!errors.firstname}>
                <FormLabel>First Name</FormLabel>
                <Input placeholder="John" {...register('firstname')} />
                <FormErrorMessage>{errors.firstname?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.name}>
                <FormLabel>Last Name</FormLabel>
                <Input placeholder="Doe" {...register('name')} />
                <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input type="email" placeholder="john@example.com" {...register('email')} />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={!!errors.password}>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    {...register('password')}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel>Confirm Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    {...register('confirmPassword')}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                      icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={!!errors.telephone}>
                <FormLabel>Phone Number</FormLabel>
                <Input placeholder="+1 234 567 8900" {...register('telephone')} />
                <FormErrorMessage>{errors.telephone?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.numPermis}>
                <FormLabel>Driver License</FormLabel>
                <Input placeholder="License number" {...register('numPermis')} />
                <FormErrorMessage>{errors.numPermis?.message}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <FormControl isInvalid={!!errors.address}>
              <FormLabel>Address</FormLabel>
              <Input placeholder="123 Main St" {...register('address')} />
              <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.city}>
              <FormLabel>City</FormLabel>
              <Input placeholder="New York" {...register('city')} />
              <FormErrorMessage>{errors.city?.message}</FormErrorMessage>
            </FormControl>

            <ProgressButton
              type="submit"
              colorScheme="brand"
              size="lg"
              w="full"
              isLoading={isLoading}
            >
              Create Account
            </ProgressButton>
          </Stack>
        </form>

        <Text textAlign="center" color="gray.500">
          Already have an account?{' '}
          <Link as={NextLink} href="/admin/login" color="brand.400" fontWeight="medium">
            Sign in
          </Link>
        </Text>
      </Stack>
    </Box>
  );
}
