'use client';

import { useState } from 'react';
import { apiService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, BarChart3 } from 'lucide-react';

interface RegisterFormProps {
  onSuccess: () => void;
  onToggleMode: () => void;
}

export default function RegisterForm({ onSuccess, onToggleMode }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting registration with:', {
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email
      });

      const response = await apiService.register({
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password
      });
      
      console.log('Registration response:', response);
      
      if (response.success) {
        localStorage.setItem('access_token', response.token);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        onSuccess();
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: unknown) {
      console.error('Registration error:', err);
      
      const error = err as Error & { response?: Response };
      
      // Try to parse error response
      if (error.response) {
        try {
          const errorData = await error.response.json();
          setError(errorData.detail || errorData.message || 'Registration failed');
        } catch {
          setError(`Registration failed: ${error.response.status}`);
        }
      } else {
        setError('Registration failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-warm-gray-50 via-emerald-50 to-green-50">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:items-center lg:px-20 bg-gradient-to-br from-warm-gray-100 to-warm-gray-50">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-warm-gray-900">PlotCSV</h1>
            </div>
          </div>
          <h2 className="text-5xl font-bold text-warm-gray-900 mb-6 leading-tight">
            Start your<br />
            <span className="text-emerald-500">data journey</span>
          </h2>
          <p className="text-lg text-warm-gray-600 leading-relaxed mb-8">
            Create beautiful visualizations from your CSV data with ease.
          </p>
          <div className="flex items-center gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-warm-gray-200">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-warm-gray-900">Join to be the one</p>
              <p className="text-sm text-warm-gray-600">visualizing data effortlessly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-warm-gray-900">PlotCSV</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Username"
                className="h-12 border-warm-gray-300 bg-white focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg text-warm-gray-900 placeholder:text-warm-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Full Name"
                className="h-12 border-warm-gray-300 bg-white focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg text-warm-gray-900 placeholder:text-warm-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email address"
                className="h-12 border-warm-gray-300 bg-white focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg text-warm-gray-900 placeholder:text-warm-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
                minLength={6}
                className="h-12 border-warm-gray-300 bg-white focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg text-warm-gray-900 placeholder:text-warm-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm Password"
                minLength={6}
                className="h-12 border-warm-gray-300 bg-white focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg text-warm-gray-900 placeholder:text-warm-gray-400"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 bg-warm-gray-900 hover:bg-warm-gray-800 text-white font-medium rounded-lg transition-all duration-200"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            
            <div className="text-center pt-4">
              <span className="text-sm text-warm-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Sign in
                </button>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
