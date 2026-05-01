import { getDaysInMonth, markHolidays, markLeaves, getDayStyle, getDayContent } from '@/utils/calendarUtils'

describe('calendarUtils', () => {
  describe('getDaysInMonth', () => {
    it('should return correct number of days for a month', () => {
      const days = getDaysInMonth(2024, 2) // March 2024
      expect(days).toHaveLength(42) // 6 weeks * 7 days
    })

    it('should mark current month days correctly', () => {
      const days = getDaysInMonth(2024, 2) // March 2024
      const currentMonthDays = days.filter(day => day.isCurrentMonth)
      expect(currentMonthDays).toHaveLength(31) // March has 31 days
    })

    it('should mark weekends correctly', () => {
      const days = getDaysInMonth(2024, 2) // March 2024
      const weekends = days.filter(day => day.isWeekend && day.isCurrentMonth)
      expect(weekends.length).toBeGreaterThan(0)
    })

    it('should mark today correctly', () => {
      const today = new Date()
      const days = getDaysInMonth(today.getFullYear(), today.getMonth())
      const todayDay = days.find(day => day.isToday)
      expect(todayDay?.date.getDate()).toBe(today.getDate())
    })
  })

  describe('markHolidays', () => {
    it('should mark holidays correctly', () => {
      const days = getDaysInMonth(2024, 2)
      const holidays = [
        { name: 'Test Holiday', date: '2024-03-15' }
      ]
      
      const markedDays = markHolidays(days, holidays)
      const holidayDay = markedDays.find(day => 
        day.date.getDate() === 15 && day.isCurrentMonth
      )
      
      expect(holidayDay?.isHoliday).toBe(true)
      expect(holidayDay?.holidayName).toBe('Test Holiday')
    })

    it('should handle holidays with time component', () => {
      const days = getDaysInMonth(2024, 2)
      const holidays = [
        { name: 'Test Holiday', date: '2024-03-15T00:00:00Z' }
      ]
      
      const markedDays = markHolidays(days, holidays)
      const holidayDay = markedDays.find(day => 
        day.date.getDate() === 15 && day.isCurrentMonth
      )
      
      expect(holidayDay?.isHoliday).toBe(true)
    })
  })

  describe('markLeaves', () => {
    it('should mark approved leaves correctly', () => {
      const days = getDaysInMonth(2024, 2)
      const leaves = [
        {
          start_date: '2024-03-10',
          end_date: '2024-03-12',
          status: 'APPROVED'
        }
      ]
      
      const markedDays = markLeaves(days, leaves)
      const leaveDays = markedDays.filter(day => 
        day.isLeave && day.isCurrentMonth
      )
      
      expect(leaveDays).toHaveLength(3) // 10, 11, 12
      expect(leaveDays[0].leaveStatus).toBe('APPROVED')
    })

    it('should not mark cancelled leaves', () => {
      const days = getDaysInMonth(2024, 2)
      const leaves = [
        {
          start_date: '2024-03-10',
          end_date: '2024-03-12',
          status: 'CANCELLED'
        }
      ]
      
      const markedDays = markLeaves(days, leaves)
      const leaveDays = markedDays.filter(day => 
        day.isLeave && day.isCurrentMonth
      )
      
      expect(leaveDays).toHaveLength(0)
    })

    it('should handle cancellation_requested flag', () => {
      const days = getDaysInMonth(2024, 2)
      const leaves = [
        {
          start_date: '2024-03-10',
          end_date: '2024-03-12',
          status: 'APPROVED',
          cancellation_requested: true
        }
      ]
      
      const markedDays = markLeaves(days, leaves)
      const cancelledDays = markedDays.filter(day => 
        day.leaveStatus === 'CANCELLED' && day.isCurrentMonth
      )
      
      expect(cancelledDays).toHaveLength(3)
    })
  })

  describe('getDayStyle', () => {
    it('should return correct style for holiday', () => {
      const day = {
        date: new Date(),
        isCurrentMonth: true,
        isToday: false,
        isWeekend: false,
        isHoliday: true,
        isLeave: false
      }
      
      const style = getDayStyle(day)
      expect(style.backgroundColor).toBe('#ddd6fe')
      expect(style.color).toBe('#5b21b6')
    })

    it('should return correct style for approved leave', () => {
      const day = {
        date: new Date(),
        isCurrentMonth: true,
        isToday: false,
        isWeekend: false,
        isHoliday: false,
        isLeave: true,
        leaveStatus: 'APPROVED'
      }
      
      const style = getDayStyle(day)
      expect(style.backgroundColor).toBe('#bbf7d0')
      expect(style.color).toBe('#166534')
    })

    it('should return correct style for weekend', () => {
      const day = {
        date: new Date(),
        isCurrentMonth: true,
        isToday: false,
        isWeekend: true,
        isHoliday: false,
        isLeave: false
      }
      
      const style = getDayStyle(day)
      expect(style.backgroundColor).toBe('#fecaca')
      expect(style.color).toBe('#991b1b')
    })
  })

  describe('getDayContent', () => {
    it('should return day number and holiday name', () => {
      const day = {
        date: new Date(2024, 2, 15),
        isCurrentMonth: true,
        isToday: false,
        isWeekend: false,
        isHoliday: true,
        isLeave: false,
        holidayName: 'Test Holiday'
      }
      
      const content = getDayContent(day)
      expect(content.primary).toBe('15')
      expect(content.secondary).toBe('Test Holiday')
    })

    it('should return day number and leave status', () => {
      const day = {
        date: new Date(2024, 2, 15),
        isCurrentMonth: true,
        isToday: false,
        isWeekend: false,
        isHoliday: false,
        isLeave: true,
        leaveStatus: 'APPROVED'
      }
      
      const content = getDayContent(day)
      expect(content.primary).toBe('15')
      expect(content.secondary).toBe('APPROVED')
    })

    it('should return only day number for regular day', () => {
      const day = {
        date: new Date(2024, 2, 15),
        isCurrentMonth: true,
        isToday: false,
        isWeekend: false,
        isHoliday: false,
        isLeave: false
      }
      
      const content = getDayContent(day)
      expect(content.primary).toBe('15')
      expect(content.secondary).toBeUndefined()
    })
  })
})