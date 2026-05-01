import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AuthService } from '@/services/AuthService'
import * as apiUtils from '@/utils/api'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('@/services/AuthService')
jest.mock('@/utils/api')

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>
const mockApiUtils = apiUtils as jest.Mocked<typeof apiUtils>

// Mock window.location
Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true,
})

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApiUtils.getToken.mockReturnValue(null)
    mockApiUtils.getStoredUser.mockReturnValue(null)
    mockApiUtils.getSessionId.mockReturnValue(null)
    sessionStorage.clear()
    localStorage.clear()
  })

  const renderAuthHook = () => {
    return renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    })
  }

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')
      
      consoleError.mockRestore()
    })
  })

  describe('AuthProvider initialization', () => {
    it('should initialize with no user when no stored data', async () => {
      const { result } = renderAuthHook()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should initialize with stored user data', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        roles: ['Employee']
      }

      mockApiUtils.getToken.mockReturnValue('jwt-token')
      mockApiUtils.getStoredUser.mockReturnValue(mockUser)
      mockApiUtils.getSessionId.mockReturnValue('session-123')

      const { result } = renderAuthHook()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('login', () => {
    it('should handle successful login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        roles: ['Employee']
      }

      mockAuthService.login.mockResolvedValue({
        success: true,
        user: mockUser
      })
      mockAuthService.getRedirectPath.mockReturnValue('/dashboard/employee')
      
      // Mock sessionStorage to return token after login
      sessionStorage.setItem('nexuspulse_token', 'jwt-token')

      const { result } = renderAuthHook()

      await act(async () => {
        await result.current.login('test@example.com', 'password')
      })

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password')
      expect(window.location.href).toBe('/dashboard/employee')
    })

    it('should handle login failure', async () => {
      mockAuthService.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      })

      const { result } = renderAuthHook()

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrong-password')
        })
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('logout', () => {
    it('should call AuthService logout', () => {
      const { result } = renderAuthHook()

      act(() => {
        result.current.logout()
      })

      expect(mockAuthService.logout).toHaveBeenCalled()
    })
  })

  describe('updateUser', () => {
    it('should update user data when user exists', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        roles: ['Employee']
      }

      mockApiUtils.getToken.mockReturnValue('jwt-token')
      mockApiUtils.getStoredUser.mockReturnValue(mockUser)
      mockApiUtils.getSessionId.mockReturnValue('session-123')

      const { result } = renderAuthHook()

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      const updatedData = { email: 'updated@example.com' }

      act(() => {
        result.current.updateUser(updatedData)
      })

      expect(result.current.user).toEqual({
        ...mockUser,
        ...updatedData
      })
    })

    it('should not update when no user exists', async () => {
      const { result } = renderAuthHook()

      await waitFor(() => {
        expect(result.current.user).toBe(null)
      })

      act(() => {
        result.current.updateUser({ email: 'updated@example.com' })
      })

      expect(result.current.user).toBe(null)
    })
  })
})