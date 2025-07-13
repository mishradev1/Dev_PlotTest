'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { apiService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3 } from 'lucide-react';

interface LoginFormProps {
  onSuccess: () => void;
  onToggleMode: () => void;
}

interface SessionWithToken {
  accessToken?: string;
  user?: {
    email?: string | null;
    name?: string | null;
  };
}

export default function LoginForm({ onSuccess, onToggleMode }: LoginFormProps) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [typedText, setTypedText] = useState('');
  const fullText = "Upload CSV → Generate beautiful charts → Share insights → Repeat 📊📈🚀";

  useEffect(() => {
    let index = 0;
    let isDeleting = false;
    
    const typeEffect = () => {
      if (!isDeleting && index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else if (isDeleting && index >= 0) {
        setTypedText(fullText.slice(0, index));
        index--;
      }
      
      if (index === fullText.length + 1) {
        setTimeout(() => {
          isDeleting = true;
        }, 1500); // Pause at end for 1.5 seconds
      }
      
      if (index === 0 && isDeleting) {
        isDeleting = false;
        setTimeout(() => {
          index = 0;
        }, 300); // Pause before restarting
      }
    };
    
    const timer = setInterval(typeEffect, isDeleting ? 30 : 60);
    
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiService.login(formData);
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        onSuccess();
      } else {
        setError(response.message || 'Login failed');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/'
      });
      
      if (result?.ok) {
        // Wait for session to be established and get the backend token
        setTimeout(async () => {
          const session = await getSession();
          if (session && session.user) {
            const userData = {
              id: session.user.email,
              email: session.user.email,
              username: session.user.name,
              name: session.user.name
            };
            
            // Use the backend JWT token from session
            const backendToken = (session as SessionWithToken).accessToken;
            if (backendToken) {
              localStorage.setItem('access_token', backendToken);
              localStorage.setItem('token', backendToken);
            }
            
            localStorage.setItem('user', JSON.stringify(userData));
            onSuccess();
          }
        }, 1000);
      } else if (result?.error) {
        setError('Google sign-in failed. Please try again.');
      }
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-warm-gray-50 via-orange-50 to-amber-50">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:items-center lg:px-20 bg-gradient-to-br from-warm-gray-100 to-warm-gray-50">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-claude-orange-500 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-warm-gray-900">PlotCSV</h1>
            </div>
          </div>
          <h2 className="text-5xl font-bold text-warm-gray-900 mb-6 leading-tight">
            Your ideas,<br />
            <span className="text-claude-orange-500 relative">
              Scattered
            </span>👀 <br/>
             Amplified
          </h2>
          <div className="h-8 mb-4">
            <p className="text-lg text-warm-gray-600 font-medium">
              {typedText}
              <span className="animate-pulse text-claude-orange-500">|</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="p-2 bg-claude-orange-500 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-warm-gray-900">PlotCSV</span>
          </div>

          <div className="space-y-6">
            {/* Google Sign In Button */}
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              variant="outline"
              className="w-full h-12 bg-white border-warm-gray-300 hover:bg-warm-gray-50 text-warm-gray-700 font-medium rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-warm-gray-500 font-medium">OR</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your personal or work email"
                  className="h-12 border-warm-gray-300 bg-white focus:border-claude-orange-500 focus:ring-claude-orange-500/20 rounded-lg text-warm-gray-900 placeholder:text-warm-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="h-12 border-warm-gray-300 bg-white focus:border-claude-orange-500 focus:ring-claude-orange-500/20 rounded-lg text-warm-gray-900 placeholder:text-warm-gray-400"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 bg-warm-gray-900 hover:bg-warm-gray-800 text-white font-medium rounded-lg transition-all duration-200"
              >
                {loading ? 'Signing in...' : 'Continue with email'}
              </Button>
            </form>

            <div className="text-center pt-2">
              <span className="text-sm text-warm-gray-600">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="font-semibold text-claude-orange-600 hover:text-claude-orange-700 transition-colors"
                >
                  Sign up
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}