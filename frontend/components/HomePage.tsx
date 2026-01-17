'use client'

import { Sparkles, TrendingUp, Users, MessageCircleHeart, Plus, ThumbsUp, ChevronRight } from 'lucide-react';

interface Worry {
  id: string;
  worry: string;
  response: string;
  category: string;
  style: string;
  intensityLevel: number;
  isPublic: boolean;
  author: string;
  authorEmail: string;
  createdAt: string;
  likes: number;
}

interface HomePageProps {
  onNavigate: (page: string) => void;
  userName: string;
  worries: Worry[];
  currentUser: { email: string } | null;
  onSelectChat: (worryId: string) => void;
}

export function HomePage({ onNavigate, userName, worries, currentUser, onSelectChat }: HomePageProps) {
  // 내 채팅만 필터링
  const myChats = worries
    .filter(w => w.authorEmail === currentUser?.email)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      love: '💕',
      career: '💼',
      appearance: '👤',
      relationship: '🤝',
      study: '📚',
    };
    return emojis[category] || '💭';
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      love: '연애',
      career: '진로',
      appearance: '외모',
      relationship: '관계',
      study: '공부',
    };
    return names[category] || category;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
          안녕하세요, {userName}님! 👋
        </h2>
        <p className="text-gray-600">
          오늘은 어떤 고민이 있으신가요?
        </p>
      </div>

      {/* New Chat Button */}
      <button
        onClick={() => onNavigate('create')}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-6 px-6 rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg mb-6 flex items-center justify-center gap-3"
      >
        <Plus className="w-6 h-6" />
        <span className="text-lg">새로운 억빠 받기</span>
      </button>

      {/* Chat History */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
          <MessageCircleHeart className="w-6 h-6 text-pink-500" />
          지난 억빠 내역
        </h3>

        {myChats.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircleHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">아직 억빠를 받은 적이 없어요</p>
            <p className="text-gray-400 text-sm">위에 버튼을 눌러 첫 억빠를 받아보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className="w-full bg-gradient-to-br from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 rounded-xl p-4 transition-all text-left border-2 border-transparent hover:border-pink-300 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full font-medium">
                        {getCategoryEmoji(chat.category)} {getCategoryName(chat.category)}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(chat.createdAt)}</span>
                    </div>
                    <p className="text-gray-800 font-medium mb-1 truncate">
                      {truncateText(chat.worry, 60)}
                    </p>
                    <p className="text-gray-600 text-sm truncate">
                      {truncateText(chat.response, 80)}
                    </p>
                    {chat.intensityLevel > 1 && (
                      <div className="mt-2 inline-flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
                        <span className="text-orange-600 font-semibold text-xs">
                          🔥 과몰입 레벨 {chat.intensityLevel}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {myChats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageCircleHeart className="w-6 h-6 text-pink-600" />
            </div>
            <p className="text-2xl font-bold text-pink-600">{myChats.length}</p>
            <p className="text-gray-600 text-sm">억빠 받은 횟수</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <ThumbsUp className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {myChats.filter(c => c.isPublic).reduce((sum, c) => sum + c.likes, 0)}
            </p>
            <p className="text-gray-600 text-sm">받은 좋아요</p>
          </div>
        </div>
      )}
    </div>
  );
}