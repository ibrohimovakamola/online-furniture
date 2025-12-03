import React from 'react'
import { Link } from 'react-router-dom'
import '../assets/styles/notfound.scss'

const NotFound = () => {
  return (
    <div className='container'>
        <div className="notfound">
            <h2 className="notfound-title">404 Not Found</h2>
            <p className="notfound-text">Your visited page not found. You may go home page.</p>
            <Link to={'/'} className="notfound-btn">Back to home page</Link>
        </div>
    </div>
  )
}

export default NotFound