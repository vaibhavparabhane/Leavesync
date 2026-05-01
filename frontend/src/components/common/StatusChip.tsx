import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import { COLORS } from '@/config/colors';

interface StatusChipProps {
  status: string;
}

export default function StatusChip({ status }: StatusChipProps) {
  const config = {
    PENDING: {
      label: 'PENDING',
      ...COLORS.STATUS.PENDING,
      icon: <PendingIcon sx={{ fontSize: 16 }} />
    },
    APPROVED: {
      label: 'APPROVED',
      ...COLORS.STATUS.APPROVED,
      icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
    },
    REJECTED: {
      label: 'REJECTED',
      ...COLORS.STATUS.REJECTED,
      icon: <CancelIcon sx={{ fontSize: 16 }} />
    },
    CANCELLED: {
      label: 'CANCELLED',
      ...COLORS.STATUS.CANCELLED,
      icon: <CancelIcon sx={{ fontSize: 16 }} />
    },
    CANCELLATION: {
      label: 'CANCELLATION REQUESTED',
      ...COLORS.STATUS.PENDING,
      icon: <PendingIcon sx={{ fontSize: 16 }} />
    }
  };

  const { label, main, background, border, icon } = config[status as keyof typeof config] || config.PENDING;

  return (
    <Chip 
      icon={icon}
      label={label}
      size="small"
      sx={{ 
        color: main, 
        backgroundColor: background,
        fontWeight: 700,
        letterSpacing: '1px',
        fontSize: '0.75rem',
        height: 28,
        border: `2px solid ${border}`,
        px: 1,
        '& .MuiChip-icon': { color: main }
      }}
    />
  );
}
