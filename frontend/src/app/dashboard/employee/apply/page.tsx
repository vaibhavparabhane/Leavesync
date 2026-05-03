'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Typography, Paper, TextField, Button, MenuItem, Box, CircularProgress, Alert, useTheme, useMediaQuery } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useState, useEffect } from 'react';
import { LeaveController } from '@/controllers/LeaveController';
import { LeaveService } from '@/services/LeaveService';
import { LeaveType, LeaveBalance, Holiday } from '@/models/Leave';
import { leaveAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';

function extractData(result: any) {
  return Array.isArray(result.data) ? result.data : (result.data?.data || result.data || []);
}

export default function ApplyLeavePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [leaveDuration, setLeaveDuration] = useState('FULL_DAY');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [balanceWarning, setBalanceWarning] = useState('');
  const [existingLeaves, setExistingLeaves] = useState<{start_date: string; end_date: string}[]>([]);

  const isSameDay = startDate && endDate && startDate.toDateString() === endDate.toDateString();

  const calculateRequestedDays = (start: Date | null, end: Date | null, duration: string = 'FULL_DAY'): number => {
    if (!start || !end) return 0;
    return LeaveService.calculateWorkingDays(start, end, holidays, duration);
  };

  const checkBalanceSufficiency = (leaveType: string, days: number): string => {
    return LeaveService.checkBalanceSufficiency(leaveType, days, balances);
  };

  const handleLeaveTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLeaveTypeId = e.target.value;
    setLeaveTypeId(newLeaveTypeId);
    
    if (startDate && endDate) {
      const days = calculateRequestedDays(startDate, endDate, leaveDuration);
      const leaveType = leaveTypes.find(t => t.id === newLeaveTypeId);
      if (leaveType) {
        setBalanceWarning(checkBalanceSufficiency(leaveType.name, days));
      }
    }
  };

  const handleLeaveDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = e.target.value;
    setLeaveDuration(newDuration);
    
    // For half-day, set end date same as start date
    if ((newDuration === 'FIRST_HALF' || newDuration === 'SECOND_HALF') && startDate) {
      setEndDate(startDate);
    }
    
    if (startDate && endDate && leaveTypeId) {
      const days = calculateRequestedDays(startDate, endDate, newDuration);
      const leaveType = leaveTypes.find(t => t.id === leaveTypeId);
      if (leaveType) {
        setBalanceWarning(checkBalanceSufficiency(leaveType.name, days));
      }
    }
  };

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      setLoading(true);
      const result = await LeaveController.fetchLeaveTypes();
      if (result.success) {
        setLeaveTypes(extractData(result));
      }
      setLoading(false);
    };

    const fetchBalances = async () => {
      setBalanceLoading(true);
      const result = await LeaveController.fetchLeaveBalance();
      if (result.success) {
        setBalances(extractData(result));
      }
      setBalanceLoading(false);
    };

    const fetchHolidays = async () => {
      if (user?.id) {
        console.log('Fetching holidays for user:', user.id);
        const result = await LeaveController.fetchEmployeeHolidays();
        console.log('Holidays result:', result);
        const holidayData = result.data?.data || result.data || [];
        console.log('Extracted holidays:', holidayData);
        setHolidays(Array.isArray(holidayData) ? holidayData : []);
      }
    };

    const fetchExistingLeaves = async () => {
      try {
        const data = await leaveAPI.getMyLeaves(1, 100, 'PENDING');
        const approvedData = await leaveAPI.getMyLeaves(1, 100, 'APPROVED');
        const existingLeaves = [
          ...(data.leaves || []),
          ...(approvedData.leaves || [])
        ].map(leave => ({
          start_date: leave.start_date,
          end_date: leave.end_date
        }));
        setExistingLeaves(existingLeaves);
      } catch (err) {
        console.error('Failed to fetch existing leaves:', err);
      }
    };

    fetchLeaveTypes();
    fetchBalances();
    fetchHolidays();
    fetchExistingLeaves();
  }, [user]);

  const isDateDisabled = (date: Date): boolean => {
    return LeaveService.isDateDisabled(date, holidays, existingLeaves);
  };

  const handleStartDateChange = (newDate: Date | null) => {
    setStartDate(newDate);
    setError('');
    
    // For half-day, auto-set end date to same as start date
    if ((leaveDuration === 'FIRST_HALF' || leaveDuration === 'SECOND_HALF') && newDate) {
      setEndDate(newDate);
    }
    
    // If end date is same as start date, show half-day option by keeping current duration
    // Otherwise reset to FULL_DAY for multi-day leaves
    if (endDate && newDate && endDate.toDateString() !== newDate.toDateString()) {
      setLeaveDuration('FULL_DAY');
    }
    
    if (newDate && endDate && leaveTypeId) {
      const days = calculateRequestedDays(newDate, endDate, leaveDuration);
      const leaveType = leaveTypes.find(t => t.id === leaveTypeId);
      if (leaveType) {
        setBalanceWarning(checkBalanceSufficiency(leaveType.name, days));
      }
    }
  };

  const handleEndDateChange = (newDate: Date | null) => {
    setEndDate(newDate);
    setError('');
    
    // If same date selected, keep current duration (could be half-day)
    // If different dates, force FULL_DAY
    if (startDate && newDate && startDate.toDateString() !== newDate.toDateString()) {
      setLeaveDuration('FULL_DAY');
    }
    
    if (startDate && newDate && leaveTypeId) {
      const effectiveDuration = (startDate.toDateString() === newDate.toDateString()) ? leaveDuration : 'FULL_DAY';
      const days = calculateRequestedDays(startDate, newDate, effectiveDuration);
      const leaveType = leaveTypes.find(t => t.id === leaveTypeId);
      if (leaveType) {
        setBalanceWarning(checkBalanceSufficiency(leaveType.name, days));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate || !reason) {
      setError('Please fill all fields');
      return;
    }

    // Validate half-day leaves are for single day
    if ((leaveDuration === 'FIRST_HALF' || leaveDuration === 'SECOND_HALF') && 
        startDate.toDateString() !== endDate.toDateString()) {
      setError('Half-day leave must be for a single day only');
      return;
    }

    const actualDays = calculateRequestedDays(startDate, endDate, leaveDuration);
    if (actualDays === 0) {
      setError('No valid leave days selected. Please exclude weekends and holidays.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const result = await LeaveController.submitLeaveApplication({
      leave_type_id: leaveTypeId,
      start_date: LeaveService.formatDate(startDate),
      end_date: LeaveService.formatDate(endDate),
      leave_duration: leaveDuration,
      reason: reason,
    });

    if (result.success) {
      setSuccess(result.message || 'Leave applied successfully!');
      setBalanceWarning('');
      setLeaveTypeId('');
      setLeaveDuration('FULL_DAY');
      setStartDate(null);
      setEndDate(null);
      setReason('');
    } else {
      setError(result.error || 'Failed to apply for leave');
    }
    setSubmitting(false);
  };

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.EMPLOYEE_ONLY}>
      <DashboardLayout role="employee">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Your Leave Balance
          </Typography>
          {balanceLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }} role="status" aria-busy="true" aria-label="Loading leave balances">
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
              {balances.map((balance) => (
                <Box key={balance.leave_type_id}>
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderLeft: '4px solid',
                      borderColor: 'primary.main',
                      transition: 'transform 0.2s',
                      minWidth: 280,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 3,
                      },
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                      {balance.leave_type}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                          {balance.total_quota}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                          Total
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                          {balance.used_days}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                          Used
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                          {balance.remaining_days}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                          Remaining
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              ))}
              {balances.length === 0 && (
                <Box>
                  <Typography color="textSecondary" textAlign="center">
                    No leave balances found
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Typography variant="h4" fontWeight="bold" gutterBottom textAlign="center" sx={{ mb: 1, fontSize: { xs: '1.5rem', md: '2rem' } }}>
          My Leave Application
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.875rem', md: '1rem' } }} textAlign="center">
          Submit your personal leave request
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {balanceWarning && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setBalanceWarning('')}>{balanceWarning}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        
        <Paper sx={{ p: { xs: 3, md: 5 }, maxWidth: 800, mx: 'auto' }}>
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}
          sx={{
            '& .MuiButton-root': {
              py: { xs: 1.5, md: 1 }
            }
          }}>
          <TextField
            select
            label="Leave Type"
            value={leaveTypeId}
            onChange={handleLeaveTypeChange}
            disabled={loading}
            fullWidth
            InputLabelProps={{ style: { fontSize: '1.1rem' } }}
            InputProps={{ style: { fontSize: '1.05rem' } }}
          >
            {loading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              leaveTypes?.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))
            )}
          </TextField>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={handleStartDateChange}
              shouldDisableDate={isDateDisabled}
              minDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!error,
                  InputLabelProps: { style: { fontSize: '1.1rem' } },
                  InputProps: { style: { fontSize: '1.05rem' } }
                }
              }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={handleEndDateChange}
              shouldDisableDate={isDateDisabled}
              minDate={startDate || new Date()}
              disabled={!startDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!error,
                  InputLabelProps: { style: { fontSize: '1.1rem' } },
                  InputProps: { style: { fontSize: '1.05rem' } },
                  helperText: startDate && endDate && startDate.toDateString() === endDate.toDateString() ? 'Same day selected - choose duration below' : ''
                }
              }}
            />
          </LocalizationProvider>

          {isSameDay && (
            <TextField
              select
              label="Leave Duration"
              value={leaveDuration}
              onChange={handleLeaveDurationChange}
              fullWidth
              helperText="Select half-day or full-day for single date"
              InputLabelProps={{ style: { fontSize: '1.1rem' } }}
              InputProps={{ style: { fontSize: '1.05rem' } }}
            >
              <MenuItem value="FULL_DAY">Full Day</MenuItem>
              <MenuItem value="FIRST_HALF">First Half (Morning)</MenuItem>
              <MenuItem value="SECOND_HALF">Second Half (Afternoon)</MenuItem>
            </TextField>
          )}

          <TextField
            label="Reason"
            multiline
            minRows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { fontSize: '1.1rem' } }}
            InputProps={{ style: { fontSize: '1.05rem' } }}
          />

          <Button
            variant="contained"
            type="submit"
            disabled={submitting}
            fullWidth
            sx={{ 
              backgroundColor: '#1e3a5f', 
              '&:hover': { backgroundColor: '#2c5282' },
              fontSize: '1.1rem',
              py: { xs: 1.5, md: 1.5 },
              mt: 1
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" aria-label="Submitting leave application" /> : 'Apply Leave'}
          </Button>
        </Box>
      </Paper>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
