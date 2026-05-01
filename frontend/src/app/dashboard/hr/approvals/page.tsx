'use client';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';
import { buttonStyles, statusBadgeStyles, tableStyles, dashboardStyles, formStyles } from '@/config/styles';
import { TYPOGRAPHY } from '@/config/typography';
import { COLORS } from '@/config/colors';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/common/Loading';
import { HRController } from '@/controllers/HRController';
import { LeaveController } from '@/controllers/LeaveController';
import { useAuth } from '@/context/AuthContext';
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
  TableSortLabel,
  InputAdornment,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface LeaveRequest {
  leave_id: string;
  employee_name: string;
  employee_id?: string;
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

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingLeaves, setFetchingLeaves] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Balance warning dialog state
  const [balanceWarningOpen, setBalanceWarningOpen] = useState(false);
  const [balanceWarningData, setBalanceWarningData] = useState<{
    leaveId: string;
    remaining: number;
    requested: number;
  } | null>(null);

  // Approval confirmation dialog state
  const [approvalConfirmOpen, setApprovalConfirmOpen] = useState(false);
  const [approvingLeaveId, setApprovingLeaveId] = useState<string | null>(null);

  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successType, setSuccessType] = useState<'approve' | 'reject'>('approve');

  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Sorting state
  const [sortBy, setSortBy] = useState('start_date');
  const [sortOrder, setSortOrder] = useState('asc');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const perPage = 10;

  useEffect(() => {
    fetchPendingLeaves();
  }, [page, sortBy, sortOrder, debouncedSearchQuery]);

  const fetchPendingLeaves = async () => {
    if (loading) {
      setLoading(true);
    } else {
      setFetchingLeaves(true);
    }
    // Use the specific pending leaves endpoint that includes cancellation requests
    const result = await LeaveController.fetchPendingLeaves(page, perPage, sortBy, sortOrder, debouncedSearchQuery || undefined);

    if (result.success) {
      setRequests(result.data.leaves || []);
      setPagination(result.data.pagination || null);
    }
    setLoading(false);
    setFetchingLeaves(false);
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

  const handleApprove = async (leaveId: string) => {
    setApprovingLeaveId(leaveId);
    setApprovalConfirmOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!approvingLeaveId) return;

    setApprovalConfirmOpen(false);
    setActionLoading(approvingLeaveId);
    const result = await LeaveController.approveLeave(approvingLeaveId, false);

    if (result.success) {
      if (result.data.requires_confirmation) {
        setBalanceWarningData({
          leaveId: approvingLeaveId,
          remaining: result.data.remaining,
          requested: result.data.requested
        });
        setBalanceWarningOpen(true);
      } else {
        setSuccessMessage('Leave request approved successfully!');
        setSuccessType('approve');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchPendingLeaves();
      }
    } else {
      if (result.error?.includes('balance')) {
        setBalanceWarningData({
          leaveId: approvingLeaveId,
          remaining: 0,
          requested: 0
        });
        setBalanceWarningOpen(true);
      }
    }
    setActionLoading(null);
    setApprovingLeaveId(null);
  };

  const handleForceApprove = async () => {
    if (!balanceWarningData) return;

    setActionLoading(balanceWarningData.leaveId);
    const result = await LeaveController.approveLeave(balanceWarningData.leaveId, true);

    if (result.success) {
      setBalanceWarningOpen(false);
      setBalanceWarningData(null);
      setSuccessMessage('Leave request approved successfully!');
      setSuccessType('approve');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchPendingLeaves();
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
      setSuccessMessage('Leave request rejected successfully!');
      setSuccessType('reject');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchPendingLeaves();
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
      setSuccessMessage('Cancellation approved successfully!');
      setSuccessType('approve');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchPendingLeaves();
    }
    setActionLoading(null);
  };

  const handleRejectCancellation = async (leaveId: string) => {
    setActionLoading(leaveId);
    const result = await LeaveController.rejectCancellation(leaveId);
    if (result.success) {
      setSuccessMessage('Cancellation rejected successfully!');
      setSuccessType('reject');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchPendingLeaves();
    }
    setActionLoading(null);
  };

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.HR_ONLY}>
      <DashboardLayout role="hr">
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ ...TYPOGRAPHY.PAGE_TITLE, mb: 1 }}>
            Leave Approvals
          </Typography>
          <Box sx={dashboardStyles.flexRow}>
            <Typography sx={TYPOGRAPHY.BODY_TEXT} color="text.secondary">
              You have
            </Typography>
            <Box
              component="span"
              sx={{
                backgroundColor: '#1e3a5f',
                color: '#ffffff',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              {pagination?.total_count || 0}
            </Box>
            <Typography sx={TYPOGRAPHY.BODY_TEXT} color="text.secondary">
              pending request{(pagination?.total_count || 0) !== 1 ? 's' : ''} to review
            </Typography>
          </Box>
        </Box>


        {successMessage && (
          <Box sx={{
            mb: 2,
            p: 2,
            backgroundColor: successType === 'approve' ? '#d1fae5' : '#fee2e2',
            color: successType === 'approve' ? '#059669' : '#dc2626',
            borderRadius: 1,
            fontWeight: 600
          }}>
            {successMessage}
          </Box>
        )}

        {loading ? (
          <Loading message="Loading pending approvals..." />
        ) : (
          <>
            <Box mb={3}>
              <TextField
                size="small"
                placeholder="Search by name or leave type"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                sx={{ width: 420 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
              />
            </Box>

            {requests.length === 0 ? (
              <Typography>No pending leave requests found.</Typography>
            ) : (
              <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxWidth: '100%' }}>
                  <Table sx={{ minWidth: 1200 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={tableStyles.headerCell}>
                          <TableSortLabel
                            active={sortBy === 'employee_name'}
                            direction={sortBy === 'employee_name' ? (sortOrder as 'asc' | 'desc') : 'asc'}
                            onClick={() => handleSort('employee_name')}
                          >
                            Employee
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={tableStyles.headerCell}>
                          <TableSortLabel
                            active={sortBy === 'leave_type'}
                            direction={sortBy === 'leave_type' ? (sortOrder as 'asc' | 'desc') : 'asc'}
                            onClick={() => handleSort('leave_type')}
                          >
                            Leave Type
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={tableStyles.headerCell}>
                          <TableSortLabel
                            active={sortBy === 'start_date'}
                            direction={sortBy === 'start_date' ? (sortOrder as 'asc' | 'desc') : 'asc'}
                            onClick={() => handleSort('start_date')}
                          >
                            Start Date
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={tableStyles.headerCell}>End Date</TableCell>
                        <TableCell sx={tableStyles.headerCell}>
                          <TableSortLabel
                            active={sortBy === 'total_days'}
                            direction={sortBy === 'total_days' ? (sortOrder as 'asc' | 'desc') : 'asc'}
                            onClick={() => handleSort('total_days')}
                          >
                            Days
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={tableStyles.headerCell}>Reason</TableCell>
                        <TableCell sx={tableStyles.headerCell}>Status</TableCell>
                        <TableCell sx={tableStyles.headerCell}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {requests.map((req) => {
                        const isOwnLeave = req.employee_id === user?.id;
                        return (
                        <TableRow key={req.leave_id} sx={tableStyles.row}>
                          <TableCell sx={tableStyles.bodyCell}>
                            <Typography sx={TYPOGRAPHY.TABLE_CELL}>
                              {req.employee_name}
                              {isOwnLeave && <Typography component="span" sx={{ ml: 1, color: 'primary.main', fontWeight: 600 }}>(You)</Typography>}
                            </Typography>
                          </TableCell>
                          <TableCell sx={tableStyles.bodyCell}><Typography sx={TYPOGRAPHY.TABLE_CELL}>{req.leave_type}</Typography></TableCell>
                          <TableCell sx={tableStyles.bodyCell}><Typography sx={TYPOGRAPHY.TABLE_CELL}>{req.start_date}</Typography></TableCell>
                          <TableCell sx={tableStyles.bodyCell}><Typography sx={TYPOGRAPHY.TABLE_CELL}>{req.end_date}</Typography></TableCell>
                          <TableCell sx={tableStyles.bodyCell}><Typography sx={TYPOGRAPHY.TABLE_CELL}>{req.total_days}</Typography></TableCell>
                          <TableCell sx={tableStyles.bodyCell}><Typography sx={TYPOGRAPHY.TABLE_CELL}>{req.reason}</Typography></TableCell>
                          <TableCell sx={tableStyles.bodyCell}>
                            {req.status === 'PENDING' ? (
                              <Box sx={{ backgroundColor: COLORS.STATUS.PENDING.background, color: COLORS.STATUS.PENDING.main, px: 2, py: 0.5, borderRadius: 1, fontWeight: 600, fontSize: '0.75rem', border: `1px solid ${COLORS.STATUS.PENDING.border}` }}>PENDING</Box>
                            ) : (
                              <Box sx={{ backgroundColor: COLORS.STATUS.PENDING.background, color: COLORS.STATUS.PENDING.main, px: 2, py: 0.5, borderRadius: 1, fontWeight: 600, fontSize: '0.75rem', border: `1px solid ${COLORS.STATUS.PENDING.border}` }}>CANCELLATION REQUESTED</Box>
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            {isOwnLeave ? (
                              <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, fontSize: '0.875rem', color: 'text.secondary', fontStyle: 'italic' }}>
                                Cannot approve own {req.status === 'PENDING' ? 'leave' : 'cancellation'}
                              </Typography>
                            ) : (
                              <Box display="flex" gap={1}>
                                {req.status === 'PENDING' ? (
                                  <>
                                    <Button variant="contained" size="small" onClick={() => handleApprove(req.leave_id)} disabled={actionLoading === req.leave_id} sx={{ backgroundColor: COLORS.ACTIONS.APPROVE.main, '&:hover': { backgroundColor: COLORS.ACTIONS.APPROVE.hover } }}>
                                      {actionLoading === req.leave_id ? 'Loading...' : 'Approve'}
                                    </Button>
                                    <Button variant="contained" size="small" onClick={() => openRejectDialog(req.leave_id)} disabled={actionLoading === req.leave_id} sx={{ backgroundColor: COLORS.ACTIONS.REJECT.main, '&:hover': { backgroundColor: COLORS.ACTIONS.REJECT.hover } }}>
                                      {actionLoading === req.leave_id ? 'Loading...' : 'Reject'}
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button variant="contained" size="small" onClick={() => handleApproveCancellation(req.leave_id)} disabled={actionLoading === req.leave_id} sx={{ backgroundColor: COLORS.ACTIONS.APPROVE.main, '&:hover': { backgroundColor: COLORS.ACTIONS.APPROVE.hover } }}>
                                      {actionLoading === req.leave_id ? 'Loading...' : 'Approve Cancellation'}
                                    </Button>
                                    <Button variant="contained" size="small" onClick={() => handleRejectCancellation(req.leave_id)} disabled={actionLoading === req.leave_id} sx={{ backgroundColor: COLORS.ACTIONS.REJECT.main, '&:hover': { backgroundColor: COLORS.ACTIONS.REJECT.hover } }}>
                                      {actionLoading === req.leave_id ? 'Loading...' : 'Reject Cancellation'}
                                    </Button>
                                  </>
                                )}
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* Pagination Controls */}
            {pagination && pagination.total_pages > 1 && requests.length > 0 && (
              <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={3}>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  sx={{ backgroundColor: '#1e3a5f', '&:hover': { backgroundColor: '#2c5282' } }}
                >
                  Previous
                </Button>
                <Typography variant="body1" fontWeight={500}>
                  Page {pagination.page} of {pagination.total_pages}
                  <Typography component="span" variant="caption" color="text.secondary">
                    {' '}({pagination.total_count} total records)
                  </Typography>
                </Typography>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.total_pages}
                  sx={{ backgroundColor: '#1e3a5f', '&:hover': { backgroundColor: '#2c5282' } }}
                >
                  Next
                </Button>
              </Box>
            )}
          </>
        )}
      </DashboardLayout>

      {/* Approval Confirmation Dialog */}
      <Dialog open={approvalConfirmOpen} onClose={() => setApprovalConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Approval</DialogTitle>
        <DialogContent>
          <Typography sx={TYPOGRAPHY.BODY_TEXT}>
            Are you sure you want to approve this leave request?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmApprove} color="success" variant="contained">
            Yes, Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleCloseRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Leave Request</DialogTitle>
        <DialogContent>
          <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, mb: 2 }} color="text.secondary">
            Please provide a reason for rejecting this leave request. This will be visible to the employee.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="rejectionReason"
            label="Rejection Reason"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmReject} color="error" variant="contained">
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Balance Warning Dialog */}
      <Dialog open={balanceWarningOpen} onClose={handleCloseBalanceWarning} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Insufficient Leave Balance
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, mb: 2 }}>
            The employee does not have enough leave balance for this request.
          </Typography>
          <Box sx={{ bgcolor: 'warning.light', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography sx={TYPOGRAPHY.BODY_TEXT}>
              <strong>Available Balance:</strong> {balanceWarningData?.remaining || 0} days
            </Typography>
            <Typography sx={TYPOGRAPHY.BODY_TEXT}>
              <strong>Requested Days:</strong> {balanceWarningData?.requested || 0} days
            </Typography>
            <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, mt: 1, color: 'warning.dark' }}>
              <strong>Shortfall:</strong> {(balanceWarningData?.requested || 0) - (balanceWarningData?.remaining || 0)} days
            </Typography>
          </Box>
          <Typography sx={TYPOGRAPHY.BODY_TEXT} color="text.secondary">
            Do you want to approve this leave anyway? This will allow the leave balance to go into negative (overdraft).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBalanceWarning} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleForceApprove} color="warning" variant="contained" disabled={actionLoading !== null}>
            {actionLoading ? 'Approving...' : 'Yes, Approve Anyway'}
          </Button>
        </DialogActions>
      </Dialog>
    </ProtectedRoute>
  );
}
