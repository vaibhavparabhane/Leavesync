'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Typography, Paper, TextField, Button, Box, Alert, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { UserController } from '@/controllers/UserController';
import { useAuth } from '@/context/AuthContext';
import { TYPOGRAPHY } from '@/config/typography';
import { formStyles } from '@/config/styles';

interface ProfilePageProps {
  role: 'employee' | 'hr' | 'admin';
  allowedRoles: string[];
}

export default function ProfilePage({ role, allowedRoles }: ProfilePageProps) {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const result = await UserController.fetchMyProfile();
    if (result.success) {
      setProfile(result.data);
      setFullName(result.data.full_name || '');
    } else {
      setError(result.error || 'Failed to load profile');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const result = await UserController.updateMyProfile({ full_name: fullName });
    if (result.success) {
      setSuccess('Profile updated successfully');
      setProfile(result.data);
      updateUser({ full_name: fullName });
    } else {
      setError(result.error || 'Failed to update profile');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <DashboardLayout role={role}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <DashboardLayout role={role}>
        <Typography sx={TYPOGRAPHY.PAGE_TITLE} gutterBottom>My Profile</Typography>
        
        <Paper sx={{ p: 4, maxWidth: 600 }}>
          <Box component="form" onSubmit={handleSubmit} sx={formStyles.dialogContent}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <TextField
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <TextField
              label="Email"
              value={profile?.email || ''}
              InputProps={{ readOnly: true }}
              disabled
            />

            <TextField
              label="Location"
              value={profile?.location || 'Not assigned'}
              InputProps={{ readOnly: true }}
              disabled
            />

            <TextField
              label="Role"
              value={profile?.roles?.join(', ') || 'Not assigned'}
              InputProps={{ readOnly: true }}
              disabled
            />

            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ py: 1.5 }}
            >
              {submitting ? <CircularProgress size={20} color="inherit" /> : 'Update Profile'}
            </Button>
          </Box>
        </Paper>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
