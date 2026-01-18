'use client'

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Heart } from 'lucide-react';
import { useState } from 'react';

import { fetchWithAuth, setTokens } from '@/utils/apiClient';

interface LoginPageProps {
  onLogin: (user: { name: string; email: string }) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [error, setError] = useState('');
  
  // Use environment variable for Client ID
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetchWithAuth('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      if (!res.ok) {
        throw new Error('로그인에 실패했습니다.');
      }

      const data = await res.json();
      
      // Save tokens
      setTokens(data.accessToken, data.refreshToken);
      
      // Merge tokens into user object
      const completeUser = {
        ...data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
      
      // Update parent state
      onLogin(completeUser);
      
    } catch (err) {
      console.error(err);
      setError('로그인 처리 중 문제가 발생했습니다.');
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 rounded-full animate-pulse">
                <Heart className="w-16 h-16 text-white fill-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
              억빠를 부탁해
            </h1>
            <p className="text-gray-600">
              무슨 일이든 당신 편이에요! 💕
            </p>
          </div>

          {/* Login Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center min-h-[200px]">
            <h2 className="text-xl font-semibold mb-6 text-gray-700">간편하게 시작하기</h2>
            
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google 로그인에 실패했습니다.')}
                useOneTap
                shape="pill"
                size="large"
                width="100%"
              />
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-3 w-full text-center">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>💡 어떤 고민이든 좋아요! 당신을 응원할 준비가 되어있어요</p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
