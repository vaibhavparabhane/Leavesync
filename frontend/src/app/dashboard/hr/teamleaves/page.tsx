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
} from '@mui/material';
import { useEffect, useState } from 'react';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';

// Debounce hook
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

// Custom status chip with improved styling
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

export default function TeamLeavesPage() {
  const [leaves, setLeaves] = useState<TeamLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  
  // Sorting state
  const [sortBy, setSortBy] = useState('start_date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debounce search to prevent cursor issues
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  const perPage = 10;

  useEffect(() => {
    fetchTeamLeaves();
  }, [page, statusFilter, sortBy, sortOrder, debouncedSearchQuery]);

  const fetchTeamLeaves = async () => {
    setLoading(true);
    const result = await HRController.fetchTeamLeaves(page, perPage, statusFilter || undefined, sortBy, sortOrder, debouncedSearchQuery || undefined);
    
    if (result.success) {
      setLeaves(result.data.leaves || []);
      setPagination(result.data.pagination || null);
      setError(null);
    } else {
      setError(result.error || 'Failed to load team leaves');
    }
    setLoading(false);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1); // Reset to first page when sort changes
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page when search changes
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
    <ProtectedRoute allowedRoles={ROLE_GROUPS.HR_ONLY}>
      <DashboardLayout role="hr">
      {loading ? (
        <Loading message="Loading team leaves..." />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          {/* Status Filter and Sorting */}
          <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
            {/* Search by Employee on the left */}
            <TextField
              size="small"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ width: 300 }}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Sort, Order and Status Filter on the right */}
            <Box display="flex" alignItems="center" gap={1}>
              <SortIcon color="action" />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => handleSortChange(e.target.value, sortOrder)}
              >
                <MenuItem value="employee_name">Employee Name</MenuItem>
                <MenuItem value="leave_type">Leave Type</MenuItem>
                <MenuItem value="start_date">Start Date</MenuItem>
                <MenuItem value="total_days">Total Days</MenuItem>
              </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Order</InputLabel>
                <Select
                  value={sortOrder}
                  label="Order"
                  onChange={(e) => handleSortChange(sortBy, e.target.value)}
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
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
              <TableHead>>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Total Days</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>>
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
          
          {/* Pagination Controls */}
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
