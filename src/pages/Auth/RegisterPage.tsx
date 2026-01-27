import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FcGoogle } from 'react-icons/fc';

import { supabase } from '@/services/supabase';
import { Loader } from '@/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';


/* =========================
   Validation Schema
========================= */

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include at least one uppercase letter')
    .regex(/[a-z]/, 'Must include at least one lowercase letter')
    .regex(/[0-9]/, 'Must include at least one number');

/* =========================
   Component
========================= */

const signUpSchema = z
    .object({
        fullName: z.string().min(2, 'Full name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

const RegisterPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [otp, setOtp] = useState('');

    const form = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        mode: 'onSubmit',
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.fullName,
                        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            data.fullName
                        )}&background=random`,
                    },
                },
            });

            if (error) throw error;

            toast.success('Account created! Enter the 6-digit code sent to your email.');
            setIsVerifying(true);
        } catch (err: any) {
            toast.error(err.message || 'An error occurred during sign up');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) {
            toast.error('Please enter the OTP code');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email: form.getValues('email'),
                token: otp,
                type: 'signup',
            });

            if (error) throw error;

            toast.success('Account verified successfully!');
            navigate('/login');
        } catch (err: any) {
            console.error('OTP verification error:', err);
            toast.error(err.message || 'Invalid OTP code');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: `${window.location.origin}/`,
                },
            });

            if (error) throw error;
        } catch (err: any) {
            console.error('Google login error:', err);
            toast.error(err.message || 'Failed to sign in with Google');
        }
    };

    if (isVerifying) {
        return (
            <div className="flex items-center justify-center px-4 min-h-screen pt-20 pb-24">
                <div className="w-full max-w-md p-8 space-y-6 bg-white/5 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-brand to-red-600 bg-clip-text text-transparent">
                            Verify Email
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Enter the code sent to {form.getValues('email')}
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
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const { error } = await supabase.auth.resend({
                                            type: 'signup',
                                            email: form.getValues('email'),
                                        });
                                        if (error) throw error;
                                        toast.success('Verification code resent! Check your email.');
                                    } catch (err: any) {
                                        toast.error(err.message || 'Failed to resend code');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                                className="text-brand hover:text-red-600 font-medium hover:underline disabled:opacity-50 transition-colors"
                            >
                                Resend
                            </button>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsVerifying(false)}
                            className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-brand dark:hover:text-red-400"
                        >
                            Back to Sign Up
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center px-4 min-h-screen pt-20 pb-24">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/5 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">

                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-brand to-red-600 bg-clip-text text-transparent">
                        Create Account
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Enter your details to get started
                    </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                    {/* Full Name */}
                    <Controller
                        name="fullName"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="fullName" className="dark:text-white">Full Name</FieldLabel>
                                <Input {...field} id="fullName" placeholder="John Doe" className="dark:text-white" />
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    {/* Email */}
                    <Controller
                        name="email"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="email" className="dark:text-white">Email</FieldLabel>
                                <Input {...field} id="email" placeholder="example@gmail.com" className="dark:text-white" />
                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    {/* Password */}
                    <Controller
                        name="password"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="password" className="dark:text-white">Password</FieldLabel>

                                <div className="relative">
                                    <Input
                                        {...field}
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        className="pr-10 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    {/* Confirm Password */}
                    <Controller
                        name="confirmPassword"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor="confirmPassword" className="dark:text-white">Confirm Password</FieldLabel>

                                <div className="relative">
                                    <Input
                                        {...field}
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        className="pr-10 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((p) => !p)}
                                        aria-label={
                                            showConfirmPassword ? 'Hide password' : 'Show password'
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={16} />
                                        ) : (
                                            <Eye size={16} />
                                        )}
                                    </button>
                                </div>

                                {fieldState.error && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-brand to-red-600 text-white"
                    >
                        {loading ? (
                            <Loader className="w-5 h-5 border-2 scale-50" isFullScreen={false} />
                        ) : (
                            'Sign Up'
                        )}
                    </Button>
                </form>

                <div className="relative flex items-center justify-center my-4">
                    <Separator className="absolute" />
                    <span className="bg-white dark:bg-[#18181b] px-2 text-xs text-gray-500 relative z-10">
                        OR
                    </span>
                </div>

                <Button type="button" variant="outline" onClick={handleGoogleLogin} className="w-full">
                    <FcGoogle className="w-5 h-5 mr-2" />
                    Sign in with Google
                </Button>

                <div className="text-center">
                    <Link
                        to="/login"
                        className="text-sm text-gray-500 hover:text-brand transition-colors"
                    >
                        Already have an account? Sign in
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default RegisterPage;
