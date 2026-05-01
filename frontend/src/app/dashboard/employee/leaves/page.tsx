'use client';

import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/common/Loading';
import StatusChip from '@/components/common/StatusChip';
import { LeaveController } from '@/controllers/LeaveController';
import { LeaveRecord, PaginationInfo } from '@/models/Leave';
import { Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Box, Button, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery, Card, CardContent, Divider, TextField, InputAdornment, TableSortLabel, Dialog, DialogTitle, DialogContent, DialogActions, Chip } from '@mui/material';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';

export default function LeavesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchParams = useSearchParams();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  
  // Sorting state
  const [sortBy, setSortBy] = useState('start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const perPage = 10;

  // Set status filter from URL parameter on mount
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchLeaves();
  }, [page, statusFilter, sortBy, sortOrder, searchQuery]);

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    
    const result = await LeaveController.fetchLeaveRecords(
      page, 
      perPage, 
      statusFilter || undefined, 
      sortBy, 
      sortOrder
    );
    
    if (result.success) {
      let filteredLeaves = result.data.leaves || [];
      
      // Client-side search filtering
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredLeaves = filteredLeaves.filter((leave: LeaveRecord) => 
          leave.reason?.toLowerCase().includes(query)
        );
      }
      
      setLeaves(filteredLeaves);
      setPagination(result.data.pagination || null);
    } else {
      setError(result.error || 'Failed to fetch leaves');
    }
    setLoading(false);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleSortChange = (column: string) => {
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

  const handleCancelRequest = (leave: LeaveRecord) => {
    setSelectedLeave(leave);
    setCancellationReason('');
    setCancelDialogOpen(true);
  };

  const submitCancellationRequest = async () => {
    if (!selectedLeave) return;
    setSubmitting(true);
    const result = await LeaveController.requestCancellation(selectedLeave.leave_id, cancellationReason);
    if (result.success) {
      setCancelDialogOpen(false);
      fetchLeaves();
    } else {
      setError(result.error || 'Failed to request cancellation');
    }
    setSubmitting(false);
  };

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.EMPLOYEE_ONLY}>
      <DashboardLayout role="employee">
      {loading ? (
        <Loading message="Loading leaves..." />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Paper sx={{ p: 3 }}>
          {/* Search and Filter */}
          <Box mb={3} display="flex" gap={2} alignItems="center" flexDirection={{ xs: 'column', sm: 'row' }}>
            <TextField
              size="small"
              placeholder="Search by reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: { xs: '100%', sm: '100%', md: 420 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
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
          
          {leaves.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No leave records found
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                You haven't applied for any leaves yet.
              </Typography>
              <Link href="/dashboard/employee/apply" passHref>
                <Button variant="contained" color="primary" sx={{ py: { xs: 1.5, md: 1 } }}>
                  Apply for Leave
                </Button>
              </Link>
            </Box>
          ) : (
            <>
              {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {leaves.map((leave) => (
                    <Card key={leave.leave_id} sx={{ boxShadow: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Start Date</Typography>
                            <Typography variant="body2" fontWeight={600}>{leave.start_date}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">End Date</Typography>
                            <Typography variant="body2" fontWeight={600}>{leave.end_date}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Total Days</Typography>
                            <Typography variant="body2" fontWeight={600}>{leave.total_days}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Status</Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <StatusChip status={leave.status} />
                            </Box>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 1.5 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Reason</Typography>
                          <Typography variant="body2">{leave.reason || '-'}</Typography>
                        </Box>
                        {leave.status === 'REJECTED' && leave.rejection_reason && (
                          <Box sx={{ mt: 1.5, p: 1, bgcolor: 'error.lighter', borderRadius: 1 }}>
                            <Typography variant="caption" color="error" fontWeight={600}>Rejection Reason:</Typography>
                            <Typography variant="body2" color="error">{leave.rejection_reason}</Typography>
                          </Box>
                        )}
                        {leave.status === 'APPROVED' && !leave.cancellation_requested && (
                          <Box mt={2}>
                            <Button variant="outlined" color="error" size="small" startIcon={<CancelIcon />} onClick={() => handleCancelRequest(leave)} fullWidth>Request Cancellation</Button>
                          </Box>
                        )}
                        {leave.cancellation_requested && (
                          <Box mt={2}>
                            <Chip label="Cancellation Pending" color="warning" size="small" />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                  <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'start_date'}
                        direction={sortBy === 'start_date' ? sortOrder : 'asc'}
                        onClick={() => handleSortChange('start_date')}
                      >
                        Start Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'end_date'}
                        direction={sortBy === 'end_date' ? sortOrder : 'asc'}
                        onClick={() => handleSortChange('end_date')}
                      >
                        End Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'total_days'}
                        direction={sortBy === 'total_days' ? sortOrder : 'asc'}
                        onClick={() => handleSortChange('total_days')}
                      >
                        Total Days
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaves.map((leave) => (
                    <TableRow key={leave.leave_id} hover>
                      <TableCell>{leave.start_date}</TableCell>
                      <TableCell>{leave.end_date}</TableCell>
                      <TableCell>{leave.total_days}</TableCell>
                      <TableCell>
                        <StatusChip status={leave.status} />
                        {leave.status === 'REJECTED' && leave.rejection_reason && (
                          <Typography variant="caption" display="block" color="error" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                            Reason: {leave.rejection_reason}
                          </Typography>
                        )}
                        {leave.cancellation_requested && (
                          <Box mt={0.5}><Chip label="Cancellation Pending" color="warning" size="small" /></Box>
                        )}
                      </TableCell>
                      <TableCell>{leave.reason || '-'}</TableCell>
                      <TableCell>
                        {leave.status === 'APPROVED' && !leave.cancellation_requested && (
                          <Button variant="outlined" color="error" size="small" startIcon={<CancelIcon />} onClick={() => handleCancelRequest(leave)}>Cancel</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                  </Table>
                </Paper>
              )}
              
              {/* Pagination Controls */}
              {pagination && pagination.total_pages > 1 && (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  gap={{ xs: 1, md: 2 }} 
                  mt={3}
                  flexDirection={{ xs: 'column', sm: 'row' }}
                >
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    fullWidth={isMobile}
                    sx={{ minWidth: { xs: '100%', sm: 120 }, py: { xs: 1.5, md: 1 } }}
                  >
                    Previous
                  </Button>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
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
                    fullWidth={isMobile}
                    sx={{ minWidth: { xs: '100%', sm: 120 }, py: { xs: 1.5, md: 1 } }}
                  >
                    Next
                  </Button>
                </Box>
              )}
            </>
          )}
        </Paper>
      )}

      <Dialog open={cancelDialogOpen} onClose={() => !submitting && setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave Cancellation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>Are you sure you want to request cancellation for this leave?</Typography>
          <TextField fullWidth multiline rows={3} label="Cancellation Reason (Optional)" value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} placeholder="Provide a reason for cancellation..." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submitCancellationRequest} variant="contained" color="error" disabled={submitting}>{submitting ? 'Submitting...' : 'Request Cancellation'}</Button>
        </DialogActions>
      </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
