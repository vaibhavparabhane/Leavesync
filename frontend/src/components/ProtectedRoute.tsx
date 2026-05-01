'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if already on login page
    if (pathname === '/' && !isAuthenticated) {
      return;
    }
    
    if (!isLoading && !isAuthenticated) {
      router.push('/');
      return;
    }
    
    // Check role-based access with case-insensitive matching
    if (!isLoading && isAuthenticated && user && allowedRoles && allowedRoles.length > 0) {
      const userRoles = (user.roles || []).map((r: string) => r.toUpperCase());
      const allowedRolesUpper = allowedRoles.map(r => r.toUpperCase());
      const hasAllowedRole = userRoles.some(role => allowedRolesUpper.includes(role));
      
      if (!hasAllowedRole) {
        router.push('/forbidden');
      }
    }
  }, [isLoading, isAuthenticated, router, user, allowedRoles, pathname]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Additional check after loading - if user has role but not allowed role
  if (user && allowedRoles && allowedRoles.length > 0) {
    const userRoles = (user.roles || []).map((r: string) => r.toUpperCase());
    const allowedRolesUpper = allowedRoles.map(r => r.toUpperCase());
    const hasAllowedRole = userRoles.some(role => allowedRolesUpper.includes(role));
    
    if (!hasAllowedRole) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      );
    }
  }

  return <>{children}</>;
}
