'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Container,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  ThemeProvider,
  createTheme,
  Alert,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isSubmitting = useRef(false);

  const performLogin = useCallback(async (e?: React.FormEvent) => {
    // Prevent default form submission if called from form
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent double submission using both state and ref
    if (isLoading || isSubmitting.current) {
      console.log('Login already in progress, ignoring click');
      return;
    }
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);
    setError('');

    try {
      console.log('Starting login...');
      await login(email, password);
      console.log('Login completed');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.message || err?.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      isSubmitting.current = false;
      setIsLoading(false);
    }
  }, [email, password, isLoading, login]);

  const handleGoogleLogin = () => {
    alert('Google login clicked!');
    window.location.href = '/dashboard/employee';
  };

  const theme = createTheme({
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none' },
        },
      },
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#f0f2f5',
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <ThemeProvider theme={theme}>
          <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: 6 }}>
            <CardContent sx={{ p: { xs: 4, sm: 6 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box display="flex" justifyContent="center" mb={1}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  NexusPulse
                </Typography>
              </Box>

              <Typography variant="body1" color="textSecondary" textAlign="center">
                Leave Management System - Please sign in to continue
              </Typography>

              <Box component="form" onSubmit={performLogin} noValidate>
                <Stack spacing={2} mt={1}>
                  {error && (
                    <Alert severity="error" sx={{ borderRadius: 3 }}>
                      {error}
                    </Alert>
                  )}
                  <TextField
                    fullWidth
                    label="Email"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    InputProps={{ sx: { borderRadius: 3 } }}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    InputProps={{
                      sx: { borderRadius: 3 },
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} type="button">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    type="submit"
                    disabled={isLoading}
                    sx={{
                      py: 1.5,
                      borderRadius: 99,
                      fontWeight: 600,
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      '&:hover': { backgroundColor: '#1d4ed8' },
                      '&:disabled': { 
                        backgroundColor: '#93c5fd',
                        color: '#fff',
                        cursor: 'not-allowed',
                      },
                    }}
                  >
                    {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }}>OR</Divider>

              <Button
                fullWidth
                variant="outlined"
                startIcon={
                  <Image src="/google-logo.png" alt="Google" width={20} height={20} />
                }
                size="large"
                onClick={handleGoogleLogin}
                sx={{
                  py: 1.5,
                  borderRadius: 99,
                  fontWeight: 600,
                  borderColor: '#ccc',
                  color: '#555',
                  '&:hover': { backgroundColor: '#f5f5f5', borderColor: '#aaa' },
                }}
              >
                Continue with Google
              </Button>
            </CardContent>
          </Card>
        </ThemeProvider>
      </Container>
    </Box>
  );
}
