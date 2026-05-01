'use client';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/common/Loading';
import { HRController } from '@/controllers/HRController';
import { Box, Typography, Paper, Chip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { dashboardStyles, tableStyles } from '@/config/styles';
import { TYPOGRAPHY } from '@/config/typography';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<{ 
    employee_count?: number; 
    active_users?: number;
    pending_leaves?: number;
    upcoming_holidays?: { id: string; name: string; date: string; location: string }[];
    total_employees?: number;
    pending_approvals?: number;
    total_holidays?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const result = await HRController.fetchDashboardStats();
    const baseStats = result.success ? result.data : { employee_count: 0, pending_leaves: 0, upcoming_holidays: [] };

    try {
      const summaryResponse = await api.get('/users/summary');
      setStats({
        ...baseStats,
        active_users: summaryResponse.data.active_users ?? baseStats.active_users ?? 0,
      });
    } catch {
      setStats({
        ...baseStats,
        active_users: baseStats.active_users ?? 0,
      });
    }

    try {
      const pendingRes = await api.get('/leaves/pending', { params: { page: 1, per_page: 5 } });
      const pendingData = pendingRes.data.data || pendingRes.data;
      setPendingLeaves(pendingData.leaves || pendingData || []);
    } catch (err) {
      console.error('Failed to fetch pending leaves');
    }

    try {
      const recentRes = await api.get('/leaves/all', { params: { page: 1, per_page: 5 } });
      const recentData = recentRes.data.data || recentRes.data;
      setRecentLeaves(recentData.leaves || recentData || []);
    } catch (err) {
      console.error('Failed to fetch recent leaves');
    }

    setLoading(false);
  };

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
      <DashboardLayout role="admin">
      {loading ? (
        <Loading message="Loading dashboard..." />
      ) : (
        <>
          <Box sx={dashboardStyles.statsContainer}>
            <Paper sx={dashboardStyles.statsCard}>
              <Typography variant="h6" color="primary">Active Users</Typography>
              <Typography sx={TYPOGRAPHY.STAT_NUMBER}>{stats?.active_users ?? 0}</Typography>
              <Typography sx={TYPOGRAPHY.STAT_LABEL}>All active users in system</Typography>
            </Paper>
            <Paper sx={{ ...dashboardStyles.statsCard, cursor: 'pointer' }} onClick={() => router.push('/dashboard/admin/createuser')}>
              <Typography variant="h6" color="primary">Total Employees</Typography>
              <Typography sx={TYPOGRAPHY.STAT_NUMBER}>{stats?.employee_count ?? stats?.total_employees ?? 0}</Typography>
              <Typography sx={TYPOGRAPHY.STAT_LABEL}>Manage employee records</Typography>
            </Paper>
            <Paper sx={{ ...dashboardStyles.statsCard, cursor: 'pointer' }} onClick={() => router.push('/dashboard/admin/holidays')}>
              <Typography variant="h6" color="primary">Total Holidays</Typography>
              <Typography sx={TYPOGRAPHY.STAT_NUMBER}>{stats?.upcoming_holidays?.length ?? stats?.total_holidays ?? 0}</Typography>
              <Typography sx={TYPOGRAPHY.STAT_LABEL}>Holidays this year</Typography>
            </Paper>
            <Paper sx={{ ...dashboardStyles.statsCard, cursor: 'pointer' }} onClick={() => router.push('/dashboard/admin/leavemanagement/approvals')}>
              <Typography variant="h6" color="primary">Pending Approvals</Typography>
              <Typography sx={TYPOGRAPHY.STAT_NUMBER}>{stats?.pending_leaves ?? stats?.pending_approvals ?? 0}</Typography>
              <Typography sx={TYPOGRAPHY.STAT_LABEL}>Review pending requests</Typography>
            </Paper>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mt: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={TYPOGRAPHY.CARD_TITLE}>Pending Approvals</Typography>
                <Button size="small" onClick={() => router.push('/dashboard/admin/leavemanagement/approvals')}>View All</Button>
              </Box>
              {pendingLeaves.length === 0 ? (
                <Typography sx={TYPOGRAPHY.BODY_TEXT} color="text.secondary">No pending approvals</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Duration</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingLeaves.map((leave) => (
                        <TableRow key={leave.id} sx={tableStyles.row}>
                          <TableCell><Typography sx={TYPOGRAPHY.TABLE_CELL}>{leave.employee_name}</Typography></TableCell>
                          <TableCell><Typography sx={TYPOGRAPHY.TABLE_CELL}>{leave.leave_type}</Typography></TableCell>
                          <TableCell><Typography sx={TYPOGRAPHY.TABLE_CELL}>{leave.total_days} days</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={TYPOGRAPHY.CARD_TITLE}>Upcoming Holidays</Typography>
                <Button size="small" onClick={() => router.push('/dashboard/admin/holidays')}>Manage</Button>
              </Box>
              {!stats?.upcoming_holidays || stats.upcoming_holidays.length === 0 ? (
                <Typography sx={TYPOGRAPHY.BODY_TEXT} color="text.secondary">No upcoming holidays</Typography>
              ) : (
                <Box>
                  {stats.upcoming_holidays.slice(0, 5).map((holiday) => (
                    <Box key={holiday.id} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
                      <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, fontWeight: 600 }}>{holiday.name}</Typography>
                      <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, fontSize: '0.875rem', color: 'text.secondary' }}>
                        {holiday.date} • {holiday.location}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={TYPOGRAPHY.CARD_TITLE}>Recent Leave Requests</Typography>
              <Button size="small" onClick={() => router.push('/dashboard/admin/leavemanagement/employeeleaves')}>View All</Button>
            </Box>
            {recentLeaves.length === 0 ? (
              <Typography sx={TYPOGRAPHY.BODY_TEXT} color="text.secondary">No recent leave requests</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Leave Type</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Days</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentLeaves.map((leave) => (
                      <TableRow key={leave.id} sx={tableStyles.row}>
                        <TableCell><Typography sx={TYPOGRAPHY.TABLE_CELL}>{leave.employee_name}</Typography></TableCell>
                        <TableCell><Typography sx={TYPOGRAPHY.TABLE_CELL}>{leave.leave_type}</Typography></TableCell>
                        <TableCell><Typography sx={TYPOGRAPHY.TABLE_CELL}>{leave.start_date}</Typography></TableCell>
                        <TableCell><Typography sx={TYPOGRAPHY.TABLE_CELL}>{leave.end_date}</Typography></TableCell>
                        <TableCell><Typography sx={TYPOGRAPHY.TABLE_CELL}>{leave.total_days}</Typography></TableCell>
                        <TableCell>
                          <Chip 
                            label={leave.status} 
                            size="small" 
                            color={leave.status === 'APPROVED' ? 'success' : leave.status === 'PENDING' ? 'warning' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
