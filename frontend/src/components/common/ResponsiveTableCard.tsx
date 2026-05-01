import { Box, Card, CardContent, Typography, useMediaQuery, useTheme, Chip } from '@mui/material';
import { ReactNode } from 'react';

interface ResponsiveTableCardProps {
  data: any[];
  renderCard: (item: any) => ReactNode;
  emptyMessage?: string;
}

export default function ResponsiveTableCard({ data, renderCard, emptyMessage = 'No data found' }: ResponsiveTableCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) {
    return null; // Use regular table on desktop
  }

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {data.map((item, index) => (
        <Card key={index} sx={{ boxShadow: 2 }}>
          <CardContent>
            {renderCard(item)}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
