'use client';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';
import { COLORS } from '@/config/colors';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/common/Loading';
import StatusChip from '@/components/common/StatusChip';
import { LeaveController } from '@/controllers/LeaveController';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  TableSortLabel,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import { useState, useEffect } from 'react';

interface LeaveRequest {
  leave_id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  cancellation_requested?: boolean;
  cancellation_reason?: string;
}

interface PaginationInfo {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export default function AdminApprovalsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmingLeaveId, setConfirmingLeaveId] = useState<string | null>(null);
  const [balanceWarningOpen, setBalanceWarningOpen] = useState(false);
  const [balanceWarningData, setBalanceWarningData] = useState<{
    leaveId: string;
    remaining: number;
    requested: number;
  } | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [sortBy, setSortBy] = useState('start_date');
  const [sortOrder, setSortOrder] = useState('asc');
  const perPage = 10;

  const refreshPendingLeaves = async () => {
    setLoading(true);
    console.log('Fetching pending leaves for admin...');
    const result = await LeaveController.fetchPendingLeaves(page, perPage, sortBy, sortOrder);
    console.log('Pending leaves result:', result);
    
    if (result.success) {
      const leaves = result.data?.leaves || result.data || [];
      console.log('Extracted leaves:', leaves);
      setRequests(Array.isArray(leaves) ? leaves : []);
      setPagination(result.data?.pagination || null);
    } else {
      console.error('Failed to fetch pending leaves:', result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchPendingLeaves = async () => {
      setLoading(true);
      console.log('Fetching pending leaves for admin...');
      const result = await LeaveController.fetchPendingLeaves(page, perPage, sortBy, sortOrder);
      console.log('Pending leaves result:', result);
      
      if (result.success) {
        const leaves = result.data?.leaves || result.data || [];
        console.log('Extracted leaves:', leaves);
        setRequests(Array.isArray(leaves) ? leaves : []);
        setPagination(result.data?.pagination || null);
      } else {
        console.error('Failed to fetch pending leaves:', result.error);
      }
      setLoading(false);
    };

    fetchPendingLeaves();
  }, [page, sortBy, sortOrder]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleApprove = async (leaveId: string) => {
    setConfirmingLeaveId(leaveId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!confirmingLeaveId) return;
    
    setActionLoading(confirmingLeaveId);
    setConfirmDialogOpen(false);
    const result = await LeaveController.approveLeave(confirmingLeaveId, false);
    
    if (result.success) {
      if (result.data.requires_confirmation) {
        setBalanceWarningData({
          leaveId: confirmingLeaveId,
          remaining: result.data.remaining,
          requested: result.data.requested
        });
        setBalanceWarningOpen(true);
      } else {
        setMessage({ type: 'success', text: 'Leave approved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        refreshPendingLeaves();
      }
    } else {
      if (result.error?.includes('balance')) {
        setBalanceWarningData({
          leaveId: confirmingLeaveId,
          remaining: 0,
          requested: 0
        });
        setBalanceWarningOpen(true);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to approve leave' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
    setActionLoading(null);
    setConfirmingLeaveId(null);
  };

  const handleForceApprove = async () => {
    if (!balanceWarningData) return;
    
    setActionLoading(balanceWarningData.leaveId);
    const result = await LeaveController.approveLeave(balanceWarningData.leaveId, true);
    
    if (result.success) {
      setBalanceWarningOpen(false);
      setBalanceWarningData(null);
      setMessage({ type: 'success', text: 'Leave approved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      refreshPendingLeaves();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to approve leave' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
    setActionLoading(null);
  };

  const handleCloseBalanceWarning = () => {
    setBalanceWarningOpen(false);
    setBalanceWarningData(null);
  };

  const openRejectDialog = (leaveId: string) => {
    setRejectingLeaveId(leaveId);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingLeaveId) return;
    
    setActionLoading(rejectingLeaveId);
    const result = await LeaveController.rejectLeave(rejectingLeaveId, rejectionReason);
    
    if (result.success) {
      setRejectDialogOpen(false);
      setRejectingLeaveId(null);
      setRejectionReason('');
      setMessage({ type: 'error', text: 'Leave rejected successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      refreshPendingLeaves();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to reject leave' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
    setActionLoading(null);
  };

  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false);
    setRejectingLeaveId(null);
    setRejectionReason('');
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleApproveCancellation = async (leaveId: string) => {
    setActionLoading(leaveId);
    const result = await LeaveController.approveCancellation(leaveId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Cancellation approved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      refreshPendingLeaves();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to approve cancellation' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
    setActionLoading(null);
  };

  const handleRejectCancellation = async (leaveId: string) => {
    setActionLoading(leaveId);
    const result = await LeaveController.rejectCancellation(leaveId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Cancellation rejected successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      refreshPendingLeaves();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to reject cancellation' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
    setActionLoading(null);
  };

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
      <DashboardLayout role="admin">
      {message.text && (
        <Alert severity={message.type as 'success' | 'error'} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}
      {loading ? (
        <Loading message="Loading pending approvals..." />
      ) : requests.length === 0 ? (
        <Typography>No pending leave requests.</Typography>
      ) : (
        <>
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
                      Days
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.leave_id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{req.employee_name}</Typography>
                    </TableCell>
                    <TableCell>{req.leave_type}</TableCell>
                    <TableCell>{req.start_date}</TableCell>
                    <TableCell>{req.end_date}</TableCell>
                    <TableCell>{req.total_days}</TableCell>
                    <TableCell>{req.reason}</TableCell>
                    <TableCell>
                      {req.status === 'PENDING' ? (
                        <StatusChip status="PENDING" />
                      ) : (
                        <StatusChip status="CANCELLATION" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {req.status === 'PENDING' ? (
                          <>
                            <Button variant="contained" size="small" startIcon={<CheckCircleIcon />} onClick={() => handleApprove(req.leave_id)} disabled={actionLoading === req.leave_id} sx={{ backgroundColor: COLORS.ACTIONS.APPROVE.main, '&:hover': { backgroundColor: COLORS.ACTIONS.APPROVE.hover }, fontWeight: 600 }}>
                              {actionLoading === req.leave_id ? '...' : 'Approve'}
                            </Button>
                            <Button variant="contained" size="small" startIcon={<CancelIcon />} onClick={() => openRejectDialog(req.leave_id)} disabled={actionLoading === req.leave_id} sx={{ backgroundColor: COLORS.ACTIONS.REJECT.main, '&:hover': { backgroundColor: COLORS.ACTIONS.REJECT.hover }, fontWeight: 600 }}>
                              {actionLoading === req.leave_id ? '...' : 'Reject'}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="contained" size="small" startIcon={<CheckCircleIcon />} onClick={() => handleApproveCancellation(req.leave_id)} disabled={actionLoading === req.leave_id} sx={{ backgroundColor: COLORS.ACTIONS.APPROVE.main, '&:hover': { backgroundColor: COLORS.ACTIONS.APPROVE.hover }, fontWeight: 600 }}>
                              {actionLoading === req.leave_id ? '...' : 'Approve Cancellation'}
                            </Button>
                            <Button variant="contained" size="small" startIcon={<CancelIcon />} onClick={() => handleRejectCancellation(req.leave_id)} disabled={actionLoading === req.leave_id} sx={{ backgroundColor: COLORS.ACTIONS.REJECT.main, '&:hover': { backgroundColor: COLORS.ACTIONS.REJECT.hover }, fontWeight: 600 }}>
                              {actionLoading === req.leave_id ? '...' : 'Reject Cancellation'}
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
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

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Approval</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to approve this leave request?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmApprove} color="success" variant="contained">
            Yes, Approve
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectDialogOpen} onClose={handleCloseRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Leave Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this leave request.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog}>Cancel</Button>
          <Button onClick={handleConfirmReject} color="error" variant="contained">
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={balanceWarningOpen} onClose={handleCloseBalanceWarning} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Insufficient Leave Balance
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The employee does not have enough leave balance.
          </Typography>
          <Box sx={{ bgcolor: 'warning.light', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="body2">
              <strong>Available:</strong> {balanceWarningData?.remaining || 0} days
            </Typography>
            <Typography variant="body2">
              <strong>Requested:</strong> {balanceWarningData?.requested || 0} days
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'warning.dark' }}>
              <strong>Shortfall:</strong> {(balanceWarningData?.requested || 0) - (balanceWarningData?.remaining || 0)} days
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Approve anyway? This will allow negative balance.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBalanceWarning}>Cancel</Button>
          <Button onClick={handleForceApprove} color="warning" variant="contained" disabled={actionLoading !== null}>
            {actionLoading ? 'Approving...' : 'Yes, Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </ProtectedRoute>
  );
}
