import { authAPI, leaveAPI, hrAPI } from '@/utils/api'

// Mock the API functions directly
jest.mock('@/utils/api', () => ({
  authAPI: {
    login: jest.fn(),
    logout: jest.fn(),
  },
  leaveAPI: {
    getMyLeaves: jest.fn(),
    applyLeave: jest.fn(),
    approveLeave: jest.fn(),
    rejectLeave: jest.fn(),
    getMyBalance: jest.fn(),
    getLeaveTypes: jest.fn(),
  },
  hrAPI: {
    getDashboardStats: jest.fn(),
    getEmployees: jest.fn(),
    createHoliday: jest.fn(),
    updateEmployeeLedger: jest.fn(),
  },
}))

const mockAuthAPI = authAPI as jest.Mocked<typeof authAPI>
const mockLeaveAPI = leaveAPI as jest.Mocked<typeof leaveAPI>
const mockHrAPI = hrAPI as jest.Mocked<typeof hrAPI>

describe('API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authAPI', () => {
    it('should login successfully', async () => {
      const mockResult = { user: { id: '1', email: 'test@example.com' }, token: 'jwt-token' }
      mockAuthAPI.login.mockResolvedValue(mockResult)

      const result = await authAPI.login('test@example.com', 'password')

      expect(mockAuthAPI.login).toHaveBeenCalledWith('test@example.com', 'password')
      expect(result).toEqual(mockResult)
    })

    it('should logout successfully', async () => {
      const mockResult = { message: 'Logged out successfully' }
      mockAuthAPI.logout.mockResolvedValue(mockResult)

      const result = await authAPI.logout()

      expect(mockAuthAPI.logout).toHaveBeenCalled()
      expect(result).toEqual(mockResult)
    })
  })

  describe('leaveAPI', () => {
    it('should fetch user leaves', async () => {
      const mockLeaves = [{ id: '1', status: 'Approved' }]
      mockLeaveAPI.getMyLeaves.mockResolvedValue(mockLeaves)

      const result = await leaveAPI.getMyLeaves(1, 10)

      expect(mockLeaveAPI.getMyLeaves).toHaveBeenCalledWith(1, 10)
      expect(result).toEqual(mockLeaves)
    })

    it('should apply for leave', async () => {
      const leaveData = {
        leave_type_id: 'type-1',
        start_date: '2024-03-01',
        end_date: '2024-03-03',
        reason: 'Personal work'
      }
      const mockResult = { id: 'leave-1', status: 'Pending' }
      mockLeaveAPI.applyLeave.mockResolvedValue(mockResult)

      const result = await leaveAPI.applyLeave(leaveData)

      expect(mockLeaveAPI.applyLeave).toHaveBeenCalledWith(leaveData)
      expect(result).toEqual(mockResult)
    })

    it('should approve leave', async () => {
      const mockResult = { id: 'leave-1', status: 'Approved' }
      mockLeaveAPI.approveLeave.mockResolvedValue(mockResult)

      const result = await leaveAPI.approveLeave('leave-1', false)

      expect(mockLeaveAPI.approveLeave).toHaveBeenCalledWith('leave-1', false)
      expect(result).toEqual(mockResult)
    })

    it('should reject leave', async () => {
      const mockResult = { id: 'leave-1', status: 'Rejected' }
      mockLeaveAPI.rejectLeave.mockResolvedValue(mockResult)

      const result = await leaveAPI.rejectLeave('leave-1', 'Insufficient balance')

      expect(mockLeaveAPI.rejectLeave).toHaveBeenCalledWith('leave-1', 'Insufficient balance')
      expect(result).toEqual(mockResult)
    })

    it('should fetch leave balance', async () => {
      const mockBalance = [{ leave_type: 'Annual', remaining: 15 }]
      mockLeaveAPI.getMyBalance.mockResolvedValue(mockBalance)

      const result = await leaveAPI.getMyBalance()

      expect(mockLeaveAPI.getMyBalance).toHaveBeenCalled()
      expect(result).toEqual(mockBalance)
    })

    it('should fetch leave types', async () => {
      const mockTypes = [{ id: '1', name: 'Annual' }]
      mockLeaveAPI.getLeaveTypes.mockResolvedValue(mockTypes)

      const result = await leaveAPI.getLeaveTypes()

      expect(mockLeaveAPI.getLeaveTypes).toHaveBeenCalled()
      expect(result).toEqual(mockTypes)
    })
  })

  describe('hrAPI', () => {
    it('should fetch dashboard stats', async () => {
      const mockStats = { pending_leaves: 5, total_employees: 50 }
      mockHrAPI.getDashboardStats.mockResolvedValue(mockStats)

      const result = await hrAPI.getDashboardStats()

      expect(mockHrAPI.getDashboardStats).toHaveBeenCalled()
      expect(result).toEqual(mockStats)
    })

    it('should fetch employees', async () => {
      const mockEmployees = [{ id: '1', name: 'John Doe' }]
      mockHrAPI.getEmployees.mockResolvedValue(mockEmployees)

      const result = await hrAPI.getEmployees(1, 10)

      expect(mockHrAPI.getEmployees).toHaveBeenCalledWith(1, 10)
      expect(result).toEqual(mockEmployees)
    })

    it('should create holiday', async () => {
      const holidayData = {
        name: 'New Year',
        date: '2024-01-01',
        description: 'New Year Holiday',
        location: 'All'
      }
      const mockResult = { id: 'holiday-1', ...holidayData }
      mockHrAPI.createHoliday.mockResolvedValue(mockResult)

      const result = await hrAPI.createHoliday(holidayData)

      expect(mockHrAPI.createHoliday).toHaveBeenCalledWith(holidayData)
      expect(result).toEqual(mockResult)
    })

    it('should update employee ledger', async () => {
      const updateData = {
        leave_type_id: 'type-1',
        remaining_days: 20
      }
      const mockResult = { success: true }
      mockHrAPI.updateEmployeeLedger.mockResolvedValue(mockResult)

      const result = await hrAPI.updateEmployeeLedger('user-1', updateData)

      expect(mockHrAPI.updateEmployeeLedger).toHaveBeenCalledWith('user-1', updateData)
      expect(result).toEqual(mockResult)
    })
  })
})