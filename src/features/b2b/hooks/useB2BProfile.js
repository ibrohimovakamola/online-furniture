import { useCallback, useEffect, useState } from 'react'
import { b2bApi } from '../api/b2bApi'

export function useB2BProfile({ enabled = true } = {}) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await b2bApi.getProfile()
      setProfile(data.profile)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  const isVerified = profile?.status === 'verified'
  const isPending = profile?.status === 'pending' || profile?.status === 'under_review'
  const isRejected = profile?.status === 'rejected'

  return { profile, loading, error, refresh, isVerified, isPending, isRejected }
}
