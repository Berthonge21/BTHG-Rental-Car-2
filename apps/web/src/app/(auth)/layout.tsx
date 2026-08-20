'use client';

import { Box, Container, Flex, Icon, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { FiTruck, FiShield, FiClock, FiAward } from 'react-icons/fi';
import type { ReactNode } from 'react';
import Image from 'next/image';

const features = [
  { icon: FiShield, text: 'Secure & Reliable' },
  { icon: FiClock, text: '24/7 Support' },
  { icon: FiAward, text: 'Premium Service' },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  const bgColor = useColorModeValue('surface.light', 'navy.800');

  return (
    <Flex minH="100vh" bg={bgColor}>
      {/* Left side - Branding with Image */}
      <Box
        display={{ base: 'none', lg: 'flex' }}
        w="50%"
        bg="navy.800"
        alignItems="center"
        justifyContent="center"
        position="relative"
        overflow="hidden"
      >
        {/* Background Image */}
        <Image
          src="/img/bthg-signin.png"
          alt="BTHG Rental Car"
          fill
          style={{ objectFit: 'cover', opacity: 0.4 }}
          priority
        />

        {/* Gradient overlay */}
        <Box
          position="absolute"
          inset={0}
          bgGradient="linear(135deg, rgba(11, 28, 45, 0.9) 0%, rgba(11, 28, 45, 0.7) 50%, rgba(11, 28, 45, 0.85) 100%)"
        />

        {/* Decorative elements */}
        <Box
          position="absolute"
          top="-10%"
          right="-10%"
          w="400px"
          h="400px"
          borderRadius="full"
          bg="rgba(201, 162, 39, 0.1)"
        />
        <Box
          position="absolute"
          bottom="-15%"
          left="-10%"
          w="500px"
          h="500px"
          borderRadius="full"
          bg="rgba(27, 197, 189, 0.05)"
        />
        <Box
          position="absolute"
          top="30%"
          left="20%"
          w="200px"
          h="200px"
          borderRadius="full"
          bg="rgba(201, 162, 39, 0.08)"
        />

        {/* Content */}
        <VStack position="relative" spacing={8} color="white" p={12} maxW="500px">
          {/* Logo */}
          <Box
            w={20}
            h={20}
            bg="brand.400"
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={FiTruck} boxSize={10} color="white" />
          </Box>

          {/* Heading */}
          <VStack spacing={3}>
            <Text fontSize="4xl" fontWeight="bold" textAlign="center">
              BTHG Rental Car
            </Text>
            <Text fontSize="lg" opacity={0.8} textAlign="center">
              Your trusted partner for premium car rental services
            </Text>
          </VStack>

          {/* Features */}
          <Flex gap={4} mt={8}>
            {features.map((feature, index) => (
              <VStack
                key={index}
                p={4}
                bg="rgba(255, 255, 255, 0.05)"
                borderRadius="xl"
                border="1px solid rgba(255, 255, 255, 0.1)"
                minW="110px"
              >
                <Icon as={feature.icon} boxSize={5} color="brand.400" />
                <Text fontSize="xs" fontWeight="medium" textAlign="center" opacity={0.9}>
                  {feature.text}
                </Text>
              </VStack>
            ))}
          </Flex>

          {/* Stats */}
          <Flex gap={10} mt={8}>
            <VStack spacing={0}>
              <Text fontSize="2xl" fontWeight="bold" color="brand.400">500+</Text>
              <Text fontSize="sm" opacity={0.7}>Vehicles</Text>
            </VStack>
            <VStack spacing={0}>
              <Text fontSize="2xl" fontWeight="bold" color="accent.400">50+</Text>
              <Text fontSize="sm" opacity={0.7}>Agencies</Text>
            </VStack>
            <VStack spacing={0}>
              <Text fontSize="2xl" fontWeight="bold" color="brand.400">10K+</Text>
              <Text fontSize="sm" opacity={0.7}>Clients</Text>
            </VStack>
          </Flex>
        </VStack>
      </Box>

      {/* Right side - Form */}
      <Flex
        w={{ base: '100%', lg: '50%' }}
        alignItems="center"
        justifyContent="center"
        p={{ base: 4, md: 8 }}
        position="relative"
      >
        {/* Background decoration for mobile */}
        <Box
          display={{ base: 'block', lg: 'none' }}
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="180px"
          bg="navy.800"
          borderBottomRadius="3xl"
        />

        <Container maxW="md" position="relative">
          {children}
        </Container>
      </Flex>
    </Flex>
  );
}
