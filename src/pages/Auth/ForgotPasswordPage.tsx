import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FiChevronLeft } from 'react-icons/fi';

import { supabase } from '@/services/supabase';
import { Loader } from '@/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form } from '@/components/ui/form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async (data: ForgotPasswordValues) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            setEmailSent(true);
            toast.success('Password reset email sent!');
        } catch (error: any) {
            console.error('Reset password error:', error);

            // For security reasons, sometimes errors are suppresssed, but usually rate limits are shown
            toast.error(error.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="flex flex-col items-center justify-center px-4 min-h-[calc(100vh-10px)]">
                <div className="w-full max-w-md p-8 space-y-6 bg-white/5 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl text-center">
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold dark:text-white">Check your email</h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            We have sent a password reset link to <br />
                            <span className="font-medium text-gray-900 dark:text-white">{form.getValues().email}</span>
                        </p>
                    </div>

                    <div className="pt-4">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate('/login')}
                        >
                            Back to Login
                        </Button>
                    </div>

                    <div className="text-sm text-gray-500">
                        Didn't receive the email? <button
                            onClick={() => onSubmit(form.getValues())}
                            disabled={loading}
                            className="text-brand hover:underline disabled:opacity-50"
                        >
                            Click to resend
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center px-4 min-h-[calc(100vh-10px)]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/5 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                <div className="absolute top-8 left-8">
                    <Link to="/login" className="flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <FiChevronLeft className="mr-1" /> Back
                    </Link>
                </div>

                <div className="space-y-2 text-center pt-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-brand to-red-600 bg-clip-text text-transparent">
                        Forgot Password
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Enter your email address to reset your password
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Controller
                            name="email"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="email" className="dark:text-white">
                                        Email Address
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="email"
                                        placeholder="example@gmail.com"
                                        className="dark:text-white"
                                        autoComplete="email"
                                    />
                                    {fieldState.error && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-brand to-red-600 hover:opacity-90 transition-all font-medium text-white"
                        >
                            {loading ? <Loader className="w-5 h-5 border-2 scale-50" isFullScreen={false} /> : 'Send Reset Link'}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
