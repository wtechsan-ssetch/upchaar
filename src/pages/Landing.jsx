import React from 'react';
import { Hero } from '@/components/landing/Hero';
import { TrustBadges } from '@/components/landing/trust-badges';
import { QuickAccess } from '@/components/landing/quick-access';
import { MsmeSection } from '@/components/landing/msme-section';
import { InnovationAwardSection } from '@/components/landing/innovation-award-section';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { QuoteSection } from '@/components/landing/quote-section';
import { FaqSection } from '@/components/landing/faq-section';
import { NewsletterSignUp } from '@/components/landing/newsletter-signup';
import { FeedbackForm } from '@/components/landing/feedback-form';
import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/landing/Header';
import { MarqueeBanner } from '@/components/landing/MarqueeBanner';

const LandingPage = React.memo(function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col text-foreground overflow-hidden">
            <div className="relative">
                <div className="p-4">
                    <Header />
                </div>
                <MarqueeBanner />
                <main className="flex-1">
                    <Hero />
                    <div className="py-12">
                        <TrustBadges />
                    </div>
                    <div className="my-12" />
                    <QuickAccess />
                    <MsmeSection />
                    <InnovationAwardSection />
                    <Features />
                    <HowItWorks />
                    <QuoteSection />
                    <FaqSection />
                    <FeedbackForm />
                    <NewsletterSignUp />
                </main>
            </div>
            <Footer />
        </div>
    );
});

export default LandingPage;