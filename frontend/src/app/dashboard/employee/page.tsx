'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/common/Loading';
import { Typography, Box, Paper, IconButton, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LeaveController } from '@/controllers/LeaveController';
import { LeaveStats, Holiday, LeaveRecord } from '@/models/Leave';
import { hrAPI, leaveAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { getDaysInMonth, markHolidays, markLeaves, getDayStyle, getDayContent, CalendarDay } from '@/utils/calendarUtils';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';
import { CALENDAR_CONSTANTS } from '@/config/calendar';
import { formatDate, parseDate } from '@/utils/dataUtils';
import { dashboardStyles } from '@/config/styles';
import { TYPOGRAPHY } from '@/config/typography';

export default function EmployeeDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);

  useEffect(() => {
    fetchData();
  }, [currentDate, user?.id]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch stats
    const statsResult = await LeaveController.fetchLeaveStats();
    if (statsResult.success) {
      setStats(statsResult.data);
    }
    
    // Fetch holidays only once when user is available
    if (user?.id && holidays.length === 0) {
      try {
        const holidaysData = await hrAPI.getEmployeeHolidays(user.id);
        setHolidays(holidaysData.holidays || []);
      } catch (err) {
        console.error('Failed to fetch holidays:', err);
      }
    }

    // Fetch leaves
    try {
      const leavesData = await leaveAPI.getMyLeaves(1, 100);
      setLeaves((leavesData.leaves || []).filter((l: LeaveRecord) => l.status !== 'REJECTED'));
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    }

    setLoading(false);
  };



  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  let days = getDaysInMonth(year, month);
  days = markHolidays(days, holidays.map(h => ({ date: h.date, name: h.name })));
  days = markLeaves(days, leaves.map(l => ({ start_date: l.start_date, end_date: l.end_date, status: l.status })));

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.EMPLOYEE_ONLY}>
      <DashboardLayout role="employee">
      {loading ? (
        <Loading message="Loading dashboard..." />
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: { xs: 2, md: 3 }, mb: 3 }}>
            <Paper sx={dashboardStyles.statsCard}>
              <Typography variant="h6" color="primary">Leave Balance</Typography>
              <Typography sx={TYPOGRAPHY.STAT_NUMBER}>{stats?.leave_balance || 0}</Typography>
              <Typography sx={TYPOGRAPHY.STAT_LABEL}>days remaining</Typography>
            </Paper>
            <Paper sx={{ ...dashboardStyles.statsCard, cursor: 'pointer' }} onClick={() => router.push('/dashboard/employee/leaves?status=APPROVED')}>
              <Typography variant="h6" color="primary">Leaves Taken</Typography>
              <Typography sx={TYPOGRAPHY.STAT_NUMBER}>{stats?.leaves_taken || 0}</Typography>
              <Typography sx={TYPOGRAPHY.STAT_LABEL}>this year</Typography>
            </Paper>
            <Paper sx={{ ...dashboardStyles.statsCard, cursor: 'pointer' }} onClick={() => router.push('/dashboard/employee/leaves?status=PENDING')}>
              <Typography variant="h6" color="primary">Pending Requests</Typography>
              <Typography sx={TYPOGRAPHY.STAT_NUMBER}>{stats?.pending_requests || 0}</Typography>
              <Typography sx={TYPOGRAPHY.STAT_LABEL}>awaiting approval</Typography>
            </Paper>
          </Box>

          <Paper sx={{ p: { xs: 2, md: 2 } }}>
            <Typography sx={{ ...TYPOGRAPHY.SECTION_HEADING, fontSize: { xs: '1.25rem', md: '1.5rem' }, mb: 2 }}>Attendance Calendar</Typography>
            
            <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={2}>
              <IconButton onClick={() => setCurrentDate(new Date(year, month - 1, 1))} color="primary">
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" fontWeight="bold" sx={{ minWidth: 180, textAlign: 'center' }}>
                {CALENDAR_CONSTANTS.MONTHS[month]} {year}
              </Typography>
              <IconButton onClick={() => setCurrentDate(new Date(year, month + 1, 1))} color="primary">
                <ArrowForwardIcon />
              </IconButton>
            </Box>

            <Box display="flex" flexWrap="wrap" gap={{ xs: 1, md: 2 }} mb={2} justifyContent="center" sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 20, height: 20, backgroundColor: '#ddd6fe', border: '2px solid #8b5cf6' }} />
                <Typography variant="body2">Holiday</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 20, height: 20, backgroundColor: '#fecaca', border: '2px solid #f87171' }} />
                <Typography variant="body2">Weekend</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 20, height: 20, backgroundColor: '#bbf7d0', border: '2px solid #22c55e' }} />
                <Typography variant="body2">Approved Leave</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 20, height: 20, backgroundColor: '#fed7aa', border: '2px solid #fb923c' }} />
                <Typography variant="body2">Pending Leave</Typography>
              </Box>
            </Box>
            
            <Box sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: { xs: 'auto', md: 'hidden' } }}>
              <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" sx={{ backgroundColor: '#1f2937', minWidth: { xs: '600px', md: 'auto' } }}>
                {CALENDAR_CONSTANTS.DAYS_OF_WEEK.map((day) => (
                  <Box key={day} sx={{ p: { xs: 1, md: 2 }, textAlign: 'center', fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' }, color: '#ffffff' }}>
                    {isMobile ? day.substring(0, 3) : day}
                  </Box>
                ))}
              </Box>
              
              <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" sx={{ backgroundColor: '#ffffff', minWidth: { xs: '600px', md: 'auto' } }}>
                {days.map((day, index) => {
                  const content = getDayContent(day);
                  return (
                    <Box key={index} sx={{ ...getDayStyle(day), p: { xs: 1, md: 2 } }}>
                      {day.isCurrentMonth && (
                        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1rem', md: '1.5rem' }, mb: { xs: 0.5, md: 1 } }}>
                          {day.date.getDate()}
                        </Typography>
                      )}
                      {day.isCurrentMonth && content.secondary && (
                        <Typography variant="body1" sx={{ fontSize: { xs: '0.7rem', md: '1.1rem' }, fontWeight: 600, wordBreak: 'break-word', lineHeight: 1.3 }}>
                          {content.secondary}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Paper>
        </>
      )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
