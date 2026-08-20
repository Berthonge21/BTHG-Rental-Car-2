'use client';

import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Select,
  SimpleGrid,
  Stack,
  useColorModeValue,
  Text,
  Image,
  VStack,
  IconButton,
  Icon,
  useToast,
  Center,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCallback, useRef, useState, useEffect } from 'react';
import { FiUploadCloud, FiX, FiPlus } from 'react-icons/fi';
import type { Car, Agency } from '@bthgrentalcar/sdk';
import { ProgressButton } from '@/components/ui/ProgressButton';
import {
  parseCarImages,
  serializeCarImages,
  validateImageFile,
  readFileAsDataURL,
  MAX_IMAGES,
} from '@/lib/imageUtils';

const THUMBNAIL_SLOTS = 4;

const baseCarSchema = z.object({
  brand: z.string().min(1, 'Brand is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.coerce.number().min(1900, 'Invalid year').max(new Date().getFullYear() + 1),
  mileage: z.coerce.number().min(0, 'Mileage must be positive'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  registration: z.string().min(1, 'Registration is required').max(20),
  fuel: z.string().min(1, 'Fuel type is required'),
  door: z.coerce.number().min(1, 'Number of doors is required'),
  gearBox: z.string().min(1, 'Gearbox type is required'),
  description: z.string().max(300).optional(),
  image: z.string().optional(),
  agencyId: z.coerce.number().optional(),
});

type CarFormData = z.infer<typeof baseCarSchema>;

interface CarFormProps {
  initialData?: Partial<Car>;
  onSubmit: (data: CarFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  isSuperAdmin?: boolean;
  agencies?: Agency[];
  agenciesLoading?: boolean;
}

const fuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'LPG'];
const gearboxTypes = ['Automatic', 'Manual', 'Semi-automatic'];

export function CarForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
  isSuperAdmin = false,
  agencies = [],
  agenciesLoading = false,
}: CarFormProps) {
  // -- colour-mode values (must be called unconditionally at the top) --------
  const cardBg = useColorModeValue('white', 'gray.800');
  const dropzoneBg = useColorModeValue('gray.50', 'navy.800');
  const dropzoneBorder = useColorModeValue('gray.300', 'navy.600');
  const dropzoneHoverBorder = useColorModeValue('brand.400', 'brand.400');
  const dropzoneText = useColorModeValue('gray.500', 'gray.400');
  const thumbBorder = useColorModeValue('gray.200', 'navy.600');
  const thumbEmptyBg = useColorModeValue('gray.50', 'navy.800');
  const thumbEmptyBorder = useColorModeValue('gray.300', 'navy.600');
  const thumbEmptyIconColor = useColorModeValue('gray.400', 'gray.500');
  const activeBorder = useColorModeValue('brand.400', 'brand.400');
  const countColor = useColorModeValue('gray.600', 'gray.400');
  const previewBg = useColorModeValue('gray.100', 'navy.700');
  const galleryLabelColor = useColorModeValue('gray.700', 'gray.300');

  // -- toast ----------------------------------------------------------------
  const toast = useToast();

  // -- images state ----------------------------------------------------------
  const [images, setImages] = useState<string[]>(() =>
    parseCarImages(initialData?.image),
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- form -----------------------------------------------------------------
  const carSchema =
    isSuperAdmin && !initialData?.agencyId
      ? baseCarSchema.refine((data) => data.agencyId && data.agencyId > 0, {
          message: 'Please select an agency',
          path: ['agencyId'],
        })
      : baseCarSchema;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      year: initialData?.year || new Date().getFullYear(),
      mileage: initialData?.mileage || 0,
      price: initialData?.price || 0,
      registration: initialData?.registration || '',
      fuel: initialData?.fuel || '',
      door: initialData?.door || 4,
      gearBox: initialData?.gearBox || '',
      description: initialData?.description || '',
      image: initialData?.image || '',
      agencyId: initialData?.agencyId,
    },
  });

  // Keep the hidden `image` field in sync with the images array.
  useEffect(() => {
    setValue('image', serializeCarImages(images));
  }, [images, setValue]);

  // Keep selectedIndex in bounds when images are removed
  useEffect(() => {
    if (selectedIndex >= images.length && images.length > 0) {
      setSelectedIndex(images.length - 1);
    } else if (images.length === 0) {
      setSelectedIndex(0);
    }
  }, [images.length, selectedIndex]);

  // -- file processing ------------------------------------------------------
  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = MAX_IMAGES - images.length;

      if (remaining <= 0) {
        toast({
          title: 'Limit reached',
          description: `You can upload a maximum of ${MAX_IMAGES} images.`,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const filesToProcess = fileArray.slice(0, remaining);

      const results: string[] = [];

      for (const file of filesToProcess) {
        const error = validateImageFile(file);
        if (error) {
          toast({
            title: 'Invalid file',
            description: error,
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
          continue;
        }

        try {
          const dataURL = await readFileAsDataURL(file);
          results.push(dataURL);
        } catch {
          toast({
            title: 'Upload error',
            description: `Failed to read "${file.name}".`,
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
        }
      }

      if (results.length > 0) {
        setImages((prev) => {
          const updated = [...prev, ...results];
          // Auto-select the first newly added image
          setSelectedIndex(prev.length);
          return updated;
        });
      }
    },
    [images.length, toast],
  );

  const removeImage = useCallback(
    (index: number) => {
      setImages((prev) => prev.filter((_, i) => i !== index));
    },
    [],
  );

  // -- drag & drop handlers -------------------------------------------------
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      // Reset so re-selecting the same file triggers onChange again
      e.target.value = '';
    },
    [processFiles],
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // -- active agencies ------------------------------------------------------
  const activeAgencies = agencies.filter((a) => a.status === 'activate');

  // -- determine the image shown in the big preview -------------------------
  const previewImage = images.length > 0 ? images[selectedIndex] ?? images[0] : null;

  return (
    <Box bg={cardBg} p={6} borderRadius="xl" boxShadow="sm">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Hidden RHF field -- keeps the serialised JSON in the form data */}
        <input type="hidden" {...register('image')} />

        <Flex
          direction={{ base: 'column', lg: 'row' }}
          gap={8}
        >
          {/* ================================================================
              LEFT COLUMN: Image Gallery
              ================================================================ */}
          <Box
            w={{ base: '100%', lg: '40%' }}
            flexShrink={0}
          >
            <Text fontWeight="600" fontSize="sm" color={galleryLabelColor} mb={3}>
              Car Images{' '}
              <Text as="span" fontWeight="normal" color={countColor}>
                ({images.length}/{MAX_IMAGES})
              </Text>
            </Text>

            {/* -- Big Preview Area ----------------------------------------- */}
            <Box
              position="relative"
              w="100%"
              h="300px"
              borderRadius="xl"
              overflow="hidden"
              bg={previewImage ? 'transparent' : dropzoneBg}
              borderWidth="2px"
              borderStyle={previewImage ? 'solid' : 'dashed'}
              borderColor={
                isDragging
                  ? dropzoneHoverBorder
                  : previewImage
                    ? thumbBorder
                    : dropzoneBorder
              }
              cursor={previewImage && images.length >= MAX_IMAGES ? 'default' : 'pointer'}
              onClick={previewImage && images.length >= MAX_IMAGES ? undefined : triggerFileInput}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              transition="all 0.2s"
              _hover={
                previewImage && images.length >= MAX_IMAGES
                  ? {}
                  : { borderColor: dropzoneHoverBorder }
              }
              role={previewImage && images.length >= MAX_IMAGES ? undefined : 'button'}
              tabIndex={previewImage && images.length >= MAX_IMAGES ? undefined : 0}
              aria-label={previewImage ? 'Upload more images' : 'Upload images'}
              onKeyDown={(e) => {
                if (
                  (e.key === 'Enter' || e.key === ' ') &&
                  !(previewImage && images.length >= MAX_IMAGES)
                ) {
                  e.preventDefault();
                  triggerFileInput();
                }
              }}
            >
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt={`Car preview image ${selectedIndex + 1}`}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
              ) : (
                <Center h="100%">
                  <VStack spacing={3}>
                    <Icon
                      as={FiUploadCloud}
                      boxSize={12}
                      color="brand.400"
                    />
                    <Text fontSize="md" fontWeight="500" color={dropzoneText}>
                      Drag &amp; drop or click to upload
                    </Text>
                    <Text fontSize="xs" color={dropzoneText}>
                      JPEG, PNG or WebP -- max 2 MB per file
                    </Text>
                  </VStack>
                </Center>
              )}
            </Box>

            {/* -- Thumbnail Slots ------------------------------------------ */}
            <SimpleGrid columns={4} spacing={3} mt={3}>
              {Array.from({ length: THUMBNAIL_SLOTS }).map((_, slotIndex) => {
                const hasImage = slotIndex < images.length;
                const isSelected = hasImage && slotIndex === selectedIndex;

                if (hasImage) {
                  // Filled thumbnail slot
                  return (
                    <Box
                      key={slotIndex}
                      position="relative"
                      w="100%"
                      pt="100%" // 1:1 aspect ratio
                      borderRadius="lg"
                      overflow="hidden"
                      border="2px solid"
                      borderColor={isSelected ? activeBorder : thumbBorder}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ borderColor: activeBorder }}
                      onClick={() => setSelectedIndex(slotIndex)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select image ${slotIndex + 1}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedIndex(slotIndex);
                        }
                      }}
                    >
                      <Image
                        src={images[slotIndex]}
                        alt={`Car thumbnail ${slotIndex + 1}`}
                        position="absolute"
                        top={0}
                        left={0}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                      />
                      <IconButton
                        aria-label={`Remove image ${slotIndex + 1}`}
                        icon={<FiX />}
                        size="xs"
                        borderRadius="full"
                        position="absolute"
                        top={1}
                        right={1}
                        bg="blackAlpha.600"
                        color="white"
                        _hover={{ bg: 'red.500' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(slotIndex);
                        }}
                        zIndex={1}
                      />
                    </Box>
                  );
                }

                // Empty thumbnail slot -- acts as upload trigger
                return (
                  <Box
                    key={slotIndex}
                    position="relative"
                    w="100%"
                    pt="100%" // 1:1 aspect ratio
                    borderRadius="lg"
                    overflow="hidden"
                    border="2px dashed"
                    borderColor={thumbEmptyBorder}
                    bg={thumbEmptyBg}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ borderColor: dropzoneHoverBorder, bg: previewBg }}
                    onClick={triggerFileInput}
                    role="button"
                    tabIndex={0}
                    aria-label={`Upload image to slot ${slotIndex + 1}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        triggerFileInput();
                      }
                    }}
                  >
                    <Center
                      position="absolute"
                      top={0}
                      left={0}
                      w="100%"
                      h="100%"
                    >
                      <Icon
                        as={FiPlus}
                        boxSize={5}
                        color={thumbEmptyIconColor}
                      />
                    </Center>
                  </Box>
                );
              })}
            </SimpleGrid>

            <FormControl isInvalid={!!errors.image} mt={1}>
              <FormErrorMessage>{errors.image?.message}</FormErrorMessage>
            </FormControl>
          </Box>

          {/* ================================================================
              RIGHT COLUMN: Form Fields
              ================================================================ */}
          <Box flex="1" minW={0}>
            <Stack spacing={5}>
              {/* Agency Selection for Super Admin */}
              {isSuperAdmin && (
                <FormControl isInvalid={!!errors.agencyId} isRequired={!initialData?.agencyId}>
                  <FormLabel>Agency</FormLabel>
                  {initialData?.agencyId ? (
                    <>
                      <Input
                        value={initialData.Agency?.name || `Agency #${initialData.agencyId}`}
                        isReadOnly
                        bg="gray.50"
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Agency cannot be changed after creation
                      </Text>
                    </>
                  ) : (
                    <>
                      <Select
                        placeholder="Select an agency"
                        {...register('agencyId')}
                        isDisabled={agenciesLoading}
                      >
                        {activeAgencies.map((agency) => (
                          <option key={agency.id} value={agency.id}>
                            {agency.name} - {agency.address}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>{errors.agencyId?.message}</FormErrorMessage>
                      {activeAgencies.length === 0 && !agenciesLoading && (
                        <Text fontSize="sm" color="orange.500" mt={1}>
                          No active agencies available. Create an agency first.
                        </Text>
                      )}
                    </>
                  )}
                </FormControl>
              )}

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.brand}>
                  <FormLabel>Brand</FormLabel>
                  <Input placeholder="e.g., Toyota" {...register('brand')} />
                  <FormErrorMessage>{errors.brand?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.model}>
                  <FormLabel>Model</FormLabel>
                  <Input placeholder="e.g., Camry" {...register('model')} />
                  <FormErrorMessage>{errors.model?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl isInvalid={!!errors.year}>
                  <FormLabel>Year</FormLabel>
                  <Input type="number" {...register('year')} />
                  <FormErrorMessage>{errors.year?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.mileage}>
                  <FormLabel>Mileage (km)</FormLabel>
                  <Input type="number" {...register('mileage')} />
                  <FormErrorMessage>{errors.mileage?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.price}>
                  <FormLabel>Price per Day ($)</FormLabel>
                  <Input type="number" step="0.01" {...register('price')} />
                  <FormErrorMessage>{errors.price?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.registration}>
                  <FormLabel>Registration</FormLabel>
                  <Input placeholder="e.g., ABC-1234" {...register('registration')} />
                  <FormErrorMessage>{errors.registration?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.door}>
                  <FormLabel>Number of Doors</FormLabel>
                  <Select {...register('door')}>
                    {[2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} doors
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.door?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.fuel}>
                  <FormLabel>Fuel Type</FormLabel>
                  <Select placeholder="Select fuel type" {...register('fuel')}>
                    {fuelTypes.map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {fuel}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.fuel?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.gearBox}>
                  <FormLabel>Gearbox</FormLabel>
                  <Select placeholder="Select gearbox" {...register('gearBox')}>
                    {gearboxTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.gearBox?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <FormControl isInvalid={!!errors.description}>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Enter car description..."
                  rows={3}
                  {...register('description')}
                />
                <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
              </FormControl>

              <ProgressButton type="submit" colorScheme="brand" size="lg" isLoading={isLoading}>
                {submitLabel}
              </ProgressButton>
            </Stack>
          </Box>
        </Flex>
      </form>
    </Box>
  );
}
