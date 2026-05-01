import { parseDate, formatDate } from './dataUtils';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  isLeave: boolean;
  leaveStatus?: string;
  holidayName?: string;
}

export const getDaysInMonth = (year: number, month: number): CalendarDay[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isHoliday: false,
      isLeave: false,
    });
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isHoliday: false,
      isLeave: false,
    });
  }
  
  // Next month days
  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isHoliday: false,
      isLeave: false,
    });
  }
  
  return days;
};

export const markHolidays = (days: CalendarDay[], holidays: any[]): CalendarDay[] => {
  return days.map(day => {
    const dateStr = formatDate(day.date);
    const holiday = holidays.find(h => {
      const holidayDate = h.date.includes('T') ? h.date.split('T')[0] : h.date;
      return holidayDate === dateStr;
    });
    return {
      ...day,
      isHoliday: !!holiday,
      holidayName: holiday?.name,
    };
  });
};

export const markLeaves = (days: CalendarDay[], leaves: any[]): CalendarDay[] => {
  return days.map(day => {
    const dateStr = formatDate(day.date);
    const leave = leaves.find(l => {
      const start = parseDate(l.start_date);
      const end = parseDate(l.end_date);
      return day.date >= start && day.date <= end;
    });
    
    // Check if leave is cancelled (either status is CANCELLED or cancellation_requested is true)
    const isCancelled = leave && (leave.status === 'CANCELLED' || leave.cancellation_requested);
    
    return {
      ...day,
      isLeave: !!leave && !isCancelled, // Don't mark as leave if cancelled
      leaveStatus: isCancelled ? 'CANCELLED' : leave?.status,
    };
  });
};

export const getDayStyle = (day: CalendarDay): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    padding: '12px',
    textAlign: 'center',
    borderRadius: '4px',
    cursor: 'pointer',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  };

  if (!day.isCurrentMonth) {
    return { ...baseStyle, opacity: 0.3, backgroundColor: '#f5f5f5', border: '1px solid #e5e7eb' };
  }

  // Handle cancelled leaves - show as white with "CANCELLED" text
  if (day.leaveStatus === 'CANCELLED') {
    return { ...baseStyle, backgroundColor: '#ffffff', color: '#6b7280', border: '1px solid #d1d5db' };
  }

  if (day.isHoliday && !day.isLeave) {
    return { ...baseStyle, backgroundColor: '#ddd6fe', color: '#5b21b6', border: '2px solid #8b5cf6' };
  }

  if (day.isLeave) {
    const colors = {
      APPROVED: { bg: '#bbf7d0', color: '#166534', border: '#22c55e' },
      PENDING: { bg: '#fed7aa', color: '#9a3412', border: '#fb923c' },
      REJECTED: { bg: '#ffcdd2', color: '#b71c1c', border: '#f87171' },
    };
    const style = colors[day.leaveStatus as keyof typeof colors] || colors.PENDING;
    return { ...baseStyle, backgroundColor: style.bg, color: style.color, border: `2px solid ${style.border}` };
  }

  if (day.isToday) {
    return { ...baseStyle, border: '2px solid #1976d2', fontWeight: 'bold', backgroundColor: '#ffffff' };
  }

  if (day.isWeekend) {
    return { ...baseStyle, backgroundColor: '#fecaca', color: '#991b1b', border: '2px solid #f87171' };
  }

  return { ...baseStyle, backgroundColor: '#ffffff', color: '#1f2937', border: '1px solid #e5e7eb' };
};

export const getDayContent = (day: CalendarDay): { primary: string; secondary?: string } => {
  const primary = day.date.getDate().toString();
  
  if (day.isHoliday && day.holidayName) {
    return { primary, secondary: day.holidayName };
  }
  
  if (day.leaveStatus === 'CANCELLED') {
    return { primary, secondary: 'CANCELLED' };
  }
  
  if (day.isLeave && day.leaveStatus) {
    return { primary, secondary: day.leaveStatus };
  }
  
  return { primary };
};
