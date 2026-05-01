'use client';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Typography, Paper, TextField, FormControl, InputLabel, Select, MenuItem, Button, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { formStyles } from '@/config/styles';
import { TYPOGRAPHY } from '@/config/typography';

export default function CreateUserPage() {
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', location: '' });
  const [selectedRole, setSelectedRole] = useState<string>('EMPLOYEE');
  const [roles, setRoles] = useState<any[]>([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/permissions/roles');
      setRoles(response.data.roles);
    } catch (err) {
      console.error('Failed to fetch roles');
    }
  };

  const handleCreateUser = async () => {
    if (!formData.full_name || !formData.email || !formData.password) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    setFormLoading(true);
    try {
      const roleIds = roles.filter(r => r.name === selectedRole).map(r => r.id);
      await api.post('/auth/register', { ...formData, role_ids: roleIds });
      setMessage({ type: 'success', text: 'User created successfully!' });
      setFormData({ full_name: '', email: '', password: '', location: '' });
      setSelectedRole('EMPLOYEE');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create user' });
    } finally {
      setFormLoading(false);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
      <DashboardLayout role="admin">
        <Box sx={{ mb: 3 }}>
          <Typography sx={TYPOGRAPHY.PAGE_TITLE} gutterBottom>Create New User</Typography>
          <Typography sx={TYPOGRAPHY.PAGE_SUBTITLE}>Add a new user to the system with assigned role</Typography>
        </Box>

        {message.text && (
          <Alert severity={message.type as 'success' | 'error'} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        <Paper sx={{ p: 4, maxWidth: 700 }}>
          <Box sx={{ mb: 3 }}>
            <Typography sx={TYPOGRAPHY.CARD_TITLE} gutterBottom>User Information</Typography>
            <Typography sx={TYPOGRAPHY.PAGE_SUBTITLE}>Fill in the details for the new user account</Typography>
          </Box>
          <Box sx={formStyles.dialogContent}>
            <TextField 
              label="Full Name" 
              value={formData.full_name} 
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
              required 
              fullWidth
              placeholder="Enter full name"
            />
            <TextField 
              label="Email" 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              required 
              fullWidth
              placeholder="Enter email address"
            />
            <TextField 
              label="Password" 
              type="password" 
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              required 
              fullWidth
              placeholder="Enter password"
              helperText="Minimum 6 characters recommended"
            />
            <TextField 
              label="Location" 
              value={formData.location} 
              onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
              fullWidth
              placeholder="Enter location (optional)"
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} label="Role">
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              onClick={handleCreateUser} 
              disabled={formLoading}
              fullWidth
              size="large"
              sx={{ mt: 1, py: 1.5 }}
            >
              {formLoading ? 'Creating...' : 'Create User'}
            </Button>
          </Box>
        </Paper>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
