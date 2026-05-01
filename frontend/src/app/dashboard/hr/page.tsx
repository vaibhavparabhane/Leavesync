'use client';
import { ROLE_GROUPS } from '@/config/constants';
import { CALENDAR_CONSTANTS } from '@/config/calendar';
import { COLORS } from '@/config/colors';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/common/Loading';
import StatusChip from '@/components/common/StatusChip';
import { HRController } from '@/controllers/HRController';
import { LeaveController } from '@/controllers/LeaveController';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, TableSortLabel, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { useState, useEffect } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { dashboardStyles, tableStyles } from '@/config/styles';
import { TYPOGRAPHY } from '@/config/typography';
import { getDaysInMonth, markHolidays, markLeaves, getDayStyle, getDayContent, CalendarDay } from '@/utils/calendarUtils';
import { handleTableSort } from '@/utils/tableUtils';
import { useDebounce } from '@/hooks/useDebounce';
import { hrAPI, leaveAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Holiday, LeaveRecord } from '@/models/Leave';

export default function ManagerDashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fetchingLeaves, setFetchingLeaves] = useState(false);
  const [stats, setStats] = useState<{ employee_count: number; pending_leaves: number; approved_leaves: number; rejected_leaves: number; upcoming_holidays: any[] }>({ employee_count: 0, pending_leaves: 0, approved_leaves: 0, rejected_leaves: 0, upcoming_holidays: [] });
  const [leaves, setLeaves] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [sortBy, setSortBy] = useState('start_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const perPage = 10;
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRecord[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (loading) {
        setLoading(true);
      } else {
        setFetchingLeaves(true);
      }
      const statsResult = await HRController.fetchDashboardStats();
      if (statsResult.success) setStats(statsResult.data);
      
      const leavesResult = await HRController.fetchTeamLeaves(page, perPage, statusFilter || undefined, sortBy, sortOrder, debouncedSearchQuery || undefined);
      if (leavesResult.success) {
        setLeaves(leavesResult.data.leaves || []);
        setPagination(leavesResult.data.pagination || null);
      }
      
      // Fetch calendar data
      if (holidays.length === 0) {
        try {
          const holidaysData = await hrAPI.getMyHolidays();
          setHolidays(holidaysData.holidays || holidaysData || []);
        } catch (err) {
          console.error('Failed to fetch holidays:', err);
        }
      }
      
      // Fetch HR's personal leaves
      try {
        const myLeavesData = await leaveAPI.getMyLeaves(1, 100);
        setMyLeaves((myLeavesData.leaves || []).filter((l: LeaveRecord) => ['PENDING', 'APPROVED'].includes(l.status)));
      } catch (err) {
        console.error('Failed to fetch my leaves:', err);
      }
      
      setLoading(false);
      setFetchingLeaves(false);
    };
    fetchData();
  }, [page, statusFilter, sortBy, sortOrder, debouncedSearchQuery, currentDate]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const scrollToCalendar = () => {
    const calendarElement = document.getElementById('hr-calendar');
    if (calendarElement) {
      calendarElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  let days = getDaysInMonth(year, month);
  days = markHolidays(days, holidays.map(h => ({ date: h.date, name: h.name })));
  days = markLeaves(days, myLeaves.map(l => ({ start_date: l.start_date, end_date: l.end_date, status: l.status, cancellation_requested: l.cancellation_requested })));

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.HR_ONLY}>
      <DashboardLayout role="hr">
        {loading ? <Loading message="Loading dashboard..." /> : (
          <>
            <Box sx={dashboardStyles.statsContainer}>
              <Paper sx={dashboardStyles.statsCard}>
                <Typography variant="h6" color="primary">Total Employees</Typography>
                <Typography sx={TYPOGRAPHY.STAT_NUMBER}>{stats.employee_count}</Typography>
                <Typography sx={TYPOGRAPHY.STAT_LABEL}>Manage employee records</Typography>
              </Paper>
              <Paper sx={{ ...dashboardStyles.statsCard, ...dashboardStyles.interactiveCard }} onClick={scrollToCalendar}>
                <Typography variant="h6" color="primary">Total Holidays</Typography>
                <Typography sx={TYPOGRAPHY.STAT_NUMBER}>{stats.upcoming_holidays?.length || 0}</Typography>
                <Typography sx={TYPOGRAPHY.STAT_LABEL}>Holidays this year</Typography>
              </Paper>
              <Paper sx={{ ...dashboardStyles.statsCard, ...dashboardStyles.interactiveCard, borderLeft: `8px solid ${COLORS.STATUS.PENDING.main}` }} onClick={() => { setStatusFilter('PENDING'); setPage(1); }}>
                <Typography variant="h6" color="primary">Pending Leaves</Typography>
                <Typography sx={{ ...TYPOGRAPHY.STAT_NUMBER, color: COLORS.STATUS.PENDING.main }}>{stats.pending_leaves}</Typography>
                <Typography sx={TYPOGRAPHY.STAT_LABEL}>Review pending requests</Typography>
              </Paper>
              <Paper sx={{ ...dashboardStyles.statsCard, ...dashboardStyles.interactiveCard, borderLeft: `8px solid ${COLORS.STATUS.APPROVED.main}` }} onClick={() => { setStatusFilter('APPROVED'); setPage(1); }}>
                <Typography variant="h6" color="primary">Approved Leaves</Typography>
                <Typography sx={{ ...TYPOGRAPHY.STAT_NUMBER, color: COLORS.STATUS.APPROVED.main }}>{stats.approved_leaves || 0}</Typography>
                <Typography sx={TYPOGRAPHY.STAT_LABEL}>This year</Typography>
              </Paper>
              <Paper sx={{ ...dashboardStyles.statsCard, ...dashboardStyles.interactiveCard, borderLeft: `8px solid ${COLORS.STATUS.REJECTED.main}` }} onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}>
                <Typography variant="h6" color="primary">Rejected Leaves</Typography>
                <Typography sx={{ ...TYPOGRAPHY.STAT_NUMBER, color: COLORS.STATUS.REJECTED.main }}>{stats.rejected_leaves || 0}</Typography>
                <Typography sx={TYPOGRAPHY.STAT_LABEL}>This year</Typography>
              </Paper>
            </Box>

            <Paper sx={{ p: 3 }}>
              <Typography sx={TYPOGRAPHY.PAGE_TITLE} gutterBottom>Leaves Overview</Typography>
              <Typography sx={{ ...TYPOGRAPHY.PAGE_SUBTITLE, mb: 3 }}>View and manage all employee leave requests</Typography>
              
              <Box mb={3} display="flex" gap={2} alignItems="center">
                <TextField size="small" placeholder="Search by name or leave type" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} sx={{ width: 420 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Filter by Status</InputLabel>
                  <Select value={statusFilter} label="Filter by Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="APPROVED">Approved</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <TableContainer>
                <Table sx={{ minWidth: 1200 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableStyles.headerCell}>
                        <TableSortLabel
                          active={sortBy === 'employee_name'}
                          direction={sortBy === 'employee_name' ? (sortOrder as 'asc' | 'desc') : 'asc'}
                          onClick={() => handleTableSort('employee_name', sortBy, sortOrder, setSortBy, setSortOrder, setPage)}
                        >
                          Employee
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={tableStyles.headerCell}>
                        <TableSortLabel
                          active={sortBy === 'leave_type'}
                          direction={sortBy === 'leave_type' ? (sortOrder as 'asc' | 'desc') : 'asc'}
                          onClick={() => handleTableSort('leave_type', sortBy, sortOrder, setSortBy, setSortOrder, setPage)}
                        >
                          Leave Type
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={tableStyles.headerCell}>
                        <TableSortLabel
                          active={sortBy === 'start_date'}
                          direction={sortBy === 'start_date' ? (sortOrder as 'asc' | 'desc') : 'asc'}
                          onClick={() => handleTableSort('start_date', sortBy, sortOrder, setSortBy, setSortOrder, setPage)}
                        >
                          Start Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={tableStyles.headerCell}>End Date</TableCell>
                      <TableCell sx={tableStyles.headerCell}>
                        <TableSortLabel
                          active={sortBy === 'total_days'}
                          direction={sortBy === 'total_days' ? (sortOrder as 'asc' | 'desc') : 'asc'}
                          onClick={() => handleTableSort('total_days', sortBy, sortOrder, setSortBy, setSortOrder, setPage)}
                        >
                          Total Days
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={tableStyles.headerCell}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaves.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center">No leave records found</TableCell></TableRow>
                    ) : (
                      leaves.map((leave) => (
                        <TableRow key={leave.leave_id} sx={tableStyles.row}>
                          <TableCell sx={tableStyles.bodyCell}>{leave.employee_name}</TableCell>
                          <TableCell sx={tableStyles.bodyCell}>{leave.leave_type}</TableCell>
                          <TableCell sx={tableStyles.bodyCell}>{formatDate(leave.start_date)}</TableCell>
                          <TableCell sx={tableStyles.bodyCell}>{formatDate(leave.end_date)}</TableCell>
                          <TableCell sx={tableStyles.bodyCell}>{leave.total_days}</TableCell>
                          <TableCell sx={tableStyles.bodyCell}><StatusChip status={leave.status} /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {pagination && pagination.total_pages > 1 && (
                <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={3}>
                  <Button variant="outlined" size="medium" onClick={() => setPage(page - 1)} disabled={page === 1} sx={{ borderColor: '#1e3a5f', color: '#1e3a5f', '&:hover': { borderColor: '#2c5282', backgroundColor: '#f0f4f8' } }}>Previous</Button>
                  <Typography variant="body1" fontWeight={500}>Page {pagination.page} of {pagination.total_pages}<Typography component="span" variant="caption" color="text.secondary"> ({pagination.total_count} total records)</Typography></Typography>
                  <Button variant="outlined" size="medium" onClick={() => setPage(page + 1)} disabled={page >= pagination.total_pages} sx={{ borderColor: '#1e3a5f', color: '#1e3a5f', '&:hover': { borderColor: '#2c5282', backgroundColor: '#f0f4f8' } }}>Next</Button>
                </Box>
              )}
            </Paper>

            {/* Calendar Section */}
            <Paper id="hr-calendar" sx={{ p: { xs: 2, md: 2 }, mt: 3 }}>
              <Typography sx={{ ...TYPOGRAPHY.SECTION_HEADING, fontSize: { xs: '1.25rem', md: '1.5rem' }, mb: 2 }}>My Attendance Calendar</Typography>
              
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
                  <Typography variant="body2">My Approved Leave</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#fed7aa', border: '2px solid #fb923c' }} />
                  <Typography variant="body2">My Pending Leave</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#ffffff', border: '1px solid #d1d5db' }} />
                  <Typography variant="body2">Cancelled</Typography>
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

