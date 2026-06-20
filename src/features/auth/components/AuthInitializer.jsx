import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCurrentUser, rehydrateSession, selectAuth } from '../authSlice'

export default function AuthInitializer({ children }) {
  const dispatch = useDispatch()
  const { token, initialized } = useSelector(selectAuth)

  useEffect(() => {
    if (initialized) return

    if (token) {
      dispatch(fetchCurrentUser())
    } else {
      dispatch(rehydrateSession())
    }
  }, [dispatch, token, initialized])

  return children
}
