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
  Avatar,
  Tooltip,
  useColorModeValue,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiLink, FiUserCheck, FiUserX } from 'react-icons/fi';
import { DataTable, type Column, ConfirmDialog } from '@/components/ui';
import { useSuperAdminUsers, useUpdateUserStatus } from '@/hooks';
import { Status } from '@bthgrentalcar/sdk';
import type { AdminUser, UserRole } from '@bthgrentalcar/sdk';

const roleColors: Record<UserRole, string> = {
  admin: 'blue',
  superAdmin: 'purple',
};

export default function SuperAdminAdminsPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const statusToggleDialog = useDisclosure();
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  const { data, isLoading } = useSuperAdminUsers({ page, limit: 10, search: search || undefined });
  const updateStatusMutation = useUpdateUserStatus();

  const filteredData = (data?.data || []).filter((admin) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      admin.firstname.toLowerCase().includes(q) ||
      admin.name.toLowerCase().includes(q) ||
      admin.email.toLowerCase().includes(q)
    );
  });

  const cardBg = useColorModeValue('white', 'navy.700');
  const cardBorder = useColorModeValue('gray.100', 'navy.600');
  const textMuted = useColorModeValue('text.muted', 'gray.400');

  const handleStatusToggle = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    statusToggleDialog.onOpen();
  };

  const confirmStatusToggle = async () => {
    if (!selectedAdmin) return;

    const newStatus =
      selectedAdmin.status === Status.ACTIVATE ? Status.DEACTIVATE : Status.ACTIVATE;

    try {
      await updateStatusMutation.mutateAsync({
        userId: selectedAdmin.id,
        status: newStatus,
      });
      toast({
        title: newStatus === Status.ACTIVATE ? 'Admin activated' : 'Admin deactivated',
        description: `${selectedAdmin.firstname} ${selectedAdmin.name} has been ${newStatus === Status.ACTIVATE ? 'activated' : 'deactivated'}.`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to update status',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      statusToggleDialog.onClose();
      setSelectedAdmin(null);
    }
  };

  const isActivating = selectedAdmin?.status === Status.DEACTIVATE;

  const columns: Column<AdminUser>[] = [
    {
      header: 'Admin',
      accessor: (row) => (
        <HStack spacing={3}>
          <Avatar
            size="sm"
            name={`${row.firstname} ${row.name}`}
            src={row.image}
            bg="brand.400"
          />
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium" color="text.primary">
              {row.firstname} {row.name}
            </Text>
            <Text fontSize="sm" color={textMuted}>
              {row.email}
            </Text>
          </VStack>
        </HStack>
      ),
    },
    {
      header: 'Role',
      accessor: (row) => (
        <Badge colorScheme={roleColors[row.role]} textTransform="capitalize">
          {row.role === 'superAdmin' ? 'Super Admin' : 'Admin'}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge
          colorScheme={row.status === Status.ACTIVATE ? 'green' : 'red'}
          variant="subtle"
          textTransform="capitalize"
        >
          {row.status === Status.ACTIVATE ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      header: 'Agency',
      accessor: (row) => (
        <Text fontSize="sm" color={textMuted}>
          {row.agency?.name || row.agencyName || (
            <Badge colorScheme="orange" variant="subtle">
              Not assigned
            </Badge>
          )}
        </Text>
      ),
    },
    {
      header: 'Actions',
      width: '140px',
      accessor: (row) => (
        <HStack spacing={1}>
          <Tooltip label="Edit" hasArrow>
            <IconButton
              aria-label="Edit"
              icon={<FiEdit2 />}
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/super-admin/admins/${row.id}`)}
            />
          </Tooltip>
          {!row.agencyId && row.role === 'admin' && (
            <Tooltip label="Assign Agency" hasArrow>
              <IconButton
                aria-label="Assign Agency"
                icon={<FiLink />}
                variant="ghost"
                size="sm"
                colorScheme="blue"
                onClick={() => router.push(`/super-admin/admins/${row.id}?assign=true`)}
              />
            </Tooltip>
          )}
          {/* Status toggle -- do not allow toggling superAdmin accounts */}
          {row.role !== 'superAdmin' && (
            <Tooltip
              label={row.status === Status.ACTIVATE ? 'Deactivate' : 'Activate'}
              hasArrow
            >
              <IconButton
                aria-label={row.status === Status.ACTIVATE ? 'Deactivate admin' : 'Activate admin'}
                icon={row.status === Status.ACTIVATE ? <FiUserX /> : <FiUserCheck />}
                variant="ghost"
                size="sm"
                colorScheme={row.status === Status.ACTIVATE ? 'red' : 'green'}
                onClick={() => handleStatusToggle(row)}
              />
            </Tooltip>
          )}
        </HStack>
      ),
    },
  ];

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg" color="text.primary">Admin Users</Heading>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="brand"
          onClick={() => router.push('/super-admin/admins/new')}
        >
          Create Admin
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
          searchPlaceholder="Search admins..."
          keyExtractor={(row) => row.id}
          emptyMessage="No admin users found"
        />
      </Box>

      {/* Status Toggle Confirmation Dialog */}
      <ConfirmDialog
        isOpen={statusToggleDialog.isOpen}
        onClose={() => {
          statusToggleDialog.onClose();
          setSelectedAdmin(null);
        }}
        onConfirm={confirmStatusToggle}
        title={isActivating ? 'Activate Admin' : 'Deactivate Admin'}
        message={
          isActivating
            ? `Are you sure you want to reactivate ${selectedAdmin?.firstname} ${selectedAdmin?.name}? They will be able to log in and manage their agency again.`
            : `Are you sure you want to deactivate ${selectedAdmin?.firstname} ${selectedAdmin?.name}? They will be logged out and their agency's cars will be hidden from clients.`
        }
        confirmText={isActivating ? 'Activate' : 'Deactivate'}
        isLoading={updateStatusMutation.isPending}
        colorScheme={isActivating ? 'green' : 'red'}
      />
    </Box>
  );
}
