'use client'

import { useState } from 'react';
import { Heart, Mail, Lock, User as UserIcon } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: { name: string; email: string; password: string }) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (isSignup && !name) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (isSignup) {
      // 회원가입
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const userExists = existingUsers.find((u: any) => u.email === email);

      if (userExists) {
        setError('이미 존재하는 이메일입니다.');
        return;
      }

      const newUser = { name, email, password };
      existingUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(existingUsers));
      onLogin(newUser);
    } else {
      // 로그인
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const user = existingUsers.find((u: any) => u.email === email && u.password === password);

      if (!user) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        return;
      }

      onLogin(user);
    }
  };

  return (
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

        {/* Login/Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setIsSignup(false);
                setError('');
              }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                !isSignup
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => {
                setIsSignup(true);
                setError('');
              }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                isSignup
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이름
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {isSignup ? '회원가입 하기' : '로그인 하기'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              {isSignup ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}{' '}
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                }}
                className="text-purple-600 font-semibold hover:underline"
              >
                {isSignup ? '로그인' : '회원가입'}
              </button>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💡 어떤 고민이든 좋아요! 당신을 응원할 준비가 되어있어요</p>
        </div>
      </div>
    </div>
  );
}
