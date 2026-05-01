'use client';

import { Box, Typography, Button, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LockIcon from '@mui/icons-material/Lock';

export default function ForbiddenPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleGoToDashboard = () => {
    if (!user) {
      router.push('/');
      return;
    }

    const roles = user.roles || [];
    if (roles.includes('ADMIN')) {
      router.push('/dashboard/admin');
    } else if (roles.includes('HR')) {
      router.push('/dashboard/hr');
    } else {
      router.push('/dashboard/employee');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'error.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <LockIcon sx={{ fontSize: 40, color: 'error.main' }} />
        </Box>

        <Typography variant="h4" component="h1" gutterBottom color="error">
          Access Denied
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You don't have permission to access this page. This area is restricted to authorized users only.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGoToDashboard}
            size="large"
          >
            Go to My Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
