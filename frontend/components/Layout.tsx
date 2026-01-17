'use client'

import { Heart, Home, PenSquare, Users, User as UserIcon, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  currentUser: { name: string; email: string } | null;
  onLogout: () => void;
}

export function Layout({ children, currentPage, onNavigate, currentUser, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Bottom Navigation */}
      {currentUser && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex justify-around items-center py-3">
              <button
                onClick={() => onNavigate('home')}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  currentPage === 'home'
                    ? 'text-pink-600 bg-pink-50'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home className="w-6 h-6" />
                <span className="text-xs font-medium">홈</span>
              </button>

              <button
                onClick={() => onNavigate('community')}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  currentPage === 'community'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-6 h-6" />
                <span className="text-xs font-medium">커뮤니티</span>
              </button>

              <button
                onClick={() => onNavigate('mypage')}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  currentPage === 'mypage'
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <UserIcon className="w-6 h-6" />
                <span className="text-xs font-medium">마이페이지</span>
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}