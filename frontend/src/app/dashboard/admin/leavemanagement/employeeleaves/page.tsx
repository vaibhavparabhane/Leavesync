'use client';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/common/Loading';
import { HRController } from '@/controllers/HRController';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  TableSortLabel,
  SelectChangeEvent,
} from '@mui/material';
import { useEffect, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface TeamLeave {
  leave_id: string;
  employee_name: string;
  employee_email?: string;
  employee_id?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
}

interface PaginationInfo {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

const StatusChip = ({ status }: { status: string }) => {
  const config = {
    PENDING: {
      label: 'PENDING',
      color: '#f59e0b',
      backgroundColor: '#fef3c7',
    },
    APPROVED: {
      label: 'APPROVED',
      color: '#059669',
      backgroundColor: '#d1fae5',
    },
    REJECTED: {
      label: 'REJECTED',
      color: '#dc2626',
      backgroundColor: '#fee2e2',
    }
  };

  const { label, color, backgroundColor } = config[status as keyof typeof config] || config.PENDING;

  return (
    <Chip 
      label={label}
      size="small"
      sx={{ 
        color: color, 
        backgroundColor: backgroundColor,
        fontWeight: 700,
        letterSpacing: '1px',
        fontSize: '0.75rem',
        height: 28,
        border: `2px solid ${color}`,
        px: 1,
      }}
    />
  );
};

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState<TeamLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [sortBy, setSortBy] = useState('start_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const perPage = 10;

  useEffect(() => {
    const fetchTeamLeaves = async () => {
      setLoading(true);
      const result = await HRController.fetchTeamLeaves(page, perPage, statusFilter || undefined, sortBy, sortOrder, debouncedSearchQuery || undefined);
      
      if (result.success) {
        setLeaves(result.data.leaves || []);
        setPagination(result.data.pagination || null);
        setError(null);
      } else {
        setError(result.error || 'Failed to load employee leaves');
      }
      setLoading(false);
    };

    fetchTeamLeaves();
  }, [page, statusFilter, sortBy, sortOrder, debouncedSearchQuery]);

  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
      <DashboardLayout role="admin">
      {loading ? (
        <Loading message="Loading employee leaves..." />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Box mb={3} display="flex" justifyContent="flex-start" alignItems="center" gap={2}>
            <TextField
              size="small"
              placeholder="Search by employee name"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{
                width: { xs: '100%', md: 560 },
                '& .MuiInputBase-root': { height: 48 },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <Box display="flex" alignItems="center" gap={1}>
              <FormControl size="small" sx={{ minWidth: 190, '& .MuiInputBase-root': { height: 48 } }}>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'employee_name'}
                      direction={sortBy === 'employee_name' ? (sortOrder as 'asc' | 'desc') : 'asc'}
                      onClick={() => handleSort('employee_name')}
                    >
                      Employee
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'leave_type'}
                      direction={sortBy === 'leave_type' ? (sortOrder as 'asc' | 'desc') : 'asc'}
                      onClick={() => handleSort('leave_type')}
                    >
                      Leave Type
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'start_date'}
                      direction={sortBy === 'start_date' ? (sortOrder as 'asc' | 'desc') : 'asc'}
                      onClick={() => handleSort('start_date')}
                    >
                      Start Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'total_days'}
                      direction={sortBy === 'total_days' ? (sortOrder as 'asc' | 'desc') : 'asc'}
                      onClick={() => handleSort('total_days')}
                    >
                      Total Days
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No leave records found
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map((leave) => (
                    <TableRow key={leave.leave_id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{leave.employee_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{leave.employee_email || leave.employee_id || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>{leave.leave_type}</TableCell>
                      <TableCell>{formatDate(leave.start_date)}</TableCell>
                      <TableCell>{formatDate(leave.end_date)}</TableCell>
                      <TableCell>{leave.total_days}</TableCell>
                      <TableCell>
                        <StatusChip status={leave.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {pagination && pagination.total_pages > 1 && (
            <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={3}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Typography variant="body2">
                Page {pagination.page} of {pagination.total_pages}
                <Typography component="span" variant="caption" color="text.secondary">
                  {' '}({pagination.total_count} total records)
                </Typography>
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.total_pages}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
