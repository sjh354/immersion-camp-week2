'use client'

import { useEffect, useState } from 'react';
import { FileText, MessageCircle, Settings } from 'lucide-react';
import { User } from '@/src/app/page';
import { fetchWithAuth } from '@/utils/apiClient';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
  category?: string;
  style?: string;
}

interface Post {
  id: string;
  chatId: string;
  messageIds: string[];
  messages: Message[];
  author: string;
  authorEmail: string;
  originalAuthorEmail: string;
  createdAt: string;
}

interface Comment {
  id: string;
  postId: string;
  postContent?: string;
  author: string;
  authorEmail: string;
  originalAuthorEmail: string;
  content: string;
  timestamp: string;
}

interface MyPageProps {
  currentUser: User | null;
  onNavigate: (page: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onDeletePost: (postId: string) => void;
  onLogout: () => void;
}

export function MyPage({ currentUser, onNavigate, onDeleteComment, onDeletePost, onLogout }: MyPageProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'settings'>('posts');
  const [style, setStyle] = useState<'comfort' | 'funny' | 'obsessed'>(
    (currentUser?.style as 'comfort' | 'funny' | 'obsessed') || 'comfort'
  );
  const [intensity, setIntensity] = useState<number>(currentUser?.intensity || 1);
  const [mbtiType, setMbtiType] = useState<string>(currentUser?.mbti || 'ISTJ');
  
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myComments, setMyComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (currentUser) {
      const fetchMyActivity = async () => {
        try {
          const [postsResp, commentsResp] = await Promise.all([
            fetchWithAuth('/my/posts'),
            fetchWithAuth('/my/comments')
          ]);
          if (postsResp.ok) setMyPosts(await postsResp.json());
          if (commentsResp.ok) setMyComments(await commentsResp.json());
        } catch (err) {
          console.error("Error fetching my activity:", err);
        }
      };
      fetchMyActivity();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.style !== style) {
      fetchWithAuth('/my', {
        method: 'PATCH',
        body: JSON.stringify({ style })
      });
    }
  }, [style, currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.intensity !== intensity) {
      fetchWithAuth('/my', {
        method: 'PATCH',
        body: JSON.stringify({ intensity })
      });
    }
  }, [intensity, currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.mbti !== mbtiType) {
      fetchWithAuth('/my', {
        method: 'PATCH',
        body: JSON.stringify({ mbti: mbtiType })
      });
    }
  }, [mbtiType, currentUser]);
  

  // 최신순 정렬
  const sortedPosts = [...myPosts].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const sortedComments = [...myComments].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 특정 포스트 찾기
  const getPostById = (postId: string) => {
    return myPosts.find((p: Post) => p.id === postId);
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
          마이 페이지
        </h2>
        <p className="text-gray-600">
          내 활동을 모아봤어요 💕
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-gray-600 text-sm mb-1">작성한 포스트</p>
          <p className="text-3xl font-bold text-purple-600">{currentUser?.postCnt ?? myPosts.length}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-6 h-6 text-pink-600" />
          </div>
          <p className="text-gray-600 text-sm mb-1">작성한 댓글</p>
          <p className="text-3xl font-bold text-pink-600">{currentUser?.commentCnt ?? myComments.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            activeTab === 'posts'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          📝 내 포스트
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            activeTab === 'comments'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          💬 내 댓글
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Settings className="w-5 h-5" />
          설정
        </button>
      </div>

      {/* Content */}
      {activeTab === 'posts' ? (
        <div>
          {sortedPosts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">아직 작성한 포스트가 없어요</p>
              <p className="text-gray-400 text-sm mt-2">대화를 커뮤니티에 공유해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                        {post.author[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{post.author}</p>
                        <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                    {post.author === '익명' && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                        익명 작성
                      </span>
                    )}
                  </div>

                  {/* Messages Preview */}
                  <div 
                    onClick={() => onNavigate('community')}
                    className="space-y-2 mb-3 cursor-pointer"
                  >
                    {post.messages.slice(0, 2).map((msg) => (
                      <div
                        key={msg.id}
                        className={`text-sm p-3 rounded-lg ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-pink-100 to-purple-100'
                            : 'bg-yellow-50'
                        }`}
                      >
                        <p className="font-medium text-xs text-gray-600 mb-1">
                          {msg.sender === 'user' ? '나' : '억빠봇'}
                        </p>
                        <p className="text-gray-800">{truncateText(msg.content, 100)}</p>
                      </div>
                    ))}
                    {post.messages.length > 2 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{post.messages.length - 2}개 메시지 더보기
                      </p>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation(); // Prevent triggering onNavigate from parent div
                      if (confirm('이 포스트를 삭제하시겠어요?')) {
                        await onDeletePost(post.id);
                        setMyPosts(prev => prev.filter(p => p.id !== post.id));
                      }
                    }}
                    className="text-gray-400 hover:text-red-600 transition-colors text-sm"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'comments' ? (
        <div>
          {sortedComments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">아직 작성한 댓글이 없어요</p>
              <p className="text-gray-400 text-sm mt-2">커뮤니티에서 소통해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedComments.map((comment) => {
                const post = getPostById(comment.postId);
                return (
                  <div
                    key={comment.id}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow flex flex-col"
                  >
                    {/* Comment Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {comment.author[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{comment.author}</p>
                        <p className="text-xs text-gray-500">{formatDate(comment.timestamp)}</p>
                      </div>
                    </div>
                    {/* Original Post Preview */}
                    {post && (
                      <div 
                        onClick={() => onNavigate('community')}
                        className="border-l-4 border-purple-300 pl-3 cursor-pointer hover:bg-purple-50 p-2 rounded transition-colors mb-2"
                      >
                        <p className="text-xs text-gray-500 mb-1">원문 포스트</p>
                        <p className="text-sm text-gray-700">
                          {truncateText(post.messages[0]?.content || '', 80)}
                        </p>
                      </div>
                    )}
                    {/* Comment Content */}
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <p className="text-gray-800">{comment.content}</p>
                    </div>
                    {/* Delete Button 하단 좌측 정렬 */}
                    <div className="flex justify-start mt-2">
                      <button
                        onClick={async () => {
                          if (confirm('이 댓글을 삭제하시겠어요?')) {
                            await onDeleteComment(comment.postId, comment.id);
                            setMyComments(prev => prev.filter(c => c.id !== comment.id));
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // Settings Tab
        <div className="space-y-6">
          {/* 억빠 스타일 설정 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              🎨 억빠 스타일
            </h3>
            <p className="text-sm text-gray-600 mb-4">채팅에서 사용할 기본 스타일을 선택하세요</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setStyle('comfort')}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  style === 'comfort'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                😇 위로형
              </button>
              <button
                onClick={() => setStyle('funny')}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  style === 'funny'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🤡 웃김형
              </button>
              <button
                onClick={() => setStyle('obsessed')}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  style === 'obsessed'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🔥 과몰입형
              </button>
            </div>
          </div>

          {/* 억빠 강도 설정 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              💪 억빠 강도
            </h3>
            <p className="text-sm text-gray-600 mb-4">얼마나 강하게 응원받고 싶으신가요?</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setIntensity(1)}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  intensity === 1
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                😌 약
              </button>
              <button
                onClick={() => setIntensity(3)}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  intensity === 3
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💪 중
              </button>
              <button
                onClick={() => setIntensity(5)}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  intensity === 5
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🔥 강
              </button>
            </div>
          </div>

          {/* MBTI 유형 설정 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              🎭 MBTI 유형
            </h3>
            <p className="text-sm text-gray-600 mb-4">당신의 성격 유형을 선택하세요</p>
            <div className="grid grid-cols-8 gap-2">
              {[
                'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
                'ISTP', 'ISFP', 'INFP', 'INTP',
                'ESTP', 'ESFP', 'ENFP', 'ENTP',
                'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
              ].map((mbti) => (
                <button
                  key={mbti}
                  onClick={() => setMbtiType(mbti)}
                  className={`py-2 px-1 rounded-lg font-medium transition-all text-sm ${
                    mbtiType === mbti
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mbti}
                </button>
              ))}
            </div>
          </div>

          {/* 저장 완료 메시지 */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border-2 border-pink-200 text-center">
            <p className="font-semibold text-gray-800 mb-2">✨ 설정이 저장되었습니다!</p>
            <p className="text-sm text-gray-600">채팅에서 이 설정으로 억빠를 받으실 수 있습니다</p>
          </div>

          {/* 로그아웃 버튼 */}
          <div className="pt-4">
            <button
              onClick={() => {
                if (confirm('정말 로그아웃 하시겠어요?')) {
                  onLogout();
                }
              }}
              className="w-full py-4 px-6 rounded-2xl font-bold text-red-500 bg-white border-2 border-red-100 hover:bg-red-50 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              🚪 로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}