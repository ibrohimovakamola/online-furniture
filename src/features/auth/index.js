/** Public barrel — do not import this from files inside features/auth/ (avoids circular deps) */
export {
  default as authReducer,
  loginUser,
  registerUser,
  fetchCurrentUser,
  rehydrateSession,
  logoutUser,
  logout,
  clearAuthError,
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectIsAdmin,
  selectIsAuthReady,
} from './authSlice'

export { default as apiClient, authApi, attachTokenGetter } from './authApi'
export { getStoredToken, persistAuthSession, clearAuthSession } from './authStorage'
export * from './permissions'
