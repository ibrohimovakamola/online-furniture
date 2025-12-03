import React from 'react'
import "../assets/styles/contact.scss"

const Contact = () => {
  return (
    <div className='container'>
        <div className="contact">
            <div className="contact-card">
                <div className='contact-card--row'>
                    <button className='contact-card--btn'><i class="fa-solid fa-phone"></i></button>
                    <h4 className='contact-card--title'>Call to us</h4>
                </div>
                <p className='contact-card--text'>We are available 24/7, days a week</p>
                <p className='contact-card--text'>Phone: +998 90 123 45 67</p>
                <div className="contact-card--line"></div>
                <div className='contact-card--row'>
                    <button className='contact-card--btn'><i class="fa-regular fa-envelope"></i></button>
                    <h4 className='contact-card--title'>Write to us</h4>
                </div>
                <p className='contact-card--text'>Fill out our form and we will contact you within 24 hours</p>
                <p className='contact-card--text'>Emails:customer@exclusive.com</p>
                <p className='contact-card--text'>Emails:support@exclusive.com</p>
                
            </div>
            <form className="contact-card--form">
                <div className='contact-form--row'>
                    <input placeholder='Your Name *' type="text" />
                    <input placeholder='Your Email *' type="text" />
                    <input placeholder='Your Phone *' type="text" />
                </div>
                <textarea className='contact-form--textarea' placeholder='Your Message' name="" id=""></textarea>
                <div className='contact-btn--wrapper'>
                <button className='contact-form--btn'>Send Message</button>

                </div>
            </form>
        </div>
    </div>
  )
}

export default Contact