import { Hero } from '@/components/landing/Hero';
import { TrustBadges } from '@/components/landing/trust-badges';
import { QuickAccess } from '@/components/landing/quick-access';
import { MsmeSection } from '@/components/landing/msme-section';
import { InnovationAwardSection } from '@/components/landing/innovation-award-section';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { QuoteSection } from '@/components/landing/quote-section';
import { NewsletterSignUp } from '@/components/landing/newsletter-signup';
import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/landing/Header';

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col text-foreground overflow-hidden">
            <div className="relative isolate">
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                    <div
                        className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-destructive to-primary opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                        style={{
                            clipPath:
                                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                        }}
                    />
                </div>
                <div className="p-4">
                    <Header />
                </div>
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
                    <NewsletterSignUp />
                </main>
                <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
                    <div
                        className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-destructive to-primary opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                        style={{
                            clipPath:
                                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                        }}
                    />
                </div>
            </div>
            <Footer />
        </div>
    );
}
