'use client';

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent, List, ListItem, ListItemText, IconButton, Alert } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/utils/api';

export default function PermissionManagementPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (roles.length > 0) {
      roles.forEach(role => fetchRolePermissions(role.id));
    }
  }, [roles]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/permissions/roles');
      setRoles(response.data.roles);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch roles');
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/permissions');
      setPermissions(response.data.permissions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch permissions');
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const response = await api.get(`/permissions/roles/${roleId}/permissions`);
      setRolePermissionsMap(prev => ({
        ...prev,
        [roleId]: response.data.permissions.map((p: any) => p.id)
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch role permissions');
    }
  };

  const handleTogglePermission = async (roleId: string, permissionId: string, isAssigned: boolean) => {
    const permission = permissions.find(p => p.id === permissionId);
    const role = roles.find(r => r.id === roleId);
    const action = isAssigned ? 'remove' : 'grant';
    
    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${permission?.name}" permission ${isAssigned ? 'from' : 'to'} ${role?.name} role?\n\nThis will take effect immediately for all users with this role.`
    );
    
    if (!confirmed) return;
    
    setMessage('');
    setError('');
    try {
      if (isAssigned) {
        await api.delete('/permissions/assign', { data: { role_id: roleId, permission_id: permissionId } });
      } else {
        await api.post('/permissions/assign', { role_id: roleId, permission_id: permissionId });
      }
      fetchRolePermissions(roleId);
      setMessage(`Permission ${action}ed successfully`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update permission');
    }
  };

  const isPermissionAssigned = (roleId: string, permissionId: string) => {
    return rolePermissionsMap[roleId]?.includes(permissionId) || false;
  };

  const getRoleColor = (roleName: string) => {
    if (roleName === 'ADMIN') return '#d32f2f';
    if (roleName === 'HR') return '#f57c00';
    return '#1976d2';
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <DashboardLayout role="admin">
        <Box>
          {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>Role Permissions</Typography>
            <Typography variant="body2" color="text.secondary">Manage permissions for each role</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {roles.map((role) => (
              <Box key={role.id} sx={{ flex: '1 1 300px', minWidth: 300, maxWidth: 400 }}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pb: 2, borderBottom: '2px solid', borderColor: getRoleColor(role.name) }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: getRoleColor(role.name) }}>
                        {role.name}
                      </Typography>
                      <Typography variant="caption" sx={{ ml: 'auto', bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
                        {rolePermissionsMap[role.id]?.length || 0} / {permissions.length}
                      </Typography>
                    </Box>
                    <List dense sx={{ maxHeight: 500, overflow: 'auto' }}>
                      {permissions.map((permission) => {
                        const isAssigned = isPermissionAssigned(role.id, permission.id);
                        return (
                          <ListItem
                            key={permission.id}
                            sx={{
                              borderRadius: 1,
                              mb: 0.5,
                              bgcolor: isAssigned ? 'action.selected' : 'transparent',
                              '&:hover': { bgcolor: isAssigned ? 'action.selected' : 'action.hover' }
                            }}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleTogglePermission(role.id, permission.id, isAssigned)}
                                sx={{ color: isAssigned ? 'error.main' : 'success.main' }}
                              >
                                {isAssigned ? <RemoveCircleOutlineIcon /> : <AddCircleOutlineIcon />}
                              </IconButton>
                            }
                          >
                            <ListItemText
                              primary={permission.name}
                              primaryTypographyProps={{ variant: 'body2', fontWeight: isAssigned ? 500 : 400 }}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
