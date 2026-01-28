import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';
import { Loader } from '@/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form } from '@/components/ui/form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

const passwordSchema = z.object({
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type UpdatePasswordValues = z.infer<typeof passwordSchema>;

const UpdatePasswordPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [verifyingSession, setVerifyingSession] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Verify we have a session (magic link should set this)
    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                // Check if we already have a session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Error checking session:", error);
                }

                if (session) {
                    if (mounted) setVerifyingSession(false);
                    return;
                }

                // If no session, check for recovery hash
                const hash = window.location.hash;
                if (!hash && !session) {
                    // No session and no hash - definitely invalid access
                    if (mounted) {
                        toast.error("Invalid or expired password reset link");
                        navigate('/login');
                    }
                }

                // If there is a hash, we wait for Supabase to process it via onAuthStateChange
                // but we also set a timeout to fail if it takes too long
                setTimeout(() => {
                    if (mounted && verifyingSession) {
                        // Re-check session one last time
                        supabase.auth.getSession().then(
                            ({ data }: { data: { session: Session | null } }) => {
                                if (!data.session && mounted) {
                                    toast.error("Unable to verify session. Please try resetting your password again.");
                                    navigate('/login');
                                }
                            }
                        );

                    }
                }, 5000); // 5 second timeout

            } catch (err) {
                console.error("Session check failed", err);
                if (mounted) {
                    toast.error("An error occurred verifying your session");
                    navigate('/login');
                }
            }
        };

        checkSession();

        // Listen for auth state changes which happens when the hash is processed
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                if (session && mounted) {
                    setVerifyingSession(false);
                }
            }
        });

        return () => {
            mounted = false;
            authListener.subscription.unsubscribe();
        };
    }, [navigate]);

    const form = useForm<UpdatePasswordValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: UpdatePasswordValues) => {
        setLoading(true);
        try {
            // Double check session before calling update
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error("Your session has expired. Please request a new password reset link.");
            }

            const { error } = await supabase.auth.updateUser({
                password: data.password
            });

            if (error) throw error;

            toast.success('Password updated successfully!');
            navigate('/');
        } catch (error: any) {
            console.error('Update password error:', error);
            // If it's a session error, might need to redirect to login
            if (error.message?.includes('session')) {
                toast.error("Session expired. Please try again.");
                navigate('/login');
            } else {
                toast.error(error.message || 'Failed to update password');
            }
        } finally {
            setLoading(false);
        }
    };

    if (verifyingSession) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10px)]">
                <Loader className="w-8 h-8 border-2" isFullScreen={false} />
                <p className="mt-4 text-gray-500">Verifying security token...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center px-4 min-h-[calc(100vh-10px)]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/5 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-brand to-red-600 bg-clip-text text-transparent">
                        Set New Password
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Please enter your new password below
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Controller
                            name="password"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="password" className="dark:text-white">
                                        New Password
                                    </FieldLabel>
                                    <div className="relative">
                                        <Input
                                            {...field}
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            className="pr-10 dark:text-white"
                                            placeholder="Min. 6 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                                        >
                                            {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {fieldState.error && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="confirmPassword"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="confirmPassword" className="dark:text-white">
                                        Confirm Password
                                    </FieldLabel>
                                    <div className="relative">
                                        <Input
                                            {...field}
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            className="pr-10 dark:text-white"
                                            placeholder="Retype password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                                        >
                                            {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </button>
                                    </div>
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
                            {loading ? <Loader className="w-5 h-5 border-2 scale-50" isFullScreen={false} /> : 'Update Password'}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default UpdatePasswordPage;
