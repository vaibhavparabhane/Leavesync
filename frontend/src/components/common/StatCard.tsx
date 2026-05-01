'use client';

import { Box, Typography, Paper } from '@mui/material';
import { ReactNode } from 'react';

export default function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        boxShadow: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" fontWeight={600}>
          {value}
        </Typography>
      </Box>

      <Box
        sx={{
          backgroundColor: color,
          color: '#fff',
          p: 1.5,
          borderRadius: 2,
        }}
      >
        {icon}
      </Box>
    </Paper>
  );
}
