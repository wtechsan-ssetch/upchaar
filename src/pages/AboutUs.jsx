import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext.jsx';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { MarqueeBanner } from '@/components/landing/MarqueeBanner';

// ─── Icons (inline SVG helpers) ────────────────────────────────────────────
const Icon = ({ d, size = 24, color = 'currentColor', ...rest }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...rest}>
        <path d={d} />
    </svg>
);

// ─── useInView hook ─────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setInView(true); obs.disconnect(); }
        }, { threshold });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, inView];
}

// ─── Animated counter ───────────────────────────────────────────────────────
function Counter({ target, suffix = '', duration = 1800 }) {
    const [count, setCount] = useState(0);
    const [ref, inView] = useInView(0.3);
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = target / (duration / 16);
        const t = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(t); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(t);
    }, [inView, target, duration]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Provider card ──────────────────────────────────────────────────────────
function ProviderCard({ icon, name, specialty, location, rating, tag, delay = 0, visible }) {
    return (
        <div className="about-provider-card" style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(40px)',
            transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
        }}>
            <div className="about-card-avatar">{icon}</div>
            <div className="about-card-tag">{tag}</div>
            <h4 className="about-card-name">{name}</h4>
            <p className="about-card-specialty">{specialty}</p>
            <p className="about-card-location">📍 {location}</p>
            <div className="about-card-rating">
                {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
                <span style={{ marginLeft: 6, color: '#64748b', fontSize: '0.8rem' }}>{rating}</span>
            </div>
        </div>
    );
}

// ─── Section heading ────────────────────────────────────────────────────────
function SectionHeading({ label, title, subtitle, inView }) {
    return (
        <div className="about-section-heading" style={{
            opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
            <span className="about-label-pill">{label}</span>
            <h2 className="about-section-title">{title}</h2>
            {subtitle && <p className="about-section-subtitle">{subtitle}</p>}
        </div>
    );
}

// ─── DATA ───────────────────────────────────────────────────────────────────
const STATS = [
    { value: 500, suffix: '+', label: 'Registered Doctors' },
    { value: 120, suffix: '+', label: 'Partner Clinics' },
    { value: 75,  suffix: '+', label: 'Diagnostic Centres' },
    { value: 60,  suffix: '+', label: 'Medical Stores' },
    { value: 30,  suffix: '+', label: 'Hospitals' },
    { value: 25000, suffix: '+', label: 'Patients Served' },
];

const VALUES = [
    { icon: '🏥', title: 'Accessible Healthcare', desc: 'We believe every person deserves quality healthcare regardless of location or economic status.' },
    { icon: '🔒', title: 'Privacy First', desc: 'Your health data is encrypted and protected using industry-leading security standards.' },
    { icon: '⚡', title: 'Real-Time Connectivity', desc: 'Book appointments, get prescriptions and consult doctors — all in real time.' },
    { icon: '🤝', title: 'Trusted Network', desc: 'Every provider on our platform is verified, credentialed, and regularly reviewed.' },
    { icon: '📱', title: 'Digital-First', desc: 'From registration to prescription — everything is paperless and effortlessly digital.' },
    { icon: '🌐', title: 'One Platform, All Care', desc: 'Doctors, clinics, hospitals, medicals, diagnostics — unified under one roof.' },
];

const PROVIDERS = {
    doctors: [
        { icon: '👨‍⚕️', name: 'Dr. Arjun Sharma', specialty: 'General Physician', location: 'New Delhi', rating: 4.9, tag: 'Doctor' },
        { icon: '👩‍⚕️', name: 'Dr. Priya Mehta',  specialty: 'Cardiologist',      location: 'Mumbai',    rating: 4.8, tag: 'Doctor' },
        { icon: '👨‍⚕️', name: 'Dr. Ramesh Patel',  specialty: 'Dermatologist',     location: 'Ahmedabad', rating: 4.7, tag: 'Doctor' },
        { icon: '👩‍⚕️', name: 'Dr. Anjali Singh',  specialty: 'Gynaecologist',     location: 'Jaipur',    rating: 4.9, tag: 'Doctor' },
    ],
    clinics: [
        { icon: '🏥', name: 'HealthFirst Clinic',   specialty: 'Multi-Specialty Clinic',    location: 'Bengaluru', rating: 4.8, tag: 'Clinic' },
        { icon: '🏥', name: 'CarePoint Clinic',     specialty: 'Family Healthcare',          location: 'Chennai',   rating: 4.7, tag: 'Clinic' },
        { icon: '🏥', name: 'MediCare Plus',        specialty: 'Paediatrics & General',     location: 'Hyderabad', rating: 4.6, tag: 'Clinic' },
        { icon: '🏥', name: 'WellBeing Centre',     specialty: 'Preventive Health',         location: 'Pune',      rating: 4.8, tag: 'Clinic' },
    ],
    medicals: [
        { icon: '💊', name: 'Apollo Pharmacy',      specialty: 'Full-Range Medicines',      location: 'New Delhi', rating: 4.9, tag: 'Medical' },
        { icon: '💊', name: 'MedPlus Store',        specialty: 'Generic & Branded Drugs',   location: 'Mumbai',    rating: 4.7, tag: 'Medical' },
        { icon: '💊', name: 'LifeCare Pharmacy',    specialty: 'Home Delivery Available',   location: 'Kolkata',   rating: 4.6, tag: 'Medical' },
        { icon: '💊', name: 'Wellness Pharmacy',    specialty: 'Ayurvedic & Allopathic',    location: 'Lucknow',   rating: 4.5, tag: 'Medical' },
    ],
    diagnostics: [
        { icon: '🔬', name: 'SRL Diagnostics',     specialty: 'Blood & Pathology Tests',   location: 'Mumbai',    rating: 4.9, tag: 'Diagnostic' },
        { icon: '🔬', name: 'Thyrocare Labs',       specialty: 'Thyroid & Hormonal Tests',  location: 'Bengaluru', rating: 4.8, tag: 'Diagnostic' },
        { icon: '🔬', name: 'Redcliffe Labs',       specialty: 'Full Body Checkup',         location: 'Jaipur',    rating: 4.7, tag: 'Diagnostic' },
        { icon: '🔬', name: 'Metropolis Health',    specialty: 'Genomics & Molecular',      location: 'Chennai',   rating: 4.8, tag: 'Diagnostic' },
    ],
    hospitals: [
        { icon: '🏨', name: 'AIIMS Partner Hub',    specialty: 'Tertiary Care Referrals',   location: 'New Delhi', rating: 5.0, tag: 'Hospital' },
        { icon: '🏨', name: 'Fortis Hospital',      specialty: 'Cardiology & Oncology',     location: 'Gurgaon',   rating: 4.9, tag: 'Hospital' },
        { icon: '🏨', name: 'Manipal Hospital',     specialty: 'Multi-Specialty',           location: 'Bengaluru', rating: 4.8, tag: 'Hospital' },
        { icon: '🏨', name: 'Narayana Health',      specialty: 'Affordable Super-Specialty', location: 'Kolkata',  rating: 4.8, tag: 'Hospital' },
    ],
};

const TABS = [
    { key: 'doctors',    label: '👨‍⚕️ Doctors',    route: '/doctors' },
    { key: 'clinics',    label: '🏥 Clinics',     route: '/doctors' },
    { key: 'medicals',   label: '💊 Medicals',    route: '/medicals' },
    { key: 'diagnostics',label: '🔬 Diagnostics', route: '/diagnostics' },
    { key: 'hospitals',  label: '🏨 Hospitals',   route: '/hospitals' },
];

const TIMELINE = [
    { year: '2022', title: 'Idea Born', desc: 'Upchaar was conceived to bridge the digital gap in Indian healthcare.' },
    { year: '2023', title: 'Beta Launch', desc: 'First 50 doctors onboarded. Appointment booking system went live.' },
    { year: '2024', title: 'Platform Expansion', desc: 'Clinics, medicals, and diagnostics joined the ecosystem.' },
    { year: '2025', title: 'MSME Recognition', desc: 'Recognised as an innovative MSME startup by the Government of India.' },
    { year: '2026', title: 'All-in-One Platform', desc: 'Full ecosystem live — doctors, clinics, hospitals, diagnostics, medicals.' },
];

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function AboutUs() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('doctors');
    const [cardsVisible, setCardsVisible] = useState(false);
    const [heroRef, heroInView]     = useInView(0.1);
    const [missionRef, missionInView] = useInView(0.1);
    const [statsRef, statsInView]   = useInView(0.1);
    const [valuesRef, valuesInView] = useInView(0.1);
    const [provRef, provInView]     = useInView(0.1);
    const [timelineRef, timelineInView] = useInView(0.1);
    const [ctaRef, ctaInView]       = useInView(0.1);

    // reset card animation when tab changes
    useEffect(() => {
        setCardsVisible(false);
        const t = setTimeout(() => setCardsVisible(true), 80);
        return () => clearTimeout(t);
    }, [activeTab]);

    // also trigger when section scrolls into view
    useEffect(() => { if (provInView) setCardsVisible(true); }, [provInView]);

    const handleShowMore = (route) => {
        if (!loading && user) {
            navigate(route);
        } else {
            navigate('/login');
        }
    };

    const currentProviders = PROVIDERS[activeTab] || [];
    const currentRoute     = TABS.find(t => t.key === activeTab)?.route || '/';

    return (
        <div className="about-wrapper">
            <div className="p-4"><Header /></div>
            <MarqueeBanner />

            {/* ── HERO ──────────────────────────────────── */}
            <section className="about-hero" ref={heroRef}>
                <div className="about-hero-bg" />
                <div className="about-hero-particles">
                    {[...Array(18)].map((_, i) => (
                        <span key={i} className="particle" style={{
                            '--x': `${Math.random() * 100}%`,
                            '--y': `${Math.random() * 100}%`,
                            '--d': `${6 + Math.random() * 16}s`,
                            '--s': `${4 + Math.random() * 8}px`,
                            '--o': `${0.15 + Math.random() * 0.35}`,
                        }} />
                    ))}
                </div>
                <div className="about-hero-content" style={{
                    opacity: heroInView ? 1 : 0,
                    transform: heroInView ? 'translateY(0)' : 'translateY(50px)',
                    transition: 'opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s',
                }}>
                    <div className="about-hero-badge">🏥 All-in-One Digital Healthcare</div>
                    <h1 className="about-hero-title">
                        About <span className="about-gradient-text">Upchaar</span> Health
                    </h1>
                    <p className="about-hero-desc">
                        India's most comprehensive smart healthcare platform — connecting patients to verified doctors,
                        clinics, hospitals, medical stores, and diagnostic centres in one seamless digital ecosystem.
                    </p>
                    <div className="about-hero-actions">
                        <button className="about-btn-primary" onClick={() => handleShowMore('/doctors')}>
                            Explore Doctors
                        </button>
                        <button className="about-btn-outline" onClick={() => navigate('/services')}>
                            Our Services
                        </button>
                    </div>
                </div>
                <div className="about-hero-scroll-hint">
                    <span>↓</span>
                </div>
            </section>

            {/* ── MISSION ───────────────────────────────── */}
            <section className="about-section about-mission-section" ref={missionRef}>
                <div className="about-container">
                    <div className="about-mission-grid">
                        <div className="about-mission-text" style={{
                            opacity: missionInView ? 1 : 0,
                            transform: missionInView ? 'translateX(0)' : 'translateX(-50px)',
                            transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
                        }}>
                            <span className="about-label-pill">Our Mission</span>
                            <h2 className="about-section-title" style={{ textAlign: 'left' }}>
                                Bringing <span className="about-gradient-text">Digital Healthcare</span> to Every Indian
                            </h2>
                            <p className="about-mission-para">
                                Upchaar Health was founded with a singular vision — to remove the friction between patients
                                and quality healthcare. In a country with over 1.4 billion people, finding the right doctor,
                                the nearest clinic, or a reliable medical store should never be hard.
                            </p>
                            <p className="about-mission-para">
                                We built an intelligent, unified platform where patients can discover verified healthcare
                                providers, book appointments in real-time, access digital prescriptions, and manage their
                                complete health journey — all from a single login.
                            </p>
                            <div className="about-mission-badges">
                                <span className="about-mission-badge">🏛️ MSME Certified</span>
                                <span className="about-mission-badge">🔒 HIPAA Compliant</span>
                                <span className="about-mission-badge">✅ Govt. Recognised</span>
                            </div>
                        </div>
                        <div className="about-mission-visual" style={{
                            opacity: missionInView ? 1 : 0,
                            transform: missionInView ? 'translateX(0)' : 'translateX(50px)',
                            transition: 'opacity 0.7s ease 0.25s, transform 0.7s ease 0.25s',
                        }}>
                            <div className="about-visual-card">
                                <div className="about-visual-icon">🩺</div>
                                <div className="about-visual-lines">
                                    <div className="about-visual-line long" />
                                    <div className="about-visual-line medium" />
                                    <div className="about-visual-line short" />
                                </div>
                            </div>
                            <div className="about-visual-floats">
                                <div className="about-float-chip chip1">🩺 Book Now</div>
                                <div className="about-float-chip chip2">💊 Prescriptions</div>
                                <div className="about-float-chip chip3">🔬 Lab Reports</div>
                                <div className="about-float-chip chip4">⚡ Instant Queue</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STATS ─────────────────────────────────── */}
            <section className="about-section about-stats-section" ref={statsRef}>
                <div className="about-container">
                    <SectionHeading
                        label="Our Impact"
                        title="Numbers That Speak"
                        subtitle="Growing every day — trusted by thousands of patients and hundreds of providers."
                        inView={statsInView}
                    />
                    <div className="about-stats-grid">
                        {STATS.map((s, i) => (
                            <div key={s.label} className="about-stat-card" style={{
                                opacity: statsInView ? 1 : 0,
                                transform: statsInView ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                                transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms`,
                            }}>
                                <div className="about-stat-number">
                                    {statsInView && <Counter target={s.value} suffix={s.suffix} />}
                                </div>
                                <div className="about-stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PROVIDERS ─────────────────────────────── */}
            <section className="about-section about-providers-section" ref={provRef}>
                <div className="about-container">
                    <SectionHeading
                        label="Healthcare Network"
                        title="Meet Our Providers"
                        subtitle="Verified, credentialed, and ready to care for you."
                        inView={provInView}
                    />

                    {/* Tabs */}
                    <div className="about-tabs">
                        {TABS.map(t => (
                            <button
                                key={t.key}
                                className={`about-tab ${activeTab === t.key ? 'about-tab-active' : ''}`}
                                onClick={() => setActiveTab(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Cards grid */}
                    <div className="about-providers-grid">
                        {currentProviders.map((p, i) => (
                            <ProviderCard key={p.name} {...p} delay={i * 100} visible={cardsVisible} />
                        ))}
                    </div>

                    {/* Show More */}
                    <div className="about-show-more-wrap">
                        <button
                            className="about-show-more-btn"
                            onClick={() => handleShowMore(currentRoute)}
                        >
                            {!loading && user
                                ? `View All ${TABS.find(t => t.key === activeTab)?.label.split(' ')[1]} →`
                                : `Sign In to See All ${TABS.find(t => t.key === activeTab)?.label.split(' ')[1]} →`
                            }
                        </button>
                        {!user && !loading && (
                            <p className="about-auth-hint">
                                🔐 Sign in to access our full directory of verified healthcare providers.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* ── VALUES ────────────────────────────────── */}
            <section className="about-section about-values-section" ref={valuesRef}>
                <div className="about-container">
                    <SectionHeading
                        label="Our Values"
                        title="What We Stand For"
                        subtitle="Every decision we make is guided by these core principles."
                        inView={valuesInView}
                    />
                    <div className="about-values-grid">
                        {VALUES.map((v, i) => (
                            <div key={v.title} className="about-value-card" style={{
                                opacity: valuesInView ? 1 : 0,
                                transform: valuesInView ? 'translateY(0)' : 'translateY(40px)',
                                transition: `opacity 0.55s ease ${i * 90}ms, transform 0.55s ease ${i * 90}ms`,
                            }}>
                                <div className="about-value-icon">{v.icon}</div>
                                <h3 className="about-value-title">{v.title}</h3>
                                <p className="about-value-desc">{v.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TIMELINE ──────────────────────────────── */}
            <section className="about-section about-timeline-section" ref={timelineRef}>
                <div className="about-container">
                    <SectionHeading
                        label="Our Journey"
                        title="From Idea to Impact"
                        subtitle="A brief history of how Upchaar Health was built."
                        inView={timelineInView}
                    />
                    <div className="about-timeline">
                        {TIMELINE.map((item, i) => (
                            <div key={item.year}
                                className={`about-timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}
                                style={{
                                    opacity: timelineInView ? 1 : 0,
                                    transform: timelineInView ? 'translateY(0)' : 'translateY(40px)',
                                    transition: `opacity 0.6s ease ${i * 140}ms, transform 0.6s ease ${i * 140}ms`,
                                }}
                            >
                                <div className="about-timeline-card">
                                    <div className="about-timeline-year">{item.year}</div>
                                    <h4 className="about-timeline-title">{item.title}</h4>
                                    <p className="about-timeline-desc">{item.desc}</p>
                                </div>
                                <div className="about-timeline-dot" />
                            </div>
                        ))}
                        <div className="about-timeline-line" />
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────── */}
            <section className="about-section about-how-section">
                <div className="about-container">
                    <SectionHeading
                        label="How It Works"
                        title="Three Simple Steps"
                        subtitle="Getting started with Upchaar is effortless."
                        inView={true}
                    />
                    <div className="about-steps">
                        {[
                            { step: '01', icon: '📝', title: 'Register', desc: 'Create your free account as a patient or provider in under 2 minutes.' },
                            { step: '02', icon: '🔍', title: 'Discover', desc: 'Search and filter doctors, clinics, medicals, hospitals & diagnostics near you.' },
                            { step: '03', icon: '📅', title: 'Book & Consult', desc: 'Book an appointment instantly, consult digitally, get prescriptions online.' },
                        ].map((s, i) => (
                            <div key={s.step} className="about-step-card" style={{ animationDelay: `${i * 0.15}s` }}>
                                <div className="about-step-number">{s.step}</div>
                                <div className="about-step-icon">{s.icon}</div>
                                <h3 className="about-step-title">{s.title}</h3>
                                <p className="about-step-desc">{s.desc}</p>
                                {i < 2 && <div className="about-step-arrow">→</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────── */}
            <section className="about-cta-section" ref={ctaRef}>
                <div className="about-cta-bg" />
                <div className="about-cta-content" style={{
                    opacity: ctaInView ? 1 : 0,
                    transform: ctaInView ? 'scale(1)' : 'scale(0.95)',
                    transition: 'opacity 0.7s ease, transform 0.7s ease',
                }}>
                    <h2 className="about-cta-title">Ready to Transform Your Healthcare?</h2>
                    <p className="about-cta-desc">
                        Join thousands of patients already benefiting from Upchaar Health.
                        {!user && !loading && ' Sign up free today — no credit card required.'}
                    </p>
                    <div className="about-cta-actions">
                        {!loading && !user ? (
                            <>
                                <button className="about-btn-primary" onClick={() => navigate('/login')}>Get Started Free</button>
                                <button className="about-btn-outline white" onClick={() => navigate('/doctors')}>Browse Doctors</button>
                            </>
                        ) : (
                            <button className="about-btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard →</button>
                        )}
                    </div>
                </div>
            </section>

            <Footer />

            {/* ── STYLES ────────────────────────────────── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

                .about-wrapper {
                    font-family: 'Inter', sans-serif;
                    background: #f7f9fb;
                    min-height: 100vh;
                }

                /* ── HERO ── */
                .about-hero {
                    position: relative;
                    min-height: 92vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    overflow: hidden;
                    padding: 6rem 1.5rem 4rem;
                }
                .about-hero-bg {
                    position: absolute; inset: 0;
                    background: linear-gradient(135deg, #0a4d42 0%, #0d7a6b 40%, #1a73e8 80%, #0f4c81 100%);
                    z-index: 0;
                }
                .about-hero-particles { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
                .particle {
                    position: absolute;
                    left: var(--x); top: var(--y);
                    width: var(--s); height: var(--s);
                    background: rgba(255,255,255,var(--o));
                    border-radius: 50%;
                    animation: particle-float var(--d) ease-in-out infinite alternate;
                }
                @keyframes particle-float {
                    from { transform: translate(0, 0) scale(1); }
                    to   { transform: translate(20px, -30px) scale(1.4); }
                }
                .about-hero-content { position: relative; z-index: 2; max-width: 800px; }
                .about-hero-badge {
                    display: inline-block;
                    background: rgba(255,255,255,0.15);
                    border: 1px solid rgba(255,255,255,0.25);
                    color: #fff;
                    font-size: 0.85rem;
                    font-weight: 600;
                    padding: 0.4rem 1rem;
                    border-radius: 999px;
                    margin-bottom: 1.5rem;
                    backdrop-filter: blur(8px);
                    letter-spacing: 0.03em;
                }
                .about-hero-title {
                    font-family: 'Manrope', sans-serif;
                    font-size: clamp(2.5rem, 6vw, 5rem);
                    font-weight: 800;
                    color: #fff;
                    line-height: 1.1;
                    margin-bottom: 1.5rem;
                    text-shadow: 0 4px 20px rgba(0,0,0,0.25);
                }
                .about-gradient-text {
                    background: linear-gradient(90deg, #7efff5, #a8edea, #fed6e3);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .about-hero-desc {
                    font-size: clamp(1rem, 2vw, 1.2rem);
                    color: rgba(255,255,255,0.85);
                    max-width: 640px;
                    margin: 0 auto 2.5rem;
                    line-height: 1.75;
                }
                .about-hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
                .about-hero-scroll-hint {
                    position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
                    color: rgba(255,255,255,0.6); font-size: 1.5rem;
                    animation: bounce 1.5s ease infinite;
                    z-index: 2;
                }
                @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(8px)} }

                /* ── BUTTONS ── */
                .about-btn-primary {
                    background: linear-gradient(135deg, #00b09b, #1a73e8);
                    color: #fff; border: none; border-radius: 999px;
                    padding: 0.85rem 2rem; font-size: 1rem; font-weight: 700;
                    cursor: pointer; transition: all 0.3s ease;
                    box-shadow: 0 8px 24px rgba(0,176,155,0.35);
                }
                .about-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,176,155,0.45); }
                .about-btn-outline {
                    background: transparent; color: #fff;
                    border: 2px solid rgba(255,255,255,0.6);
                    border-radius: 999px; padding: 0.85rem 2rem;
                    font-size: 1rem; font-weight: 600;
                    cursor: pointer; transition: all 0.3s ease;
                    backdrop-filter: blur(8px);
                }
                .about-btn-outline:hover { background: rgba(255,255,255,0.15); border-color: #fff; }
                .about-btn-outline.white { color: #fff; }

                /* ── SECTIONS ── */
                .about-section { padding: 5rem 1.5rem; }
                .about-container { max-width: 1200px; margin: 0 auto; }
                .about-section-heading { text-align: center; margin-bottom: 3.5rem; }
                .about-label-pill {
                    display: inline-block;
                    background: linear-gradient(90deg, #e6faf8, #dbeafe);
                    color: #0a4d42;
                    font-size: 0.78rem; font-weight: 700;
                    padding: 0.35rem 1rem; border-radius: 999px;
                    text-transform: uppercase; letter-spacing: 0.08em;
                    margin-bottom: 0.75rem;
                }
                .about-section-title {
                    font-family: 'Manrope', sans-serif;
                    font-size: clamp(1.8rem, 4vw, 2.8rem);
                    font-weight: 800; color: #0f172a;
                    margin: 0.5rem 0 1rem; line-height: 1.2;
                    text-align: center;
                }
                .about-section-subtitle {
                    font-size: 1.05rem; color: #64748b;
                    max-width: 560px; margin: 0 auto; line-height: 1.65;
                }

                /* ── MISSION ── */
                .about-mission-section { background: #fff; }
                .about-mission-grid {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
                }
                @media(max-width:768px) { .about-mission-grid { grid-template-columns: 1fr; gap: 2.5rem; } }
                .about-mission-text .about-section-title { text-align: left; }
                .about-mission-para { color: #475569; line-height: 1.8; margin-bottom: 1rem; font-size: 1.02rem; }
                .about-mission-badges { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.5rem; }
                .about-mission-badge {
                    background: linear-gradient(90deg, #e6faf8, #dbeafe);
                    color: #0a4d42; padding: 0.45rem 1rem;
                    border-radius: 999px; font-size: 0.85rem; font-weight: 600;
                }
                .about-mission-visual { position: relative; min-height: 320px; }
                .about-visual-card {
                    background: linear-gradient(135deg, #0a4d42, #1a73e8);
                    border-radius: 24px; padding: 2.5rem;
                    display: flex; flex-direction: column; gap: 1.5rem;
                    box-shadow: 0 20px 60px rgba(10,77,66,0.25);
                }
                .about-visual-icon { font-size: 3rem; }
                .about-visual-lines { display: flex; flex-direction: column; gap: 0.75rem; }
                .about-visual-line {
                    height: 12px; border-radius: 999px;
                    background: rgba(255,255,255,0.2);
                    animation: shimmer 2s ease infinite;
                }
                .about-visual-line.long  { width: 80%; }
                .about-visual-line.medium{ width: 60%; animation-delay: 0.3s; }
                .about-visual-line.short { width: 40%; animation-delay: 0.6s; }
                @keyframes shimmer {
                    0%,100%{background:rgba(255,255,255,0.15)}
                    50%{background:rgba(255,255,255,0.35)}
                }
                .about-visual-floats { position: absolute; inset: 0; pointer-events: none; }
                .about-float-chip {
                    position: absolute; background: #fff;
                    border-radius: 12px; padding: 0.5rem 0.9rem;
                    font-size: 0.78rem; font-weight: 700; color: #0a4d42;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                    animation: float-chip 4s ease-in-out infinite alternate;
                }
                .chip1 { top: -15px; right: 10%; animation-delay: 0s; }
                .chip2 { top: 30%;  left: -30px; animation-delay: 1s; }
                .chip3 { bottom: 20%; right: -20px; animation-delay: 0.5s; }
                .chip4 { bottom: -15px; left: 20%; animation-delay: 1.5s; }
                @keyframes float-chip {
                    from { transform: translateY(0); }
                    to   { transform: translateY(-12px); }
                }

                /* ── STATS ── */
                .about-stats-section { background: linear-gradient(135deg, #0a4d42 0%, #1a73e8 100%); }
                .about-stats-section .about-section-title { color: #fff; }
                .about-stats-section .about-section-subtitle { color: rgba(255,255,255,0.75); }
                .about-stats-section .about-label-pill { background: rgba(255,255,255,0.2); color: #fff; }
                .about-stats-grid {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1.5rem;
                }
                .about-stat-card {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 20px; padding: 2rem 1.5rem; text-align: center;
                    transition: transform 0.3s ease, background 0.3s ease;
                }
                .about-stat-card:hover { transform: translateY(-6px); background: rgba(255,255,255,0.18); }
                .about-stat-number {
                    font-family: 'Manrope', sans-serif;
                    font-size: 2.5rem; font-weight: 800; color: #fff;
                    line-height: 1; margin-bottom: 0.5rem;
                }
                .about-stat-label { color: rgba(255,255,255,0.8); font-size: 0.9rem; font-weight: 500; }

                /* ── PROVIDERS ── */
                .about-providers-section { background: #f7f9fb; }
                .about-tabs {
                    display: flex; gap: 0.5rem; flex-wrap: wrap;
                    justify-content: center; margin-bottom: 2.5rem;
                }
                .about-tab {
                    padding: 0.55rem 1.3rem; border-radius: 999px; font-size: 0.9rem;
                    font-weight: 600; border: 2px solid #e2e8f0;
                    background: #fff; color: #475569; cursor: pointer;
                    transition: all 0.25s ease;
                }
                .about-tab:hover { border-color: #0a4d42; color: #0a4d42; }
                .about-tab-active {
                    background: linear-gradient(135deg, #0a4d42, #1a73e8);
                    color: #fff; border-color: transparent;
                    box-shadow: 0 6px 20px rgba(10,77,66,0.3);
                }
                .about-providers-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }
                .about-provider-card {
                    background: #fff; border-radius: 20px; padding: 1.8rem 1.5rem;
                    text-align: center; position: relative; overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    border: 1px solid rgba(0,0,0,0.05);
                }
                .about-provider-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(10,77,66,0.15); }
                .about-card-avatar { font-size: 3rem; margin-bottom: 0.75rem; }
                .about-card-tag {
                    position: absolute; top: 1rem; right: 1rem;
                    background: linear-gradient(90deg, #e6faf8, #dbeafe);
                    color: #0a4d42; font-size: 0.7rem; font-weight: 700;
                    padding: 0.25rem 0.65rem; border-radius: 999px; text-transform: uppercase;
                }
                .about-card-name {
                    font-family: 'Manrope', sans-serif;
                    font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem;
                }
                .about-card-specialty { color: #1a73e8; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; }
                .about-card-location { color: #94a3b8; font-size: 0.82rem; margin-bottom: 0.65rem; }
                .about-card-rating { color: #f59e0b; font-size: 0.9rem; letter-spacing: 2px; }
                .about-show-more-wrap { text-align: center; }
                .about-show-more-btn {
                    background: linear-gradient(135deg, #0a4d42, #1a73e8);
                    color: #fff; border: none; border-radius: 999px;
                    padding: 0.9rem 2.5rem; font-size: 1rem; font-weight: 700;
                    cursor: pointer; transition: all 0.3s ease;
                    box-shadow: 0 8px 24px rgba(10,77,66,0.3);
                }
                .about-show-more-btn:hover { transform: translateY(-3px); box-shadow: 0 14px 32px rgba(10,77,66,0.4); }
                .about-auth-hint {
                    margin-top: 0.85rem; font-size: 0.88rem; color: #94a3b8;
                }

                /* ── VALUES ── */
                .about-values-section { background: #fff; }
                .about-values-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;
                }
                .about-value-card {
                    background: linear-gradient(135deg, #f0fdf9 0%, #eff6ff 100%);
                    border: 1px solid rgba(10,77,66,0.1);
                    border-radius: 20px; padding: 2rem;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .about-value-card:hover { transform: translateY(-5px); box-shadow: 0 12px 32px rgba(10,77,66,0.1); }
                .about-value-icon { font-size: 2.5rem; margin-bottom: 1rem; }
                .about-value-title {
                    font-family: 'Manrope', sans-serif;
                    font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;
                }
                .about-value-desc { color: #64748b; line-height: 1.65; font-size: 0.95rem; }

                /* ── TIMELINE ── */
                .about-timeline-section { background: #f7f9fb; overflow: hidden; }
                .about-timeline {
                    position: relative; max-width: 800px; margin: 0 auto;
                    display: flex; flex-direction: column; gap: 2rem; padding: 1rem 0;
                }
                .about-timeline-line {
                    position: absolute; left: 50%; top: 0; bottom: 0;
                    width: 3px;
                    background: linear-gradient(180deg, #0a4d42, #1a73e8);
                    transform: translateX(-50%);
                }
                @media(max-width: 640px) {
                    .about-timeline-line { left: 20px; }
                    .about-timeline-item { flex-direction: row !important; padding-left: 50px !important; padding-right: 0 !important; }
                    .about-timeline-dot  { left: 20px !important; right: auto !important; }
                }
                .about-timeline-item {
                    position: relative; display: flex; align-items: center;
                }
                .about-timeline-item.left  { justify-content: flex-start; padding-right: calc(50% + 2rem); }
                .about-timeline-item.right { justify-content: flex-end;  padding-left:  calc(50% + 2rem); }
                .about-timeline-card {
                    background: #fff; border-radius: 16px; padding: 1.5rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.07);
                    border: 1px solid rgba(0,0,0,0.05); max-width: 320px; width: 100%;
                    transition: transform 0.3s, box-shadow 0.3s;
                }
                .about-timeline-card:hover { transform: scale(1.02); box-shadow: 0 10px 32px rgba(10,77,66,0.12); }
                .about-timeline-year {
                    font-family: 'Manrope', sans-serif;
                    font-size: 1.8rem; font-weight: 800;
                    background: linear-gradient(90deg, #0a4d42, #1a73e8);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                    margin-bottom: 0.25rem;
                }
                .about-timeline-title { font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; font-size: 1rem; }
                .about-timeline-desc { color: #64748b; font-size: 0.9rem; line-height: 1.6; }
                .about-timeline-dot {
                    position: absolute; left: 50%; top: 50%;
                    transform: translate(-50%, -50%);
                    width: 16px; height: 16px; border-radius: 50%;
                    background: linear-gradient(135deg, #0a4d42, #1a73e8);
                    border: 3px solid #fff;
                    box-shadow: 0 0 0 4px rgba(10,77,66,0.2);
                    z-index: 2;
                }

                /* ── HOW IT WORKS ── */
                .about-how-section { background: linear-gradient(135deg, #f0fdf9 0%, #eff6ff 100%); }
                .about-steps {
                    display: flex; gap: 1rem; align-items: stretch;
                    justify-content: center; flex-wrap: wrap;
                }
                .about-step-card {
                    background: #fff; border-radius: 20px; padding: 2.5rem 2rem;
                    text-align: center; max-width: 280px; flex: 1;
                    box-shadow: 0 6px 24px rgba(0,0,0,0.07);
                    position: relative;
                    animation: fadeInUp 0.6s ease both;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .about-step-number {
                    font-family: 'Manrope', sans-serif;
                    font-size: 3.5rem; font-weight: 800; line-height: 1;
                    background: linear-gradient(135deg, #0a4d42, #1a73e8);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                    margin-bottom: 0.5rem;
                }
                .about-step-icon { font-size: 2.5rem; margin-bottom: 1rem; }
                .about-step-title {
                    font-family: 'Manrope', sans-serif;
                    font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;
                }
                .about-step-desc { color: #64748b; font-size: 0.92rem; line-height: 1.65; }
                .about-step-arrow {
                    position: absolute; right: -1.6rem; top: 50%;
                    transform: translateY(-50%);
                    font-size: 1.8rem; color: #0a4d42; font-weight: 700;
                    z-index: 2;
                }
                @media(max-width: 640px) { .about-step-arrow { display: none; } }

                /* ── CTA ── */
                .about-cta-section {
                    position: relative; padding: 6rem 1.5rem;
                    text-align: center; overflow: hidden;
                }
                .about-cta-bg {
                    position: absolute; inset: 0;
                    background: linear-gradient(135deg, #0a4d42 0%, #0d7a6b 50%, #1a73e8 100%);
                }
                .about-cta-content { position: relative; z-index: 1; max-width: 680px; margin: 0 auto; }
                .about-cta-title {
                    font-family: 'Manrope', sans-serif;
                    font-size: clamp(2rem, 5vw, 3rem); font-weight: 800;
                    color: #fff; margin-bottom: 1rem; line-height: 1.2;
                }
                .about-cta-desc { color: rgba(255,255,255,0.85); font-size: 1.1rem; margin-bottom: 2.5rem; line-height: 1.6; }
                .about-cta-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
            `}</style>
        </div>
    );
}
