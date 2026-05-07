import React from "react";
import "./Prescription.css";

const UpcharLogo = () => (
  <div className="upchar-logo">
    <div className="upchar-icon">
      <svg width="72" height="88" viewBox="0 0 72 88" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Phone body */}
        <rect x="10" y="6" width="46" height="76" rx="7" fill="white" stroke="#222" strokeWidth="2.5" />
        <rect x="14" y="14" width="38" height="56" rx="3" fill="#f5f5f5" />
        {/* Home button */}
        <circle cx="33" cy="76" r="3.5" fill="#ccc" />
        {/* Red cross */}
        <rect x="27" y="28" width="12" height="28" rx="2.5" fill="#E63946" />
        <rect x="20" y="35" width="26" height="12" rx="2.5" fill="#E63946" />
        {/* Hand icon overlay */}
        <ellipse cx="33" cy="42" rx="9" ry="9" fill="rgba(230,57,70,0.18)" />
        {/* Connected dots - network lines */}
        {/* Top dot */}
        <circle cx="33" cy="2" r="4" fill="#E63946" />
        {/* Right dots */}
        <circle cx="68" cy="20" r="4" fill="#E63946" />
        <circle cx="68" cy="44" r="4" fill="#E63946" />
        {/* Bottom dot */}
        <circle cx="33" cy="86" r="4" fill="#222" />
        {/* Left dots */}
        <circle cx="2" cy="30" r="3" fill="#333" />
        <circle cx="2" cy="55" r="3" fill="#333" />
        {/* Lines */}
        <line x1="33" y1="6" x2="33" y2="14" stroke="#222" strokeWidth="1.5" />
        <line x1="56" y1="10" x2="64" y2="18" stroke="#222" strokeWidth="1.5" />
        <line x1="56" y1="18" x2="64" y2="22" stroke="#222" strokeWidth="1.5" />
        <line x1="56" y1="44" x2="64" y2="44" stroke="#222" strokeWidth="1.5" />
        <line x1="10" y1="20" x2="5" y2="30" stroke="#222" strokeWidth="1.5" />
        <line x1="10" y1="55" x2="5" y2="55" stroke="#222" strokeWidth="1.5" />
        <line x1="33" y1="82" x2="33" y2="86" stroke="#222" strokeWidth="1.5" />
      </svg>
    </div>
    <div className="upchar-text">
      <span className="upchar-name">UPCHAR</span>
      <span className="upchar-health">HEALTH</span>
    </div>
  </div>
);

const ClockIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="16" stroke="#444" strokeWidth="2" />
    <line x1="18" y1="10" x2="18" y2="18" stroke="#444" strokeWidth="2" strokeLinecap="round" />
    <line x1="18" y1="18" x2="24" y2="22" stroke="#444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="16" stroke="#444" strokeWidth="2" />
    <path d="M12 14c0-1.1.9-2 2-2h1l2 4-1.5 1.5c1 2 3 4 5 5L22 21l4 2v1c0 1.1-.9 2-2 2C14.3 26 12 19 12 14z" fill="#444" />
  </svg>
);

const LocationIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="16" stroke="#444" strokeWidth="2" />
    <path d="M18 10a6 6 0 0 1 6 6c0 4-6 11-6 11S12 20 12 16a6 6 0 0 1 6-6z" fill="#444" />
    <circle cx="18" cy="16" r="2" fill="white" />
  </svg>
);

const EmailIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="32" height="32" rx="4" stroke="#E63946" strokeWidth="2" fill="none" />
    <path d="M6 10l12 10L30 10" stroke="#E63946" strokeWidth="2" strokeLinecap="round" />
    <rect x="6" y="10" width="24" height="18" rx="1" stroke="#E63946" strokeWidth="1.5" fill="none" />
  </svg>
);

export default function Prescription() {
  return (
    <div className="prescription-wrapper">
      <div className="prescription-page">

        {/* Corner Accents */}
        <div className="corner-accent top-right">
          <div className="accent-stripe red" />
          <div className="accent-stripe dark" />
        </div>
        <div className="corner-accent bottom-right">
          <div className="accent-stripe dark" />
          <div className="accent-stripe red" />
        </div>
        <div className="corner-accent bottom-left">
          <div className="accent-stripe teal" />
          <div className="accent-stripe dark" />
        </div>

        {/* Header */}
        <header className="rx-header">
          <div className="doctor-info">
            <h1 className="doctor-name">
              Dr. <span className="name-red">Debasish</span> Sinha
            </h1>
            <p className="doctor-degree">BDS, MDS</p>
            <p className="doctor-specialty">Oral &amp; Maxillofacial Surgeon</p>
            <p className="doctor-title">Former Assistant Professor</p>
            <p className="doctor-college">KM Shah Dental College &amp; Hospital, Gujarat</p>
          </div>
          <UpcharLogo />
        </header>

        {/* Divider with red bullet */}
        <div className="header-divider">
          <div className="divider-line" />
          <div className="divider-bullet" />
        </div>

        {/* Patient Fields */}
        <div className="patient-fields">
          <div className="field-group name-field">
            <label>Name:</label>
            <div className="field-line" />
          </div>
          <div className="field-group short-field">
            <label>Age:</label>
            <div className="field-dots" />
          </div>
          <div className="field-group short-field">
            <label>Sex:</label>
            <div className="field-dots" />
          </div>
          <div className="field-group short-field">
            <label>Date:</label>
            <div className="field-line short" />
          </div>
        </div>

        {/* Clinical History Section */}
        <div className="clinical-section">
          <div className="clinical-left">
            <h2 className="clinical-title">Clinical History:</h2>
          </div>
          <div className="clinical-right">
            <div className="vertical-line">
              <div className="vline-dot top" />
              <div className="vline-bar" />
              <div className="vline-dot bottom" />
            </div>
          </div>
          {/* Watermark */}
          <div className="watermark">
            <div className="watermark-icon">
              <svg width="180" height="200" viewBox="0 0 72 88" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.07">
                <rect x="10" y="6" width="46" height="76" rx="7" fill="#1A9E9E" stroke="#1A9E9E" strokeWidth="2" />
                <rect x="27" y="28" width="12" height="28" rx="2.5" fill="#E63946" />
                <rect x="20" y="35" width="26" height="12" rx="2.5" fill="#E63946" />
                <circle cx="33" cy="2" r="4" fill="#E63946" />
                <circle cx="68" cy="20" r="4" fill="#E63946" />
                <circle cx="68" cy="44" r="4" fill="#E63946" />
                <circle cx="33" cy="86" r="4" fill="#222" />
                <circle cx="2" cy="30" r="3" fill="#333" />
                <circle cx="2" cy="55" r="3" fill="#333" />
              </svg>
            </div>
            <div className="watermark-text">
              <span>UPCHAR</span>
              <span>HEALTH</span>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <footer className="rx-footer">
          <div className="footer-item">
            <span className="footer-icon"><ClockIcon /></span>
            <div className="footer-content">
              <span className="footer-label">Timing:</span>
              <span className="footer-main"> Everyday</span>
              <br />
              <span className="footer-sub">
                Morning: <span className="teal-text">10:00am to 2:00pm</span>,&nbsp;
                Evening: <span className="teal-text">4:00pm to 8:00pm</span>
              </span>
            </div>
          </div>

          <div className="footer-item">
            <span className="footer-icon"><PhoneIcon /></span>
            <div className="footer-content">
              <span className="footer-label">For Appointments:</span>
              <span className="footer-main"> Call Us</span>
              <br />
              <span className="teal-text phone-text">+91 88370 65066</span>
              <span> or </span>
              <span className="teal-text phone-text">+91 88370 63445</span>
            </div>
          </div>

          <div className="footer-item">
            <span className="footer-icon"><LocationIcon /></span>
            <div className="footer-content">
              <span className="footer-label">Address:</span>
              <span className="footer-main"> THE DENTIST</span>
              <br />
              <span className="footer-sub">
                Multi Speciality <span className="teal-text">Dental &amp; Maxillofacial</span> Care
              </span>
              <br />
              <span className="footer-sub">H.G.B. Road, Opp: Sarkar Nursing Home, Agartala</span>
            </div>
          </div>

          <div className="footer-item email-item">
            <span className="footer-icon"><EmailIcon /></span>
            <div className="footer-content">
              <span className="footer-label">Email:</span>
              <span className="footer-email"> debasishsinha009@gmail.com</span>
            </div>
          </div>
        </footer>

        {/* Bottom corner accent bar */}
        <div className="bottom-bar">
          <div className="bar-teal" />
          <div className="bar-dark" />
          <div className="bar-red" />
        </div>

      </div>
    </div>
  );
}
