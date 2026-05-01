'use client';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Typography, Paper, TextField, Button, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { hrAPI } from '@/utils/api';
import { TYPOGRAPHY } from '@/config/typography';
import { dashboardStyles, formStyles } from '@/config/styles';

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

interface LeaveBalance {
  leave_type_id: string;
  leave_type_name: string;
  year: number;
  total_quota: number;
  used_days: number;
  remaining_days: number;
}

export default function EditLeaveBalancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await hrAPI.getEmployees(1, 100);
      setEmployees(data.employees);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setMessage({ type: 'error', text: 'Failed to load employees' });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchEmployeeBalances = async (employeeId: string) => {
    setLoadingBalances(true);
    try {
      const data = await hrAPI.getEmployeeLedger(employeeId);
      const balances = data?.data || data || [];
      setLeaveBalances(Array.isArray(balances) ? balances : []);
    } catch (error) {
      console.error('Failed to fetch leave balances:', error);
      setMessage({ type: 'error', text: 'Failed to load leave balances' });
      setLeaveBalances([]);
    } finally {
      setLoadingBalances(false);
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setSelectedLeaveType('');
    setNewBalance('');
    setMessage({ type: '', text: '' });
    
    if (employeeId) {
      fetchEmployeeBalances(employeeId);
    } else {
      setLeaveBalances([]);
    }
  };

  const handleLeaveTypeChange = (leaveTypeId: string) => {
    setSelectedLeaveType(leaveTypeId);
    setNewBalance('');
    setMessage({ type: '', text: '' });
    
    const balance = leaveBalances.find(b => b.leave_type_id === leaveTypeId);
    if (balance) {
      setNewBalance(balance.remaining_days.toString());
    }
  };

  const handleBalanceSubmit = async () => {
    if (!selectedEmployee || !selectedLeaveType || !newBalance) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }

    try {
      await hrAPI.updateEmployeeLedger(selectedEmployee, {
        leave_type_id: selectedLeaveType,
        remaining_days: parseInt(newBalance)
      });
      
      setMessage({ type: 'success', text: 'Leave balance updated successfully!' });
      fetchEmployeeBalances(selectedEmployee);
      setSelectedLeaveType('');
      setNewBalance('');
    } catch (err: any) {
      console.error('Failed to update balance:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update leave balance' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const getCurrentBalance = () => {
    return leaveBalances.find(b => b.leave_type_id === selectedLeaveType);
  };

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
      <DashboardLayout role="admin">
        <Box sx={{ mb: 3 }}>
          <Typography sx={TYPOGRAPHY.PAGE_TITLE} gutterBottom>Edit Balance Leave</Typography>
          <Typography sx={TYPOGRAPHY.PAGE_SUBTITLE}>Update employee leave balances manually</Typography>
        </Box>

        {message.text && (
          <Alert severity={message.type as 'success' | 'error'} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        <Paper sx={{ p: 4, maxWidth: 700 }}>
          <Box sx={{ mb: 3 }}>
            <Typography sx={TYPOGRAPHY.CARD_TITLE} gutterBottom>Select Employee & Leave Type</Typography>
            <Typography sx={TYPOGRAPHY.PAGE_SUBTITLE}>Choose an employee and leave type to update their balance</Typography>
          </Box>
          <Box sx={formStyles.dialogContent}>
            <TextField
              select
              label="Select Employee"
              value={selectedEmployee}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              SelectProps={{ native: true }}
              disabled={loadingEmployees}
              fullWidth
            >
              <option value="">{loadingEmployees ? 'Loading employees...' : 'Select Employee'}</option>
              {employees?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.email})
                </option>
              ))}
            </TextField>

            {selectedEmployee && (
              <>
                <TextField
                  select
                  label="Select Leave Type"
                  value={selectedLeaveType}
                  onChange={(e) => handleLeaveTypeChange(e.target.value)}
                  SelectProps={{ native: true }}
                  disabled={loadingBalances}
                  fullWidth
                >
                  <option value="">{loadingBalances ? 'Loading balances...' : 'Select Leave Type'}</option>
                  {leaveBalances.map((balance) => (
                    <option key={balance.leave_type_id} value={balance.leave_type_id}>
                      {balance.leave_type_name} (Current: {balance.remaining_days} days)
                    </option>
                  ))}
                </TextField>

                {selectedLeaveType && getCurrentBalance() && (
                  <Paper sx={{ p: 3, bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider' }}>
                    <Typography sx={{ ...TYPOGRAPHY.CARD_TITLE, mb: 2 }}>Current Balance Details</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={TYPOGRAPHY.BODY_TEXT}>Remaining Days:</Typography>
                        <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, fontWeight: 600, color: 'primary.main' }}>
                          {getCurrentBalance()?.remaining_days} days
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={TYPOGRAPHY.BODY_TEXT}>Used Days:</Typography>
                        <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, fontWeight: 600 }}>
                          {getCurrentBalance()?.used_days} days
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={TYPOGRAPHY.BODY_TEXT}>Total Quota:</Typography>
                        <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, fontWeight: 600 }}>
                          {getCurrentBalance()?.total_quota} days
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                )}

                <TextField
                  label="New Leave Balance (Remaining Days)"
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  inputProps={{ min: 0 }}
                  helperText="Enter the new remaining days for this leave type"
                  fullWidth
                />

                <Button 
                  variant="contained"
                  size="large"
                  onClick={handleBalanceSubmit}
                  disabled={!selectedEmployee || !selectedLeaveType || !newBalance}
                  fullWidth
                  sx={{ mt: 1, py: 1.5 }}
                >
                  Update Balance
                </Button>
              </>
            )}

            {!selectedEmployee && (
              <Paper sx={{ p: 4, bgcolor: '#f8fafc', textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
                <Typography sx={TYPOGRAPHY.BODY_TEXT} color="text.secondary">
                  Please select an employee to view and update their leave balances
                </Typography>
              </Paper>
            )}
          </Box>
        </Paper>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
