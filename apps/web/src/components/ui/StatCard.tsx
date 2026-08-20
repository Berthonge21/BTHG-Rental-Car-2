'use client';

import {
  Box,
  Flex,
  Text,
  Icon,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import type { IconType } from 'react-icons';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: IconType;
  change?: number;
  changeLabel?: string;
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({
  label,
  value,
  icon,
  change,
  changeLabel = 'vs last month',
  iconBg = 'brand.400',
  iconColor = 'white',
}: StatCardProps) {
  const cardBg = useColorModeValue('white', 'navy.700');
  const labelColor = useColorModeValue('text.muted', 'gray.400');
  const valueColor = useColorModeValue('text.primary', 'white');

  const isPositive = change && change > 0;

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={5}
      boxShadow="card"
      transition="all 0.2s"
      _hover={{
        boxShadow: 'cardHover',
        transform: 'translateY(-2px)',
      }}
    >
      <Flex justify="space-between" align="flex-start">
        <Box flex={1}>
          <Text fontSize="sm" fontWeight="medium" color={labelColor} mb={1}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color={valueColor} mb={2}>
            {value}
          </Text>
          {change !== undefined && (
            <HStack spacing={1}>
              <Icon
                as={isPositive ? FiTrendingUp : FiTrendingDown}
                color={isPositive ? 'accent.400' : 'red.500'}
                boxSize={4}
              />
              <Text
                fontSize="sm"
                color={isPositive ? 'accent.400' : 'red.500'}
                fontWeight="medium"
              >
                {isPositive ? '+' : ''}{change}%
              </Text>
              <Text fontSize="xs" color={labelColor}>
                {changeLabel}
              </Text>
            </HStack>
          )}
        </Box>
        <Box
          p={3}
          bg={iconBg}
          borderRadius="lg"
        >
          <Icon as={icon} boxSize={5} color={iconColor} />
        </Box>
      </Flex>
    </Box>
  );
}
