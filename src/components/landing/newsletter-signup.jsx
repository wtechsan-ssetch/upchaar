import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

export const NewsletterSignUp = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        setError('');
        // TODO: Implement actual newsletter signup logic
        console.log('Newsletter signup for:', email);
        alert(`Thank you for signing up with ${email}!`);
        setEmail('');
    };

    return (
        <section id="signup" className="bg-teal-50/50">
            <div className="container py-12 md:py-24">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Stay Updated on Your Health</h2>
                    <p className="mt-2 text-muted-foreground">
                        Subscribe to our newsletter for the latest health tips and platform updates.
                    </p>
                    <form onSubmit={handleSubmit} className="mt-6 flex max-w-md mx-auto">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="pl-10"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                aria-label="Email for newsletter"
                            />
                        </div>
                        <Button type="submit">Subscribe</Button>
                    </form>
                    {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
                </div>
            </div>
        </section>
    );
}
