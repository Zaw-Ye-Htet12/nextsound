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
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });
            if (error) throw error;
            toast.success('Successfully logged in!');
            navigate('/');
        } catch (error: any) {
            toast.error(error.message || 'An error occurred during authentication');
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
        } catch (error: any) {
            console.error('Google login error:', error);
            toast.error(error.message || 'Failed to sign in with Google');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center px-4 min-h-[calc(100vh-10px)]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/5 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-brand to-red-600 bg-clip-text text-transparent">
                        Welcome Back
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Enter your credentials to access your account
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Controller
                            name="email"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="form-rhf-demo-title" className="dark:text-white">
                                        Email
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id="form-rhf-demo-title"
                                        aria-invalid={fieldState.invalid}
                                        placeholder="example@gmail.com"
                                        autoComplete="off"
                                        className="dark:text-white"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        <Controller
                            name="password"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <div className="flex items-center justify-between">
                                        <FieldLabel htmlFor="password-input" className="dark:text-white">
                                            Password
                                        </FieldLabel>
                                        <Link
                                            to="/forgot-password"
                                            className="text-xs text-brand hover:text-red-500 font-medium transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            {...field}
                                            id="password-input"
                                            aria-invalid={fieldState.invalid}
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="off"
                                            className="pr-10 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                                        >
                                            {showPassword ? (
                                                <Eye className="h-4 w-4" />
                                            ) : (
                                                <EyeOff className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {fieldState.invalid && (
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
                            {loading ? <Loader className="w-5 h-5 border-2 scale-50" isFullScreen={false} /> : 'Sign In'}
                        </Button>
                    </form>
                </Form>

                <div className="relative flex items-center justify-center my-4">
                    <Separator className="absolute" />
                    <span className="bg-white dark:bg-[#18181b] px-2 text-xs text-gray-500 dark:text-gray-400 relative z-10">OR</span>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    className="w-full bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200"
                >
                    <FcGoogle className="w-5 h-5 mr-2" />
                    Sign in with Google
                </Button>

                <div className="text-center">
                    <Link
                        to="/register"
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand dark:hover:text-red-400 transition-colors"
                    >
                        Don't have an account? Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
