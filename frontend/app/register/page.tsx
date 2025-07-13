'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
      return;
    }
    setIsLoading(false);
  }, [router]);

  const handleSuccess = () => {
    router.push('/');
  };

  const handleToggleMode = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <RegisterForm onSuccess={handleSuccess} onToggleMode={handleToggleMode} />;
}
