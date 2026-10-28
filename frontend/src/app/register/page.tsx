'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { FieldHint, Input, PendingButton } from '@/components/ui';
import { FormField } from '@/components/forms/FormField';
import { AuthError, AuthLayout } from '@/components/forms/AuthLayout';
import { useAppState } from '@/lib/store';
import { registerUser } from '@/lib/api';
import type { AuthApiError } from '@/types';

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Validate name
    if (!name.trim()) {
      setError('Please enter your name');
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerUser({
        email,
        password,
        username: name,
        phone_number: phoneNumber || undefined,
      });

      toast.success('Registration successful!');
      login(
        response.user.id,
        response.access_token,
        response.user.user_type,
        response.refresh_token,
        response.user.username,
        response.user.email,
        response.user.is_manager
      );
      router.push('/outlets');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const apiError = err as AuthApiError;
      const errorMessage = apiError.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Join Mission Recipes"
      description="Create an account to cost, test and share your dishes."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-ink underline underline-offset-2 hover:no-underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <FormField id="name" label="Name">
          <Input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>
        <FormField id="email" label="Email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>
        <FormField id="phone" label="Phone" optional>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="e.g. +65 1234 5678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </FormField>
        <FormField id="password" label="Password">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>
        <FormField id="confirmPassword" label="Confirm password">
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </FormField>
        <FieldHint className="-mt-2">At least 6 characters.</FieldHint>
        {error && <AuthError>{error}</AuthError>}
        <PendingButton type="submit" className="w-full" pending={isLoading}>
          Create account
        </PendingButton>
      </form>
    </AuthLayout>
  );
}
