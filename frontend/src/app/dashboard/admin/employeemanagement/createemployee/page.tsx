'use client';

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, FormControl, InputLabel, Select, MenuItem, Chip } from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/utils/api';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';

export default function CreateEmployeePage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    location: ''
  });
  const [selectedRole, setSelectedRole] = useState<string>('EMPLOYEE');
  const [roles, setRoles] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/permissions/roles');
      setRoles(response.data.roles);
    } catch (err: any) {
      setError('Failed to fetch roles');
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (event: any) => {
    setSelectedRole(event.target.value);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const roleIds = roles.filter(r => r.name === selectedRole).map(r => r.id);
      await api.post('/auth/register', { ...formData, role_ids: roleIds });
      setMessage('User created successfully');
      setFormData({ full_name: '', email: '', password: '', location: '' });
      setSelectedRole('EMPLOYEE');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (roleName: string) => {
    return { bgcolor: '#424242', color: 'white' };
  };

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
      <DashboardLayout role="admin">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
          <Box sx={{ width: '100%', maxWidth: 700 }}>
            {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>Create New User</Typography>
                <Typography variant="body1" color="text.secondary">Add a new employee or HR user to the system</Typography>
              </Box>

              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Full Name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  fullWidth
                />
                
                <TextField
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  fullWidth
                />

                <FormControl fullWidth sx={{ bgcolor: 'white' }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={selectedRole}
                    onChange={handleRoleChange}
                    label="Role"
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.name} sx={{ py: 1 }}>
                        <Chip 
                          label={role.name} 
                          size="small" 
                          sx={{ 
                            ...getRoleColor(role.name),
                            fontWeight: 500, 
                            px: 1.5, 
                            py: 1.2
                          }} 
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2, py: 1.5, fontSize: '1.1rem', fontWeight: 600 }}
                >
                  {loading ? 'Creating User...' : 'Create User'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Box>
      </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
