import { renderHook, waitFor, act } from '@testing-library/react'
import { useFetch } from '@/hooks/useFetch'

describe('useFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch data successfully on mount', async () => {
    const mockFetchFn = jest.fn().mockResolvedValue({ data: 'test data' })
    
    const { result } = renderHook(() => useFetch(mockFetchFn))
    
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toEqual({ data: 'test data' })
    expect(result.current.error).toBe(null)
    expect(mockFetchFn).toHaveBeenCalledTimes(1)
  })

  it('should not auto-fetch when autoFetch is false', () => {
    const mockFetchFn = jest.fn().mockResolvedValue({ data: 'test data' })
    
    const { result } = renderHook(() => 
      useFetch(mockFetchFn, { autoFetch: false })
    )
    
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBe(null)
    expect(mockFetchFn).not.toHaveBeenCalled()
  })

  it('should handle fetch errors', async () => {
    const mockError = new Error('Fetch failed')
    const mockFetchFn = jest.fn().mockRejectedValue(mockError)
    
    const { result } = renderHook(() => useFetch(mockFetchFn))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe('Fetch failed')
  })

  it('should handle API response errors', async () => {
    const mockError = {
      response: {
        data: {
          message: 'API Error'
        }
      }
    }
    const mockFetchFn = jest.fn().mockRejectedValue(mockError)
    
    const { result } = renderHook(() => useFetch(mockFetchFn))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.error).toBe('API Error')
  })

  it('should call onSuccess callback', async () => {
    const mockData = { data: 'test data' }
    const mockFetchFn = jest.fn().mockResolvedValue(mockData)
    const mockOnSuccess = jest.fn()
    
    renderHook(() => 
      useFetch(mockFetchFn, { onSuccess: mockOnSuccess })
    )
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockData)
    })
  })

  it('should call onError callback', async () => {
    const mockError = new Error('Fetch failed')
    const mockFetchFn = jest.fn().mockRejectedValue(mockError)
    const mockOnError = jest.fn()
    
    renderHook(() => 
      useFetch(mockFetchFn, { onError: mockOnError })
    )
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Fetch failed')
    })
  })

  it('should refetch data when refetch is called', async () => {
    const mockFetchFn = jest.fn()
      .mockResolvedValueOnce({ data: 'first call' })
      .mockResolvedValueOnce({ data: 'second call' })
    
    const { result } = renderHook(() => useFetch(mockFetchFn))
    
    await waitFor(() => {
      expect(result.current.data).toEqual({ data: 'first call' })
    })
    
    // Call refetch with act
    await act(async () => {
      await result.current.refetch()
    })
    
    expect(result.current.data).toEqual({ data: 'second call' })
    expect(mockFetchFn).toHaveBeenCalledTimes(2)
  })

  it('should handle loading state correctly during refetch', async () => {
    const mockFetchFn = jest.fn()
      .mockResolvedValueOnce({ data: 'first call' })
      .mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: 'second call' }), 50))
      )
    
    const { result } = renderHook(() => useFetch(mockFetchFn))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    // Start refetch and immediately check loading state
    act(() => {
      result.current.refetch()
    })
    
    // Check loading state synchronously after starting refetch
    expect(result.current.loading).toBe(true)
    
    // Wait for completion
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})