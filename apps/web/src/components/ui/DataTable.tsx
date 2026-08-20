'use client';

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Flex,
  Text,
  IconButton,
  Select,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Skeleton,
} from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi';
import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  keyExtractor: (row: T) => string | number;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data found',
  keyExtractor,
}: DataTableProps<T>) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  const renderCell = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] as ReactNode;
  };

  return (
    <Box bg={bg} borderRadius="xl" border="1px" borderColor={borderColor} overflow="hidden">
      {/* Search bar */}
      {onSearchChange && (
        <Box p={4} borderBottom="1px" borderColor={borderColor}>
          <InputGroup maxW="320px">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </InputGroup>
        </Box>
      )}

      {/* Table */}
      <Box overflowX="auto">
        <Table>
          <Thead bg={headerBg}>
            <Tr>
              {columns.map((column, index) => (
                <Th key={index} width={column.width}>
                  {column.header}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <Tr key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <Td key={colIndex}>
                      <Skeleton height="20px" />
                    </Td>
                  ))}
                </Tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <Tr>
                <Td colSpan={columns.length}>
                  <Text textAlign="center" py={8} color="gray.500">
                    {emptyMessage}
                  </Text>
                </Td>
              </Tr>
            ) : (
              // Data rows
              data.map((row) => (
                <Tr key={keyExtractor(row)}>
                  {columns.map((column, colIndex) => (
                    <Td key={colIndex}>{renderCell(row, column)}</Td>
                  ))}
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <Flex
          p={4}
          borderTop="1px"
          borderColor={borderColor}
          justify="space-between"
          align="center"
        >
          <Text color="gray.500" fontSize="sm">
            Page {page} of {totalPages}
          </Text>
          <HStack spacing={2}>
            <IconButton
              aria-label="Previous page"
              icon={<FiChevronLeft />}
              size="sm"
              variant="outline"
              isDisabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            />
            <IconButton
              aria-label="Next page"
              icon={<FiChevronRight />}
              size="sm"
              variant="outline"
              isDisabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            />
          </HStack>
        </Flex>
      )}
    </Box>
  );
}
