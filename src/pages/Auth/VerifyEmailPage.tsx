
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/services/supabase';
import { Loader } from '@/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/field';

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from router state (passed from RegisterPage)
    const email = location.state?.email || '';

    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState('');

    const handleVerifyOtp = async () => {
        if (!otp) {
            toast.error('Please enter the OTP code');
            return;
        }
        if (!email) {
            toast.error('Email missing. Please sign up first.');
            navigate('/register');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup',
            });

            if (error) throw error;

            toast.success('Account verified successfully!');
            navigate('/');
        } catch (err: any) {
            console.error('OTP verification error:', err);
            toast.error(err.message || 'Invalid OTP code');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email) {
            toast.error('Email missing');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });
            if (error) throw error;
            toast.success('Verification code resent! Check your email.');
        } catch (err: any) {
            toast.error(err.message || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    if (!email) {
        // Redirect if someone tries to access this page directly without an email
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">No email provided</h2>
                    <Button onClick={() => navigate('/register')}>Go to Sign Up</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center px-4 min-h-screen pt-20 pb-24">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/5 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-brand to-red-600 bg-clip-text text-transparent">
                        Verify Email
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Enter the code sent to {email}
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <FieldLabel htmlFor="otp-input" className="dark:text-white">
                            OTP Code
                        </FieldLabel>
                        <Input
                            id="otp-input"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="text-center text-xl tracking-widest bg-white/50 dark:bg-black/20 border-gray-200 dark:border-white/10 focus-visible:ring-brand dark:text-white"
                            maxLength={6}
                            autoComplete="one-time-code"
                        />
                    </div>

                    <Button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.length < 6}
                        className="w-full bg-gradient-to-r from-brand to-red-600 text-white hover:opacity-90 transition-all font-medium"
                    >
                        {loading ? <Loader className="w-5 h-5 border-2 scale-50" isFullScreen={false} /> : 'Verify Account'}
                    </Button>

                    <div className="text-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Didn't receive code? </span>
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={loading}
                            className="text-brand hover:text-red-600 font-medium hover:underline disabled:opacity-50 transition-colors"
                        >
                            Resend
                        </button>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigate('/register')}
                        className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-brand dark:hover:text-red-400"
                    >
                        Back to Sign Up
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
