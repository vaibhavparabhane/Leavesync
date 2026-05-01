import { LeaveController } from '@/controllers/LeaveController'
import { leaveAPI } from '@/utils/api'
import { ApiErrorHandler } from '@/utils/errorHandler'
import { ApiRetry } from '@/utils/apiRetry'
import { ApiCache } from '@/utils/apiCache'

// Mock dependencies
jest.mock('@/utils/api')
jest.mock('@/utils/errorHandler')
jest.mock('@/utils/apiRetry')
jest.mock('@/utils/apiCache')

const mockLeaveAPI = leaveAPI as jest.Mocked<typeof leaveAPI>
const mockApiErrorHandler = ApiErrorHandler as jest.Mocked<typeof ApiErrorHandler>
const mockApiRetry = ApiRetry as jest.Mocked<typeof ApiRetry>
const mockApiCache = ApiCache as jest.Mocked<typeof ApiCache>

describe('LeaveController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchLeaveRecords', () => {
    it('should return cached data when available', async () => {
      const cachedData = [{ id: '1', status: 'Approved' }]
      mockApiCache.get.mockReturnValue(cachedData)
      mockApiCache.generateKey.mockReturnValue('cache-key')

      const result = await LeaveController.fetchLeaveRecords(1, 10)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(cachedData)
      expect(mockApiCache.get).toHaveBeenCalledWith('cache-key')
    })

    it('should fetch and cache data when not cached', async () => {
      const apiData = [{ id: '1', status: 'Pending' }]
      mockApiCache.get.mockReturnValue(null)
      mockApiCache.generateKey.mockReturnValue('cache-key')
      mockApiRetry.executeWithRetry.mockResolvedValue(apiData)

      const result = await LeaveController.fetchLeaveRecords(1, 10)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(apiData)
      expect(mockApiCache.set).toHaveBeenCalledWith('cache-key', apiData, 60000)
    })

    it('should handle API errors', async () => {
      const error = new Error('API Error')
      mockApiCache.get.mockReturnValue(null)
      mockApiRetry.executeWithRetry.mockRejectedValue(error)
      mockApiErrorHandler.getErrorMessage.mockReturnValue('API Error')

      const result = await LeaveController.fetchLeaveRecords(1, 10)

      expect(result.success).toBe(false)
      expect(result.error).toBe('API Error')
    })
  })

  describe('submitLeaveApplication', () => {
    it('should submit leave application successfully', async () => {
      const leaveData = {
        leave_type_id: 'type-1',
        start_date: '2024-03-01',
        end_date: '2024-03-03',
        reason: 'Personal work'
      }
      const apiResponse = { id: 'leave-1', status: 'Pending' }
      mockLeaveAPI.applyLeave.mockResolvedValue(apiResponse)

      const result = await LeaveController.submitLeaveApplication(leaveData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(apiResponse)
      expect(result.message).toBe('Leave applied successfully')
      expect(mockApiCache.clear).toHaveBeenCalledWith('/leaves/my')
    })

    it('should handle submission errors', async () => {
      const leaveData = {
        leave_type_id: 'type-1',
        start_date: '2024-03-01',
        end_date: '2024-03-03',
        reason: 'Personal work'
      }
      const error = new Error('Validation Error')
      mockLeaveAPI.applyLeave.mockRejectedValue(error)
      mockApiErrorHandler.getErrorMessage.mockReturnValue('Validation Error')

      const result = await LeaveController.submitLeaveApplication(leaveData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation Error')
    })
  })

  describe('approveLeave', () => {
    it('should approve leave successfully', async () => {
      const apiResponse = { id: 'leave-1', status: 'Approved' }
      mockLeaveAPI.approveLeave.mockResolvedValue(apiResponse)

      const result = await LeaveController.approveLeave('leave-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(apiResponse)
      expect(result.message).toBe('Leave approved successfully')
      expect(mockLeaveAPI.approveLeave).toHaveBeenCalledWith('leave-1', false)
    })

    it('should handle approval errors', async () => {
      const error = new Error('Approval Error')
      mockLeaveAPI.approveLeave.mockRejectedValue(error)
      mockApiErrorHandler.getErrorMessage.mockReturnValue('Approval Error')

      const result = await LeaveController.approveLeave('leave-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Approval Error')
    })
  })

  describe('fetchLeaveBalance', () => {
    it('should return array data directly', async () => {
      const balanceData = [{ leave_type: 'Annual', remaining: 15 }]
      mockLeaveAPI.getMyBalance.mockResolvedValue(balanceData)

      const result = await LeaveController.fetchLeaveBalance()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(balanceData)
    })

    it('should extract data from response object', async () => {
      const balanceData = [{ leave_type: 'Annual', remaining: 15 }]
      const response = { data: balanceData }
      mockLeaveAPI.getMyBalance.mockResolvedValue(response)

      const result = await LeaveController.fetchLeaveBalance()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(balanceData)
    })
  })

  describe('fetchLeaveTypes', () => {
    it('should return cached leave types', async () => {
      const leaveTypes = [{ id: '1', name: 'Annual' }]
      mockApiCache.get.mockReturnValue(leaveTypes)

      const result = await LeaveController.fetchLeaveTypes()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(leaveTypes)
    })

    it('should fetch and cache leave types', async () => {
      const leaveTypes = [{ id: '1', name: 'Annual' }]
      mockApiCache.get.mockReturnValue(null)
      mockApiRetry.executeWithRetry.mockResolvedValue(leaveTypes)

      const result = await LeaveController.fetchLeaveTypes()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(leaveTypes)
      expect(mockApiCache.set).toHaveBeenCalledWith('/leaves/types', leaveTypes, 300000)
    })
  })
})