'use client'

import { Plus, MessageCircleHeart, ChevronRight } from 'lucide-react';
import { use } from "react";
import { fetchWithAuth } from "@/utils/apiClient";

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
  category?: string;
  style?: string;
}

interface ChatRoom {
  id: string;
  title: string;
  lastMessage: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  authorEmail: string;
}

interface ChatListPageProps {
  currentUser: { email: string; name: string };
  onSelectChat: (chatId: string) => void;
  onCreateNewChat: () => void;
}

// Create a cache to store the promise
let chatCache: Promise<ChatRoom[]> | null = null;

function fetchChatRooms(): Promise<ChatRoom[]> {
  if (!chatCache) {
    chatCache = fetchWithAuth('/chat')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch chats');
        return res.json();
      })
      .catch(err => {
        chatCache = null; // Reset cache on error
        throw err;
      });
  }
  return chatCache;
}

// Export function to invalidate cache when needed
export function invalidateChatCache() {
  chatCache = null;
}

export function ChatListPage({ currentUser, onSelectChat, onCreateNewChat }: ChatListPageProps) {
  // Fetch chat rooms using Suspense
  const chatRooms = use(fetchChatRooms());
  
  // 내 채팅방만 필터링
  const myChats = chatRooms
    .filter(c => c.authorEmail === currentUser.email)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime() - 32400000;
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
      {/* New Chat Button */}
      <button
        onClick={onCreateNewChat}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-6 px-6 rounded-2xl hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg mb-6 flex items-center justify-center gap-3"
      >
        <Plus className="w-6 h-6" />
        <span className="text-lg">새로운 억빠 대화 시작하기</span>
      </button>


      {/* Chat List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
          <MessageCircleHeart className="w-6 h-6 text-pink-500" />
          대화 목록
        </h3>

        {myChats.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircleHeart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">아직 대화가 없어요</p>
            <p className="text-gray-400 text-sm">위에 버튼을 눌러 첫 대화를 시작해보세요!</p>
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
                      <h4 className="font-bold text-gray-800 truncate flex-1">
                        {chat.title}
                      </h4>
                      <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(chat.updatedAt)}</span>
                    </div>
                    <p className="text-gray-600 text-sm truncate mb-1">
                      {truncateText(chat.lastMessage, 80)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full font-medium">
                        💬 {chat.messages.length}개 메시지
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
