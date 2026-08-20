'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Button,
  HStack,
  IconButton,
  Text,
  Badge,
  VStack,
  Tooltip,
  useToast,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiEye } from 'react-icons/fi';
import { DataTable, ConfirmDialog, type Column } from '@/components/ui';
import { useSuperAdminAgencies, useDeleteAgency } from '@/hooks';
import type { Agency, Status } from '@bthgrentalcar/sdk';

const statusColors: Record<Status, string> = {
  activate: 'green',
  deactivate: 'red',
};

export default function SuperAdminAgenciesPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { data, isLoading } = useSuperAdminAgencies({ page, limit: 10, search: search || undefined });
  const deleteMutation = useDeleteAgency();

  const filteredData = (data?.data || []).filter((agency) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      agency.name.toLowerCase().includes(q) ||
      agency.email.toLowerCase().includes(q) ||
      agency.address?.toLowerCase().includes(q)
    );
  });

  const cardBg = useColorModeValue('white', 'navy.700');
  const cardBorder = useColorModeValue('gray.100', 'navy.600');
  const textMuted = useColorModeValue('text.muted', 'gray.400');

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast({
        title: 'Agency deleted',
        status: 'success',
        duration: 3000,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to delete agency',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const columns: Column<Agency>[] = [
    {
      header: 'Agency',
      accessor: (row) => (
        <VStack align="start" spacing={0}>
          <Text fontWeight="medium" color="text.primary">{row.name}</Text>
          <Text fontSize="sm" color={textMuted}>
            {row.email}
          </Text>
        </VStack>
      ),
    },
    {
      header: 'Address',
      accessor: (row) => <Text fontSize="sm" color={textMuted}>{row.address}</Text>,
    },
    {
      header: 'Phone',
      accessor: (row) => <Text fontSize="sm" color={textMuted}>{row.telephone}</Text>,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge colorScheme={statusColors[row.status]} textTransform="capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      width: '100px',
      accessor: (row) => (
        <HStack spacing={1}>
          <Tooltip label="View" hasArrow>
            <IconButton
              aria-label="View"
              icon={<FiEye />}
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/super-admin/agencies/${row.id}`)}
            />
          </Tooltip>
          <Tooltip label="Delete" hasArrow>
            <IconButton
              aria-label="Delete"
              icon={<FiTrash2 />}
              variant="ghost"
              size="sm"
              colorScheme="red"
              onClick={() => {
                setDeleteId(row.id);
                onOpen();
              }}
            />
          </Tooltip>
        </HStack>
      ),
    },
  ];

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg" color="text.primary">Agencies</Heading>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="brand"
          onClick={() => router.push('/super-admin/agencies/new')}
        >
          Add Agency
        </Button>
      </HStack>

      <Box
        bg={cardBg}
        borderRadius="2xl"
        border="1px"
        borderColor={cardBorder}
        boxShadow="sm"
        overflow="hidden"
        p={5}
      >
        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          page={page}
          totalPages={data?.meta.totalPages || 1}
          onPageChange={setPage}
          searchValue={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          searchPlaceholder="Search agencies..."
          keyExtractor={(row) => row.id}
          emptyMessage="No agencies found"
        />
      </Box>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleDelete}
        title="Delete Agency"
        message="Are you sure you want to delete this agency? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </Box>
  );
}
