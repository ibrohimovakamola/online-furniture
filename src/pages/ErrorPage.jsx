import {
  isRouteErrorResponse,
  Link,
  useRouteError,
} from 'react-router-dom'

import '../assets/styles/error-page.scss'

function getErrorContent(error) {
  if (isRouteErrorResponse(error)) {
    const is404 = error.status === 404
    return {
      status: error.status,
      title: is404 ? 'Page not found' : `Error ${error.status}`,
      message:
        (typeof error.data === 'string' ? error.data : error.data?.message) ||
        error.statusText ||
        'The requested page could not be loaded.',
      details: import.meta.env.DEV ? JSON.stringify(error.data, null, 2) : null,
    }
  }

  if (error instanceof Error) {
    return {
      status: null,
      title: 'Something went wrong',
      message: error.message || 'An unexpected error occurred.',
      details: import.meta.env.DEV ? error.stack : null,
    }
  }

  return {
    status: null,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    details: import.meta.env.DEV ? String(error) : null,
  }
}

export default function ErrorPage() {
  const error = useRouteError()
  const { status, title, message, details } = getErrorContent(error)

  return (
    <div className="error-page">
      <div className="error-page__card">
        {status && (
          <span className="error-page__status" aria-hidden="true">
            {status}
          </span>
        )}

        <h1 className="error-page__title">{title}</h1>
        <p className="error-page__message">{message}</p>

        {details && (
          <pre className="error-page__details">{details}</pre>
        )}

        <Link to="/" className="error-page__btn">
          Go Back Home
        </Link>
      </div>
    </div>
  )
}
