'use client';

import {
  Box,
  Heading,
  VStack,
  HStack,
  Avatar,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  useColorModeValue,
  useToast,
  Divider,
  IconButton,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { useState, useRef, useEffect } from 'react';
import { FiCamera, FiX } from 'react-icons/fi';
import { readFileAsDataURL, validateImageFile } from '@/lib/imageUtils';
import { ProgressButton } from '@/components/ui/ProgressButton';

interface ProfileFormData {
  firstname: string;
  name: string;
  image?: string;
}

export default function ProfilePage() {
  const toast = useToast();
  const { user, fetchUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | undefined>(user?.image);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cardBg = useColorModeValue('white', 'navy.700');
  const readOnlyBg = useColorModeValue('gray.50', 'navy.600');
  const subtleTextColor = useColorModeValue('gray.500', 'gray.400');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstname: user?.firstname || '',
      name: user?.name || '',
      image: user?.image || '',
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        firstname: user.firstname || '',
        name: user.name || '',
        image: user.image || '',
      });
      setImagePreview(user.image);
    }
  }, [user, reset]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast({ title: 'Invalid file', description: error, status: 'error', duration: 4000 });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      setValue('image', dataUrl, { shouldDirty: true });
      setImagePreview(dataUrl);
    } catch {
      toast({ title: 'Failed to read file', status: 'error', duration: 3000 });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = () => {
    setImagePreview(undefined);
    setValue('image', '', { shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await api.users.updateProfile(data);
      await fetchUser();
      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to update profile',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={6} color="text.primary">
        Profile
      </Heading>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Profile Card */}
        <Box bg={cardBg} p={6} borderRadius="xl" boxShadow="sm">
          <VStack spacing={4}>
            <Box position="relative">
              <Avatar
                size="2xl"
                name={`${user?.firstname} ${user?.name}`}
                src={imagePreview}
                bg="brand.400"
              />
              <IconButton
                aria-label="Upload photo"
                icon={<FiCamera />}
                size="sm"
                colorScheme="brand"
                borderRadius="full"
                position="absolute"
                bottom={0}
                right={0}
                onClick={() => fileInputRef.current?.click()}
              />
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Box>
            {imagePreview && (
              <Button
                size="xs"
                variant="ghost"
                colorScheme="red"
                leftIcon={<FiX />}
                onClick={handleRemoveImage}
              >
                Remove Photo
              </Button>
            )}
            <Text fontSize="xs" color={subtleTextColor} mt={1}>
              Click the camera icon to upload a profile photo
            </Text>
            <VStack spacing={1}>
              <Text fontWeight="bold" fontSize="xl">
                {user?.firstname} {user?.name}
              </Text>
              <Text color={subtleTextColor}>{user?.email}</Text>
              <Text
                fontSize="sm"
                color="brand.500"
                fontWeight="medium"
                textTransform="capitalize"
              >
                {user?.role === 'superAdmin' ? 'Super Admin' : user?.role}
              </Text>
              {user?.agency && (
                <Text fontSize="sm" color={subtleTextColor}>
                  {user.agency.name}
                </Text>
              )}
            </VStack>
          </VStack>
        </Box>

        {/* Edit Form */}
        <Box
          bg={cardBg}
          p={6}
          borderRadius="xl"
          boxShadow="sm"
          gridColumn={{ lg: 'span 2' }}
        >
          <Heading size="md" mb={6} color="text.primary">
            Edit Profile
          </Heading>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={6} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>First Name</FormLabel>
                  <Input {...register('firstname')} />
                </FormControl>

                <FormControl>
                  <FormLabel>Last Name</FormLabel>
                  <Input {...register('name')} />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input value={user?.email || ''} isReadOnly bg={readOnlyBg} />
              </FormControl>

              <Divider />

              <HStack justify="flex-end">
                <ProgressButton
                  type="submit"
                  colorScheme="brand"
                  isLoading={isLoading}
                  isDisabled={!isDirty}
                >
                  Save Changes
                </ProgressButton>
              </HStack>
            </VStack>
          </form>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
