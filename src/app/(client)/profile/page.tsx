'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert, AlertDescription, AlertIcon, Avatar, Box, Button, Divider,
  FormControl, FormLabel, HStack, Heading, IconButton, Input,
  SimpleGrid, Text, VStack, useColorModeValue, useDisclosure, useToast,
} from '@chakra-ui/react';
import { FiCamera, FiX, FiAlertTriangle } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { ProgressButton } from '@/components/ui/ProgressButton';
import { ConfirmDialog } from '@/components/ui';
import { readFileAsDataURL, validateImageFile } from '@/lib/imageUtils';

interface ProfileFormData {
  firstname: string;
  name: string;
  telephone: string;
  address: string;
  city: string;
  image?: string;
}

export default function ClientProfilePage() {
  const toast = useToast();
  const router = useRouter();
  const { user, fetchUser, deactivateAccount } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | undefined>(user?.image);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deactivateDialog = useDisclosure();

  const cardBg = useColorModeValue('white', 'navy.700');
  const cardBorder = useColorModeValue('gray.100', 'navy.600');
  const textMuted = useColorModeValue('text.muted', 'gray.400');
  const dangerBg = useColorModeValue('red.50', 'rgba(254, 178, 178, 0.06)');
  const dangerBorder = useColorModeValue('red.200', 'red.800');

  const { register, handleSubmit, reset, setValue, formState: { isDirty } } = useForm<ProfileFormData>({
    defaultValues: {
      firstname: user?.firstname ?? '',
      name: user?.name ?? '',
      telephone: user?.telephone ?? '',
      address: user?.address ?? '',
      city: user?.city ?? '',
      image: user?.image ?? '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstname: user.firstname ?? '',
        name: user.name ?? '',
        telephone: user.telephone ?? '',
        address: user.address ?? '',
        city: user.city ?? '',
        image: user.image ?? '',
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      await api.users.updateProfile(data);
      await fetchUser();
      toast({ title: 'Profile updated', status: 'success', duration: 3000 });
    } catch (err) {
      toast({ title: 'Failed to update profile', description: err instanceof Error ? err.message : 'An error occurred', status: 'error', duration: 5000 });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await deactivateAccount();
      toast({ title: 'Account deactivated', description: 'You have been logged out.', status: 'info', duration: 5000 });
      router.push('/login');
    } catch (err) {
      toast({ title: 'Failed to deactivate', description: err instanceof Error ? err.message : 'An error occurred', status: 'error', duration: 5000 });
    } finally {
      setIsDeactivating(false);
      deactivateDialog.onClose();
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>My Profile</Heading>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Avatar card */}
        <Box bg={cardBg} border="1px" borderColor={cardBorder} borderRadius="2xl" p={6}>
          <VStack spacing={4}>
            <Box position="relative">
              <Avatar size="2xl" name={`${user?.firstname} ${user?.name}`} src={imagePreview} bg="brand.400" />
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
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
            </Box>
            {imagePreview && (
              <Button size="xs" variant="ghost" colorScheme="red" leftIcon={<FiX />} onClick={handleRemoveImage}>
                Remove Photo
              </Button>
            )}
            <Text fontSize="xs" color={textMuted}>Click the camera icon to update your photo</Text>
            <VStack spacing={1}>
              <Text fontWeight="bold" fontSize="xl">{user?.firstname} {user?.name}</Text>
              <Text color={textMuted} fontSize="sm">{user?.email}</Text>
            </VStack>
          </VStack>
        </Box>

        {/* Edit form */}
        <Box bg={cardBg} border="1px" borderColor={cardBorder} borderRadius="2xl" p={6} gridColumn={{ lg: 'span 2' }}>
          <Heading size="md" mb={6}>Edit Profile</Heading>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">First Name</FormLabel>
                  <Input {...register('firstname')} borderRadius="lg" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Last Name</FormLabel>
                  <Input {...register('name')} borderRadius="lg" />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel fontSize="sm">Email</FormLabel>
                <Input value={user?.email ?? ''} isReadOnly bg={useColorModeValue('gray.50', 'navy.600')} borderRadius="lg" />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Phone</FormLabel>
                <Input {...register('telephone')} borderRadius="lg" type="tel" />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Address</FormLabel>
                  <Input {...register('address')} borderRadius="lg" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">City</FormLabel>
                  <Input {...register('city')} borderRadius="lg" />
                </FormControl>
              </SimpleGrid>
              <Divider />
              <HStack justify="flex-end">
                <ProgressButton type="submit" colorScheme="brand" isLoading={isSaving} isDisabled={!isDirty}>
                  Save Changes
                </ProgressButton>
              </HStack>
            </VStack>
          </form>
        </Box>
      </SimpleGrid>

      {/* Danger Zone */}
      <Box mt={8} p={6} bg={dangerBg} borderRadius="2xl" border="1px solid" borderColor={dangerBorder}>
        <HStack spacing={3} mb={3}>
          <Box color="red.500"><FiAlertTriangle size={20} /></Box>
          <Heading size="md" color="red.500">Danger Zone</Heading>
        </HStack>
        <Text color={textMuted} fontSize="sm" mb={4}>
          Deactivating your account will log you out. You can reactivate it yourself at any time from the login page.
        </Text>
        <Button colorScheme="red" variant="outline" leftIcon={<FiAlertTriangle />} onClick={deactivateDialog.onOpen}>
          Deactivate My Account
        </Button>
      </Box>

      <ConfirmDialog
        isOpen={deactivateDialog.isOpen}
        onClose={deactivateDialog.onClose}
        onConfirm={handleDeactivate}
        title="Deactivate Account"
        message="Are you sure you want to deactivate your account? You will be logged out, but you can reactivate your account at any time from the login page."
        confirmText="Deactivate"
        cancelText="Cancel"
        isLoading={isDeactivating}
        colorScheme="red"
      />
    </Box>
  );
}
