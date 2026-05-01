import { ApiRetry } from '@/utils/apiRetry'

describe('ApiRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return result on successful API call', async () => {
    const mockApiCall = jest.fn().mockResolvedValue('success')
    
    const result = await ApiRetry.executeWithRetry(mockApiCall)
    
    expect(result).toBe('success')
    expect(mockApiCall).toHaveBeenCalledTimes(1)
  })

  it('should retry on retryable error', async () => {
    const mockApiCall = jest.fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue('success')
    
    const result = await ApiRetry.executeWithRetry(mockApiCall, { retryDelay: 10 })
    
    expect(result).toBe('success')
    expect(mockApiCall).toHaveBeenCalledTimes(2)
  })

  it('should not retry on non-retryable error', async () => {
    const mockApiCall = jest.fn().mockRejectedValue({ response: { status: 400 } })
    
    await expect(ApiRetry.executeWithRetry(mockApiCall)).rejects.toEqual({
      response: { status: 400 }
    })
    expect(mockApiCall).toHaveBeenCalledTimes(1)
  })

  it('should retry on network error', async () => {
    const mockApiCall = jest.fn()
      .mockRejectedValueOnce({ message: 'Network Error' })
      .mockResolvedValue('success')
    
    const result = await ApiRetry.executeWithRetry(mockApiCall, { retryDelay: 10 })
    
    expect(result).toBe('success')
    expect(mockApiCall).toHaveBeenCalledTimes(2)
  })

  it('should throw error after max retries exceeded', async () => {
    const mockApiCall = jest.fn().mockRejectedValue({ response: { status: 500 } })
    
    await expect(
      ApiRetry.executeWithRetry(mockApiCall, { maxRetries: 2, retryDelay: 10 })
    ).rejects.toEqual({ response: { status: 500 } })
    
    expect(mockApiCall).toHaveBeenCalledTimes(3) // initial + 2 retries
  })

  it('should use exponential backoff for retry delay', async () => {
    const mockApiCall = jest.fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValue('success')
    
    const startTime = Date.now()
    await ApiRetry.executeWithRetry(mockApiCall, { retryDelay: 100 })
    const endTime = Date.now()
    
    // Should have some delay due to exponential backoff
    expect(endTime - startTime).toBeGreaterThan(100)
    expect(mockApiCall).toHaveBeenCalledTimes(3)
  })
})