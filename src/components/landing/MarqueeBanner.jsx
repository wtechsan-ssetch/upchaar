import React from 'react';

const messages = [
    "🏥 Welcome to Upchar Health — All in One Smart & Digital Healthcare System. You will get all the healthcare providers in one platform.",
    "🎉 Free Registration for the first 100 doctors. 50 doctors have already registered — become the next one!",
];

// Duplicate the messages to create a seamless loop
const track = [...messages, ...messages];

export const MarqueeBanner = () => {
    return (
        <div className="marquee-banner-wrapper">
            <div className="marquee-track">
                {track.map((msg, i) => (
                    <span key={i} className="marquee-item">
                        {msg}
                        <span className="marquee-sep" aria-hidden="true">✦</span>
                    </span>
                ))}
            </div>

            <style>{`
                .marquee-banner-wrapper {
                    width: 100%;
                    overflow: hidden;
                    background: linear-gradient(90deg, #0f4c81 0%, #1a73e8 50%, #0f4c81 100%);
                    padding: 10px 0;
                    position: relative;
                    box-shadow: 0 2px 12px rgba(15, 76, 129, 0.35);
                    border-bottom: 2px solid rgba(255,255,255,0.15);
                    z-index: 40;
                }

                .marquee-banner-wrapper::before,
                .marquee-banner-wrapper::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 80px;
                    z-index: 2;
                    pointer-events: none;
                }
                .marquee-banner-wrapper::before {
                    left: 0;
                    background: linear-gradient(to right, #0f4c81, transparent);
                }
                .marquee-banner-wrapper::after {
                    right: 0;
                    background: linear-gradient(to left, #0f4c81, transparent);
                }

                .marquee-track {
                    display: flex;
                    width: max-content;
                    animation: marquee-rtl 28s linear infinite;
                    will-change: transform;
                }

                .marquee-track:hover {
                    animation-play-state: paused;
                }

                .marquee-item {
                    white-space: nowrap;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #ffffff;
                    letter-spacing: 0.02em;
                    padding: 0 2rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.25);
                }

                .marquee-sep {
                    color: #90cdf4;
                    font-size: 0.65rem;
                    margin-left: 0.75rem;
                    opacity: 0.8;
                }

                @keyframes marquee-rtl {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                @media (max-width: 640px) {
                    .marquee-item {
                        font-size: 0.78rem;
                        padding: 0 1.25rem;
                    }
                }
            `}</style>
        </div>
    );
};
