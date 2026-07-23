import { authApi } from '@/features/auth/authApi'

export async function registerUser(payload) {
  const { data } = await authApi.register(payload)
  return data
}

export async function loginUser(email, password, rememberMe = false) {
  const { data } = await authApi.login({ email, password, rememberMe })
  return data
}

export async function logoutUser() {
  const { data } = await authApi.logout()
  return data
}

export async function verifyEmailToken(token) {
  const { data } = await authApi.verifyEmail({ verificationToken: token })
  return data
}

export async function resendVerification(email) {
  const { data } = await authApi.resendVerification({ email })
  return data
}

export async function forgotPassword(email) {
  const { data } = await authApi.forgotPassword({ email })
  return data
}

export async function resetPassword(token, password, confirmPassword = password) {
  const { data } = await authApi.resetPassword({
    token,
    newPassword: password,
    confirmPassword,
  })
  return data
}

export async function getCurrentUser() {
  const { data } = await authApi.getMe()
  return data.user
}

export async function updateUserProfile(payload) {
  const { data } = await authApi.updateProfile(payload)
  return data.user
}

export async function changeUserPassword(payload) {
  const { data } = await authApi.changePassword(payload)
  return data
}

export async function deleteAccount(payload = {}) {
  const { data } = await authApi.deleteAccount(payload)
  return data
}
