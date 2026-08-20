'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Button,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Select,
  SimpleGrid,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useCreateAdminUser } from '@/hooks';
import { ProgressButton } from '@/components/ui/ProgressButton';
import { UserRole } from '@bthgrentalcar/sdk';

const adminSchema = z.object({
  firstname: z.string().min(2, 'First name is required'),
  name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'superAdmin']),
});

type AdminFormData = z.infer<typeof adminSchema>;

export default function NewAdminPage() {
  const router = useRouter();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const cardBg = useColorModeValue('white', 'gray.800');
  const createMutation = useCreateAdminUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      role: 'admin',
    },
  });

  const onSubmit = async (data: AdminFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        role: data.role as UserRole,
      });
      toast({
        title: 'Admin created',
        description: 'The admin user has been created successfully',
        status: 'success',
        duration: 3000,
      });
      router.push('/super-admin/admins');
    } catch (error) {
      toast({
        title: 'Failed to create admin',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <Box>
      <HStack mb={6}>
        <Button
          variant="ghost"
          leftIcon={<FiArrowLeft />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        <Heading size="lg">Create Admin User</Heading>
      </HStack>

      <Box bg={cardBg} p={6} borderRadius="xl" boxShadow="sm">
        <form onSubmit={handleSubmit(onSubmit)}>
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
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input type="email" placeholder="admin@example.com" {...register('email')} />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.password}>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" {...register('password')} />
                <InputRightElement>
                  <IconButton aria-label={showPassword ? 'Hide password' : 'Show password'} icon={showPassword ? <FiEyeOff /> : <FiEye />} variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.role} gridColumn={{ md: 'span 2' }}>
              <FormLabel>Role</FormLabel>
              <Select {...register('role')}>
                <option value="admin">Admin</option>
                <option value="superAdmin">Super Admin</option>
              </Select>
              <FormErrorMessage>{errors.role?.message}</FormErrorMessage>
            </FormControl>
          </SimpleGrid>
          <ProgressButton type="submit" colorScheme="brand" size="lg" isLoading={createMutation.isPending} w="full" mt={4}>
            Create Admin
          </ProgressButton>
        </form>
      </Box>
    </Box>
  );
}
