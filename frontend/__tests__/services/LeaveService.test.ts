import { LeaveService } from '@/services/LeaveService'
import { LeaveBalance } from '@/models/Leave'

describe('LeaveService', () => {
  const mockBalance: LeaveBalance = {
    leave_type: 'Annual',
    total_quota: 20,
    used_days: 5,
    remaining_days: 15
  }

  describe('calculateRemainingDays', () => {
    it('should calculate remaining days correctly', () => {
      const result = LeaveService.calculateRemainingDays(mockBalance)
      expect(result).toBe(15)
    })
  })

  describe('calculateUsagePercentage', () => {
    it('should calculate usage percentage correctly', () => {
      const result = LeaveService.calculateUsagePercentage(mockBalance)
      expect(result).toBe(25) // 5/20 * 100 = 25%
    })

    it('should return 0 for zero quota', () => {
      const zeroBalance = { ...mockBalance, total_quota: 0 }
      const result = LeaveService.calculateUsagePercentage(zeroBalance)
      expect(result).toBe(0)
    })
  })

  describe('isLeaveDateValid', () => {
    it('should return valid for future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfter = new Date()
      dayAfter.setDate(dayAfter.getDate() + 2)

      const result = LeaveService.isLeaveDateValid(
        tomorrow.toISOString().split('T')[0],
        dayAfter.toISOString().split('T')[0]
      )
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should return invalid for past start date', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const today = new Date()

      const result = LeaveService.isLeaveDateValid(
        yesterday.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      )
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Start date cannot be in the past')
    })

    it('should return invalid when end date is before start date', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const today = new Date()
      today.setDate(today.getDate() + 2)

      const result = LeaveService.isLeaveDateValid(
        today.toISOString().split('T')[0],
        tomorrow.toISOString().split('T')[0]
      )
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('End date cannot be before start date')
    })
  })

  describe('getStatusColor', () => {
    it('should return correct colors for different statuses', () => {
      expect(LeaveService.getStatusColor('APPROVED')).toBe('success')
      expect(LeaveService.getStatusColor('PENDING')).toBe('warning')
      expect(LeaveService.getStatusColor('REJECTED')).toBe('error')
      expect(LeaveService.getStatusColor('UNKNOWN')).toBe('default')
    })

    it('should handle case insensitive status', () => {
      expect(LeaveService.getStatusColor('approved')).toBe('success')
      expect(LeaveService.getStatusColor('Pending')).toBe('warning')
    })
  })

  describe('validateLeaveApplication', () => {
    const validData = {
      leave_type_id: 'type-123',
      start_date: '2024-12-25',
      end_date: '2024-12-27',
      reason: 'Christmas vacation'
    }

    it('should validate correct leave application', () => {
      const result = LeaveService.validateLeaveApplication(validData)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return errors for missing fields', () => {
      const invalidData = {
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: ''
      }

      const result = LeaveService.validateLeaveApplication(invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Please select a leave type')
      expect(result.errors).toContain('Please select a start date')
      expect(result.errors).toContain('Please select an end date')
      expect(result.errors).toContain('Please provide a reason (minimum 5 characters)')
    })

    it('should validate reason length', () => {
      const shortReasonData = { ...validData, reason: 'Hi' }
      const result = LeaveService.validateLeaveApplication(shortReasonData)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Please provide a reason (minimum 5 characters)')
    })
  })

  describe('calculateWorkingDays', () => {
    it('should calculate working days excluding weekends', () => {
      const start = new Date(2024, 2, 4) // Monday
      const end = new Date(2024, 2, 8)   // Friday
      const holidays: any[] = []

      const result = LeaveService.calculateWorkingDays(start, end, holidays)
      expect(result).toBe(5)
    })

    it('should exclude holidays from working days', () => {
      const start = new Date(2024, 2, 4) // Monday
      const end = new Date(2024, 2, 8)   // Friday
      const holidays = [{ date: '2024-03-06' }] // Wednesday

      const result = LeaveService.calculateWorkingDays(start, end, holidays)
      expect(result).toBe(4)
    })

    it('should return 0.5 for half-day leaves', () => {
      const start = new Date(2024, 2, 4) // Monday
      const end = new Date(2024, 2, 4)   // Same day
      const holidays: any[] = []

      const result = LeaveService.calculateWorkingDays(start, end, holidays, 'FIRST_HALF')
      expect(result).toBe(0.5)
    })

    it('should return 0 for half-day on weekend', () => {
      const start = new Date(2024, 2, 9) // Saturday
      const end = new Date(2024, 2, 9)   // Same Saturday
      const holidays: any[] = []

      const result = LeaveService.calculateWorkingDays(start, end, holidays, 'FIRST_HALF')
      expect(result).toBe(0)
    })
  })

  describe('checkBalanceSufficiency', () => {
    const balances = [mockBalance]

    it('should return empty string for sufficient balance', () => {
      const result = LeaveService.checkBalanceSufficiency('Annual', 10, balances)
      expect(result).toBe('')
    })

    it('should return error message for insufficient balance', () => {
      const result = LeaveService.checkBalanceSufficiency('Annual', 20, balances)
      expect(result).toContain('Insufficient balance')
      expect(result).toContain('15 days remaining')
      expect(result).toContain('requesting 20 days')
    })

    it('should return empty string for unknown leave type', () => {
      const result = LeaveService.checkBalanceSufficiency('Unknown', 5, balances)
      expect(result).toBe('')
    })
  })
})