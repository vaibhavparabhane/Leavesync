'use client';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { hrAPI } from '@/utils/api';
import { Holiday, LeaveType } from '@/models/Leave';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  leave_balances?: {
    leave_type_id: string;
    leave_type: string;
    remaining_days: number;
  }[];
}

export default function ManagerApplyLeavePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balanceWarning, setBalanceWarning] = useState<string | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [leaveType, setLeaveType] = useState('');
  const [leaveDuration, setLeaveDuration] = useState('FULL_DAY');
  const [reason, setReason] = useState('');

  const isSameDay = startDate && endDate && startDate.toDateString() === endDate.toDateString();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch fresh data without cache
      const employeesData = await hrAPI.getEmployees();
      const extractedEmployees = employeesData.data?.employees || employeesData.employees || [];
      setEmployees(extractedEmployees);
      
      const leaveTypesData = await hrAPI.getLeaveTypes();
      const extractedLeaveTypes = leaveTypesData.data || leaveTypesData || [];
      setLeaveTypes(extractedLeaveTypes);
      
      const holidaysData = await hrAPI.getHolidays(1, 100);
      const extractedHolidays = holidaysData.data?.holidays || holidaysData.holidays || [];
      setHolidays(extractedHolidays);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);;

  // Calculate requested days excluding weekends and holidays
  const calculateRequestedDays = (start: Date | null, end: Date | null, duration: string = 'FULL_DAY'): number => {
    if (!start || !end) return 0;
    
    // For half-day leaves, return 0.5
    if (duration === 'FIRST_HALF' || duration === 'SECOND_HALF') {
      const dayOfWeek = start.getDay();
      const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      
      // Check if it's a working day
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const isHoliday = holidays.some(holiday => holiday.date === dateStr);
        if (!isHoliday) {
          return 0.5;
        }
      }
      return 0;
    }
    
    // Full day calculation
    let count = 0;
    const currentDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDateObj = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    while (currentDate <= endDateObj) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      
      // Skip weekends
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Check if it's a holiday
        const isHoliday = holidays.some(holiday => holiday.date === dateStr);
        
        if (!isHoliday) {
          count++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  };

  // Check if balance is sufficient
  const checkBalanceSufficiency = (employeeId: string, leaveTypeId: string, days: number): string => {
    if (days === 0 || !employeeId || !leaveTypeId) return '';
    
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee || !employee.leave_balances) return '';
    
    const balance = employee.leave_balances.find(b => b.leave_type_id === leaveTypeId);
    if (balance && days > balance.remaining_days) {
      return `Warning: Employee has only ${balance.remaining_days} days remaining but requesting ${days} days. You can still submit for approval.`;
    }
    return '';
  };

  // Disable dates (past dates, weekends and holidays)
  const shouldDisableDate = (date: Date): boolean => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return true;
    }
    
    const dayOfWeek = date.getDay();
    // Disable weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return true;
    }
    
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.some(holiday => holiday.date === dateStr);
  };

  // Check for weekends
  const checkWeekends = (start: Date | null, end: Date | null): string | null => {
    if (!start || !end) return null;

    const startDateObj = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDateObj = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const weekendDays: string[] = [];

    const currentDate = new Date(startDateObj);
    while (currentDate <= endDateObj) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        const dayName = dayOfWeek === 0 ? 'Sunday' : 'Saturday';
        weekendDays.push(`${dayName} (${dateStr})`);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (weekendDays.length > 0) {
      return `Leave cannot be applied on weekends. Selected dates include: ${weekendDays.join(', ')}.`;
    }
    return null;
  };

  // Check for holidays overlap
  const checkHolidaysOverlap = (start: Date | null, end: Date | null): string | null => {
    if (!start || !end || holidays.length === 0) return null;

    const startDateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const endDateStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

    for (const holiday of holidays) {
      const holidayDateStr = holiday.date;
      if (holidayDateStr >= startDateStr && holidayDateStr <= endDateStr) {
        return `You have a holiday "${holiday.name}" on ${holidayDateStr}. Please select different dates.`;
      }
    }
    return null;
  };

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    // Check balance if dates and leave type are selected
    if (startDate && endDate && leaveType) {
      const days = calculateRequestedDays(startDate, endDate, leaveDuration);
      const warning = checkBalanceSufficiency(employeeId, leaveType, days);
      setBalanceWarning(warning);
    }
  };

  const handleLeaveTypeChange = (leaveTypeId: string) => {
    setLeaveType(leaveTypeId);
    // Check balance if employee and dates are selected
    if (selectedEmployee && startDate && endDate) {
      const days = calculateRequestedDays(startDate, endDate, leaveDuration);
      const warning = checkBalanceSufficiency(selectedEmployee, leaveTypeId, days);
      setBalanceWarning(warning);
    }
  };

  const handleLeaveDurationChange = (duration: string) => {
    setLeaveDuration(duration);
    // For half-day, set end date same as start date
    if ((duration === 'FIRST_HALF' || duration === 'SECOND_HALF') && startDate) {
      setEndDate(startDate);
    }
    // Check balance
    if (selectedEmployee && startDate && endDate && leaveType) {
      const days = calculateRequestedDays(startDate, endDate, duration);
      const warning = checkBalanceSufficiency(selectedEmployee, leaveType, days);
      setBalanceWarning(warning);
    }
  };

  const handleStartDateChange = (newDate: Date | null) => {
    setStartDate(newDate);
    
    // For half-day, auto-set end date to same as start date
    if ((leaveDuration === 'FIRST_HALF' || leaveDuration === 'SECOND_HALF') && newDate) {
      setEndDate(newDate);
    }
    
    // If end date is different, reset to FULL_DAY
    if (endDate && newDate && endDate.toDateString() !== newDate.toDateString()) {
      setLeaveDuration('FULL_DAY');
    }
    
    if (newDate && endDate) {
      setError('');
      
      // Check balance
      if (selectedEmployee && leaveType) {
        const days = calculateRequestedDays(newDate, endDate, leaveDuration);
        const warning = checkBalanceSufficiency(selectedEmployee, leaveType, days);
        setBalanceWarning(warning);
      }
    }
  };

  const handleEndDateChange = (newDate: Date | null) => {
    setEndDate(newDate);
    
    // If different dates, force FULL_DAY
    if (startDate && newDate && startDate.toDateString() !== newDate.toDateString()) {
      setLeaveDuration('FULL_DAY');
    }
    
    if (startDate && newDate) {
      setError('');
      
      // Check balance
      if (selectedEmployee && leaveType) {
        const effectiveDuration = (startDate.toDateString() === newDate.toDateString()) ? leaveDuration : 'FULL_DAY';
        const days = calculateRequestedDays(startDate, newDate, effectiveDuration);
        const warning = checkBalanceSufficiency(selectedEmployee, leaveType, days);
        setBalanceWarning(warning);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !startDate || !endDate || !leaveType || !reason) {
      setError('Please fill all fields');
      return;
    }

    // Validate half-day leaves are for single day
    if ((leaveDuration === 'FIRST_HALF' || leaveDuration === 'SECOND_HALF') && 
        startDate.toDateString() !== endDate.toDateString()) {
      setError('Half-day leave must be for a single day only');
      return;
    }

    // Calculate actual leave days
    const actualDays = calculateRequestedDays(startDate, endDate, leaveDuration);
    if (actualDays === 0) {
      setError('No valid leave days selected. Please exclude weekends and holidays.');
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      // Format dates as YYYY-MM-DD using local timezone (not UTC)
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      await hrAPI.applyLeaveForEmployee({
        user_id: selectedEmployee,
        leave_type_id: leaveType,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        leave_duration: leaveDuration,
        reason: reason.trim(),
      });
      
      setSuccess(`Leave applied successfully for employee! Total days: ${actualDays}`);
      setBalanceWarning('');
      setSelectedEmployee('');
      setStartDate(null);
      setEndDate(null);
      setLeaveType('');
      setLeaveDuration('FULL_DAY');
      setReason('');
    } catch (err: any) {
      console.error('Error applying leave:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to apply leave';
      setError(`Error ${err.response?.status || ''}: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={ROLE_GROUPS.HR_ONLY}>
        <DashboardLayout role="hr">
          <CircularProgress />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.HR_ONLY}>
      <DashboardLayout role="hr">
      <Typography variant="h4" fontWeight="bold" gutterBottom textAlign="center">Employee Leave Application</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }} textAlign="center">Submit leave request on behalf of an employee</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {balanceWarning && !error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setBalanceWarning(null)}>
          {balanceWarning}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 5, maxWidth: 800, mx: 'auto' }}>
        <Box display="flex" flexDirection="column" gap={3}>
          <TextField
            select
            label="Select Employee"
            value={selectedEmployee}
            onChange={(e) => handleEmployeeChange(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { fontSize: '1.1rem' } }}
            InputProps={{ style: { fontSize: '1.05rem' } }}
          >
            {employees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.full_name} ({emp.email})
              </MenuItem>
            ))}
          </TextField>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={handleStartDateChange}
              shouldDisableDate={shouldDisableDate}
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
              shouldDisableDate={shouldDisableDate}
              minDate={startDate || undefined}
              disabled={!startDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!error,
                  InputLabelProps: { style: { fontSize: '1.1rem' } },
                  InputProps: { style: { fontSize: '1.05rem' } },
                  helperText: isSameDay ? 'Same day selected - choose duration below' : ''
                }
              }}
            />
          </LocalizationProvider>

          {isSameDay && (
            <TextField
              select
              label="Leave Duration"
              value={leaveDuration}
              onChange={(e) => handleLeaveDurationChange(e.target.value)}
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
            select
            label="Leave Type"
            value={leaveType}
            onChange={(e) => handleLeaveTypeChange(e.target.value)}
            fullWidth
            InputLabelProps={{ style: { fontSize: '1.1rem' } }}
            InputProps={{ style: { fontSize: '1.05rem' } }}
          >
            {leaveTypes.map((lt) => (
              <MenuItem key={lt.id} value={lt.id}>
                {lt.name} (Quota: {lt.yearly_quota} days)
              </MenuItem>
            ))}
          </TextField>

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
            onClick={handleSubmit}
            disabled={submitting}
            fullWidth
            sx={{ 
              backgroundColor: '#1e3a5f', 
              '&:hover': { backgroundColor: '#2c5282' },
              fontSize: '1.1rem',
              py: 1.5,
              mt: 1
            }}
          >
            {submitting ? 'Applying...' : 'Apply Leave'}
          </Button>
        </Box>
      </Paper>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

