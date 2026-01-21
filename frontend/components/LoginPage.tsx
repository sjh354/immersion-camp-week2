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
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [needExtra, setNeedExtra] = useState(false);
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  
  // Use environment variable for Client ID
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
  
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setGoogleCredential(credentialResponse.credential);
      const res = await fetchWithAuth('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      if (!res.ok) throw new Error('로그인에 실패했습니다.');
      const data = await res.json();
      if(data.hasOwnProperty('need_extra') && data.need_extra === true) {
        setNeedExtra(true);
      } else {
        setTokens(data.accessToken, data.refreshToken);
        onLogin({
          ...data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        });
      }
    } catch (err) {
      console.error(err);
      setError('로그인 처리 중 문제가 발생했습니다.');
    }
  };

  // 신규 유저 추가 정보 제출
  const handleExtraSubmit = async () => {
    try {
      if (!nickname || !age || !gender || !googleCredential) {
        setError('닉네임, 나이, 성별을 모두 입력해주세요.');
        return;
      }
      const res = await fetchWithAuth('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          token: googleCredential,
          extra: {
            nickname,
            age: age ? Number(age) : null,
            gender
          }
        }),
      });
      if (!res.ok) throw new Error('회원가입에 실패했습니다.');
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      const completeUser = {
        ...data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        // 입력값을 명시적으로 포함 (백엔드에서 내려주지 않아도 프론트에서 우선 반영)
        name: nickname,
        age: age ? Number(age) : null,
        gender: gender
      };
      onLogin(completeUser);
    } catch (err) {
      console.error(err);
      setError('회원가입 처리 중 문제가 발생했습니다.');
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

            {/* 신규 유저일 때만 추가 정보 입력 */}
            {needExtra ? (
              <>
                <div className="w-full mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="닉네임 입력"
                    maxLength={20}
                  />
                </div>
                <div className="w-full mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="나이 입력"
                    min={0}
                    max={120}
                  />
                </div>
                <div className="w-full mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                  <div className="flex flex-row w-full">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`flex-1 py-2 rounded-l-lg border border-gray-300 text-center font-medium transition-all ${gender === 'male' ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-blue-50'}`}
                    >
                      남
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`flex-1 py-2 rounded-r-lg border-t border-b border-r border-gray-300 text-center font-medium transition-all -ml-px ${gender === 'female' ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white' : 'bg-white text-gray-700 hover:bg-pink-50'}`}
                    >
                      여
                    </button>
                  </div>
                </div>
                <button
                  className="w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all shadow-sm mb-2"
                  onClick={handleExtraSubmit}
                >
                  회원가입 완료
                </button>
              </>
            ) : (
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
            )}

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
