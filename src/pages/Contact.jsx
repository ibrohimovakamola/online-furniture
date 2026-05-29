import { useState } from "react";
import "../assets/styles/contact.scss";
import BreadCrumbs from "../components/BreadCrumbs";
import { contactApi } from "../api/contactApi";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

const Contact = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (feedback) setFeedback(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const { data } = await contactApi.submit(form);
      setFeedback({
        type: "success",
        text: data?.message || "Your message was sent successfully.",
      });
      setForm(INITIAL_FORM);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to send your message. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div>
        <BreadCrumbs />
        <div className="contact">
          <div className="contact-card">
            <div className="contact-card--row">
              <button type="button" className="contact-card--btn" aria-hidden>
                <i className="fa-solid fa-phone"></i>
              </button>
              <h4 className="contact-card--title">Call to us</h4>
            </div>
            <p className="contact-card--text">
              We are available 24/7, days a week
            </p>
            <p className="contact-card--text">Phone: +998 90 123 45 67</p>
            <div className="contact-card--line"></div>
            <div className="contact-card--row">
              <button type="button" className="contact-card--btn" aria-hidden>
                <i className="fa-regular fa-envelope"></i>
              </button>
              <h4 className="contact-card--title">Write to us</h4>
            </div>
            <p className="contact-card--text">
              Fill out our form and we will contact you within 24 hours
            </p>
            <p className="contact-card--text">Emails:customer@exclusive.com</p>
            <p className="contact-card--text">Emails:support@exclusive.com</p>
          </div>
          <form className="contact-card--form" onSubmit={handleSubmit} noValidate>
            <div className="contact-form--row">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your Name *"
                type="text"
                required
                disabled={loading}
                autoComplete="name"
              />
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Your Email *"
                type="email"
                required
                disabled={loading}
                autoComplete="email"
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Your Phone *"
                type="tel"
                required
                disabled={loading}
                autoComplete="tel"
              />
            </div>
            <textarea
              className="contact-form--textarea"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Your Message"
              required
              disabled={loading}
              rows={8}
            />
            <div className="contact-btn--wrapper">
              {feedback && (
                <p
                  className={`contact-form--feedback contact-form--feedback--${feedback.type}`}
                  role="status"
                  aria-live="polite"
                >
                  {feedback.text}
                </p>
              )}
              <button
                type="submit"
                className="contact-form--btn"
                disabled={loading}
              >
                {loading ? "Sending…" : "Send Message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
