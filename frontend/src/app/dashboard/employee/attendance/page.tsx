'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Typography, 
  Paper, 
  Box, 
  CircularProgress, 
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useState, useEffect } from 'react';
import { hrAPI, leaveAPI, getStoredUser } from '@/utils/api';
import { Holiday, LeaveRecord } from '@/models/Leave';

interface DayInfo {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isLeave: boolean;
  leaveType?: string;
  leaveStatus?: string;
  leaveReason?: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [userLocation, setUserLocation] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (user?.location) {
      setUserLocation(user.location);
    }
    fetchData();
  }, [currentDate, userLocation]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get user's ID from stored user data
      const storedUser = JSON.parse(sessionStorage.getItem('nexuspulse_user') || '{}');
      const userId = storedUser.id;
      
      // Fetch holidays assigned to this specific employee from employee_holidays table
      let employeeHolidays: Holiday[] = [];
      if (userId) {
        try {
          const holidaysData = await hrAPI.getEmployeeHolidays(userId);
          employeeHolidays = holidaysData.holidays || [];
        } catch (err) {
          console.error('Failed to fetch employee holidays:', err);
          employeeHolidays = [];
        }
      }
      setHolidays(employeeHolidays);
      console.log('Fetched employee holidays:', employeeHolidays);

      // Fetch employee's leaves (only PENDING and APPROVED, exclude REJECTED)
      const leavesData = await leaveAPI.getMyLeaves(1, 100);
      // Filter out rejected leaves - they should not appear in the attendance calendar
      const filteredLeaves = (leavesData.leaves || []).filter(
        (leave: LeaveRecord) => leave.status !== 'REJECTED'
      );
      setLeaves(filteredLeaves);

    } catch (err: any) {
      console.error('Error fetching attendance data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse date strings consistently
  const parseDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    // Handle ISO format (YYYY-MM-DD) - extract date parts directly to avoid timezone issues
    const parts = dateString.split('T')[0].split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const getDaysInMonth = (year: number, month: number): DayInfo[] => {
    const days: DayInfo[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for the first day (0 = Sunday)
    const startDayOfWeek = firstDay.getDay();
    
    // Helper function to get date string in YYYY-MM-DD format (local time)
    const getDateString = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Get days from previous month to fill first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      
      const dateString = getDateString(date);
      const holiday = holidays.find(h => h.date === dateString);
      const leave = leaves.find(l => {
        const startDate = parseDate(l.start_date);
        const endDate = parseDate(l.end_date);
        return date >= startDate && date <= endDate;
      });
      
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        isLeave: !!leave,
        leaveType: leave?.leave_type,
        leaveStatus: leave?.status,
        leaveReason: leave?.reason,
      });
    }
    
    // Add days of the current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const dateString = getDateString(date);
      console.log('Checking date:', dateString, 'Holidays:', holidays.map(h => h.date));
      
      // Check if it's a holiday
      const holiday = holidays.find(h => h.date === dateString);
      
      // Check if it's a leave day (any status)
      const leave = leaves.find(l => {
        const startDate = parseDate(l.start_date);
        const endDate = parseDate(l.end_date);
        return date >= startDate && date <= endDate;
      });
      
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isWeekend,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        isLeave: !!leave,
        leaveType: leave?.leave_type,
        leaveStatus: leave?.status,
        leaveReason: leave?.reason,
      });
    }
    
    // Add days from next month to complete the last week
    const remainingCells = 7 - (days.length % 7);
    if (remainingCells < 7) {
      for (let i = 1; i <= remainingCells; i++) {
        const date = new Date(year, month + 1, i);
        const dayOfWeek = date.getDay();
        
        const dateString = getDateString(date);
        const holiday = holidays.find(h => h.date === dateString);
        const leave = leaves.find(l => {
          const startDate = parseDate(l.start_date);
          const endDate = parseDate(l.end_date);
          return date >= startDate && date <= endDate;
        });
        
        days.push({
          date,
          day: i,
          isCurrentMonth: false,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isHoliday: !!holiday,
          holidayName: holiday?.name,
          isLeave: !!leave,
          leaveType: leave?.leave_type,
          leaveStatus: leave?.status,
          leaveReason: leave?.reason,
        });
      }
    }
    
    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getDaysInMonth(year, month);

  const getDayStyle = (dayInfo: DayInfo): object => {
    if (!dayInfo.isCurrentMonth) {
      return { 
        backgroundColor: '#f9fafb',
        color: '#9ca3af',
        border: '1px solid #e5e7eb',
      };
    }
    
    if (dayInfo.isHoliday) {
      return {
        backgroundColor: '#ddd6fe',
        color: '#5b21b6',
        border: '2px solid #8b5cf6',
      };
    }
    
    if (dayInfo.isWeekend) {
      return {
        backgroundColor: '#fecaca',
        color: '#991b1b',
        border: '2px solid #f87171',
      };
    }
    
    if (dayInfo.isLeave) {
      const statusColors: Record<string, { bg: string; border: string; text: string }> = {
        PENDING: { bg: '#fed7aa', border: '#fb923c', text: '#9a3412' },
        APPROVED: { bg: '#bbf7d0', border: '#22c55e', text: '#166534' },
        REJECTED: { bg: '#fca5a5', border: '#ef4444', text: '#991b1b' },
      };
      const colors = statusColors[dayInfo.leaveStatus || 'PENDING'] || statusColors.PENDING;
      return {
        backgroundColor: colors.bg,
        color: colors.text,
        border: `2px solid ${colors.border}`,
      };
    }
    
    return {
      backgroundColor: '#ffffff',
      color: '#1f2937',
      border: '1px solid #e5e7eb',
    };
  };

  const getDayContent = (dayInfo: DayInfo): string => {
    // For holidays, show the holiday name (takes priority)
    if (dayInfo.isHoliday && dayInfo.holidayName) {
      return dayInfo.holidayName;
    }
    
    // For approved leaves with reason, show the reason
    if (dayInfo.isLeave && dayInfo.leaveStatus === 'APPROVED' && dayInfo.leaveReason) {
      return dayInfo.leaveReason;
    }
    
    // For pending/rejected leaves, show status indicator
    if (dayInfo.isLeave) {
      const statusIndicator = dayInfo.leaveStatus === 'PENDING' ? '⏳' : 
                             dayInfo.leaveStatus === 'APPROVED' ? '✓' : '✕';
      return statusIndicator;
    }
    
    return '';
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['EMPLOYEE']}>
        <DashboardLayout role="employee">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['EMPLOYEE']}>
      <DashboardLayout role="employee">
        <Paper sx={{ p: 3 }}>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          
          {/* Month Navigation */}
          <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={3}>
            <IconButton onClick={handlePreviousMonth} color="primary" sx={{ border: '1px solid #e5e7eb' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" fontWeight="bold" sx={{ minWidth: 180, textAlign: 'center' }}>
              {MONTHS[month]} {year}
            </Typography>
            <IconButton onClick={handleNextMonth} color="primary" sx={{ border: '1px solid #e5e7eb' }}>
              <ArrowForwardIcon />
            </IconButton>
          </Box>

          {/* Legend */}
          <Box display="flex" flexWrap="wrap" gap={2} mb={3} justifyContent="center">
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
          
          {/* Calendar Grid */}
          <Box sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {/* Day Headers */}
            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" sx={{ backgroundColor: '#1f2937' }}>
              {DAYS_OF_WEEK.map((day) => (
                <Box
                  key={day}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    color: '#ffffff',
                    backgroundColor: '#1f2937',
                  }}
                >
                  {day}
                </Box>
              ))}
            </Box>
            
            {/* Calendar Days */}
            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" sx={{ backgroundColor: '#ffffff' }}>
              {days.map((dayInfo, index) => (
                <Box
                  key={index}
                  sx={{
                    minHeight: 140,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    textAlign: 'center',
                    ...getDayStyle(dayInfo),
                  }}
                >
                  {dayInfo.isCurrentMonth && (
                    <Typography 
                      variant="h6" 
                      fontWeight="bold"
                      sx={{ 
                        fontSize: '1.25rem',
                        mb: 1,
                      }}
                    >
                      {dayInfo.day}
                    </Typography>
                  )}
                  
                  {dayInfo.isCurrentMonth && getDayContent(dayInfo) && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '1rem',
                        fontWeight: 600,
                        wordBreak: 'break-word',
                        lineHeight: 1.3,
                      }}
                    >
                      {getDayContent(dayInfo)}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

