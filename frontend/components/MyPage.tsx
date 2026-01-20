'use client'

import { useEffect, useState } from 'react';
import { FileText, MessageCircle, Settings, Heart } from 'lucide-react';
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
  likedByMe?: boolean;
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
  setCurrentUser?: (user: User) => void;
  onNavigate: (page: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onDeletePost: (postId: string) => void;
  onLogout: () => void;
}

export function MyPage({ currentUser, setCurrentUser, onNavigate, onDeleteComment, onDeletePost, onLogout }: MyPageProps) {
  // 닉네임, 나이, 성별 상태 추가
  const [nickname, setNickname] = useState(currentUser?.name || '');
  const [age, setAge] = useState<number | ''>(currentUser?.age ?? '');
  const [gender, setGender] = useState<'male' | 'female' | ''>(currentUser?.gender ?? '');

  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'likes' | 'settings'>('posts');
  // 원본 값 저장
  const [originalStyle, setOriginalStyle] = useState<'comfort' | 'funny'>(
    (currentUser?.style as 'comfort' | 'funny') || 'comfort'
  );
  const [originalIntensity, setOriginalIntensity] = useState<number>(currentUser?.intensity || 1);
  const [originalMbtiType, setOriginalMbtiType] = useState<string>(currentUser?.mbti || 'ISTJ');

  // 수정 중 값
  const [style, setStyle] = useState<'comfort' | 'funny'>(originalStyle);
  const [intensity, setIntensity] = useState<number>(originalIntensity);
  const [mbtiType, setMbtiType] = useState<string>(originalMbtiType);
  
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [myComments, setMyComments] = useState<Comment[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [likeCount, setLikeCount] = useState<number>(0);

  useEffect(() => {
    if (currentUser) {
      const fetchMyActivity = async () => {
        try {
          const [postsResp, commentsResp, likesResp] = await Promise.all([
            fetchWithAuth('/my/posts'),
            fetchWithAuth('/my/comments'),
            fetchWithAuth('/my/likes')
          ]);
          if (postsResp.ok) setMyPosts(await postsResp.json());
          if (commentsResp.ok) setMyComments(await commentsResp.json());
          if (likesResp.ok) {
            const likesData = await likesResp.json();
            setLikedPosts(likesData.posts || []);
            setLikeCount(likesData.count || 0);
          }
        } catch (err) {
          console.error("Error fetching my activity:", err);
        }
      };
      fetchMyActivity();
    }
  }, [currentUser]);


  // 설정창 진입 시 원본값 동기화
  useEffect(() => {
    if (activeTab === 'settings' && currentUser) {
      setOriginalStyle((currentUser.style as 'comfort' | 'funny') || 'comfort');
      setOriginalIntensity(currentUser.intensity || 1);
      setOriginalMbtiType(currentUser.mbti || 'ISTJ');
      setStyle((currentUser.style as 'comfort' | 'funny') || 'comfort');
      setIntensity(currentUser.intensity || 1);
      setMbtiType(currentUser.mbti || 'ISTJ');
      setNickname(currentUser.name || '');
      setAge(currentUser.age ?? '');
      setGender(currentUser.gender ?? '');
    }
  }, [activeTab, currentUser]);
  

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
      {/* 설정 탭일 때는 헤더/통계/탭 숨김 */}
      {activeTab === 'settings' && (
        <>
          <div className="flex items-center mb-8">
            <button
              onClick={() => setActiveTab('posts')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-2"
              title="마이페이지로 돌아가기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-xl font-bold text-gray-800">설정</span>
          </div>
          {/* ...existing code... */}
        </>
      )}
      {activeTab !== 'settings' && (
        <>
          {/* Header */}
          <div className="relative mb-14 flex items-center justify-between">
            {/* 중앙 텍스트 */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-full flex flex-col items-center pointer-events-none">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3 text-center pointer-events-auto">
                마이 페이지
              </h2>
              <p className="text-gray-600 text-center pointer-events-auto">
                내 활동을 모아봤어요 💕
              </p>
            </div>
            {/* 설정 버튼 */}
            <button
              onClick={() => setActiveTab('settings')}
              className="ml-auto p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              title="설정"
            >
              <Settings className="w-7 h-7 text-gray-600" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-5 md:mb-10 min-h-[180px]">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center flex flex-col justify-center min-h-[180px]">
              <div className="bg-purple-100 w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 md:w-10 md:h-10 text-purple-600" />
              </div>
              <p className="text-gray-600 text-sm md:text-base mb-2">
                <span className="md:hidden">작성한<br />포스트</span>
                <span className="hidden md:inline">작성한 포스트</span>
              </p>
              <p className="text-2xl md:text-4xl font-bold text-purple-600">{currentUser?.postCnt ?? currentUser?.postCnt}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center flex flex-col justify-center min-h-[180px]">
              <div className="bg-pink-100 w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 md:w-10 md:h-10 text-pink-600" />
              </div>
              <p className="text-gray-600 text-sm md:text-base mb-2">
                <span className="md:hidden">작성한<br />댓글</span>
                <span className="hidden md:inline">작성한 댓글</span>
              </p>
              <p className="text-2xl md:text-4xl font-bold text-pink-600">{currentUser?.commentCnt ?? currentUser?.commentCnt}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center flex flex-col justify-center min-h-[180px]">
              <div className="bg-pink-100 w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 md:w-10 md:h-10 mx-auto" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <p className="text-gray-600 text-sm md:text-base mb-2">
                <span className="md:hidden">좋아요한<br />포스트</span>
                <span className="hidden md:inline">좋아요한 포스트</span>
              </p>
              <p className="text-2xl md:text-4xl font-bold text-pink-600">{likeCount}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-2 px-3 md:py-3 md:px-4 rounded-xl font-semibold transition-all text-base md:text-lg ${
                activeTab === 'posts'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="md:hidden">📝 포스트</span>
              <span className="hidden md:inline">📝 내 포스트</span>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-2 px-3 md:py-3 md:px-4 rounded-xl font-semibold transition-all text-base md:text-lg ${
                activeTab === 'comments'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="md:hidden">💬 댓글</span>
              <span className="hidden md:inline">💬 내 댓글</span>
            </button>
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex-1 py-2 px-3 md:py-3 md:px-4 rounded-xl font-semibold transition-all text-base md:text-lg ${
                activeTab === 'likes'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="md:hidden">❤️ 좋아요</span>
              <span className="hidden md:inline">❤️ 내 좋아요</span>
            </button>
          </div>
        </>
      )}

      {/* Content */}
      {activeTab === 'posts' ? (
        <div>
          {sortedPosts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-20 text-center min-h-[240px] flex flex-col items-center justify-center">
              <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <p className="text-gray-500 text-lg mb-2">아직 작성한 포스트가 없어요</p>
              <p className="text-gray-400 text-base">대화를 커뮤니티에 공유해보세요!</p>
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
                        // 유저 정보 갱신
                        if (setCurrentUser) {
                          try {
                            const res = await fetchWithAuth('/my');
                            if (res.ok) {
                              const data = await res.json();
                              if (data && data.user) {
                                // localStorage user 정보도 갱신
                                const userStr = localStorage.getItem('user');
                                if (userStr) {
                                  const userObj = JSON.parse(userStr);
                                  const newUser = { ...userObj, ...data.user };
                                  localStorage.setItem('user', JSON.stringify(newUser));
                                  setCurrentUser(newUser);
                                } else {
                                  setCurrentUser(data.user);
                                }
                              }
                            }
                          } catch (err) {
                            console.error('유저 정보 갱신 실패:', err);
                          }
                        }
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
            <div className="bg-white rounded-2xl shadow-lg p-20 text-center min-h-[240px] flex flex-col items-center justify-center">
              <MessageCircle className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <p className="text-gray-500 text-lg mb-2">아직 작성한 댓글이 없어요</p>
              <p className="text-gray-400 text-base">커뮤니티에서 소통해보세요!</p>
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
      ) : activeTab === 'likes' ? (
        <div>
          {likedPosts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-20 text-center min-h-[240px] flex flex-col items-center justify-center">
              <svg className="w-20 h-20 mx-auto mb-6" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">아직 좋아요한 포스트가 없어요</p>
              <p className="text-gray-400 text-base">마음에 드는 글에 좋아요를 눌러보세요!</p>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              {likedPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
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
                    {/* 좋아요 이모티콘 및 숫자 */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xl ${post.likedByMe ? 'text-pink-500' : 'text-gray-300'}`}
                        title={post.likedByMe ? '내가 누른 좋아요' : '좋아요'}
                      >
                        ❤️
                      </span>
                      <span className="text-lg font-bold text-pink-600">{post.reactions?.[0]?.count ?? 0}</span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    {post.messages.slice(0, 2).map((msg) => (
                      <div key={msg.id} className={`text-sm p-3 rounded-lg ${msg.sender === 'user' ? 'bg-gradient-to-r from-pink-100 to-purple-100' : 'bg-yellow-50'}`}>
                        <p className="font-medium text-xs text-gray-600 mb-1">{msg.sender === 'user' ? '나' : '억빠봇'}</p>
                        <p className="text-gray-800">{truncateText(msg.content, 100)}</p>
                      </div>
                    ))}
                    {post.messages.length > 2 && (
                      <p className="text-xs text-gray-500 text-center">+{post.messages.length - 2}개 메시지 더보기</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Settings Tab
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">👤 기본 정보</h3>
            <div className="flex flex-row gap-3 items-end">
              {/* 닉네임 */}
              <div className="flex-[2] min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                <input
                  type="text"
                  name="nickname"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="이름 입력"
                  maxLength={20}
                />
              </div>
              {/* 나이 */}
              <div className="flex-1 min-w-0 ml-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
                <input
                  type="number"
                  name="age"
                  value={age}
                  onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="나이"
                  min={0}
                  max={120}
                />
              </div>
              {/* 성별 */}
              <div className="flex-[1.5] min-w-0 ml-2">
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
            </div>
          </div>
          {/* 억빠 스타일 설정 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              🎨 억빠 스타일
            </h3>
            <p className="text-sm text-gray-600 mb-4">채팅에서 사용할 기본 스타일을 선택하세요</p>
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
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

          {/* 저장/취소 버튼 */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={async () => {
                // 저장: PATCH 여러 값 (닉네임 포함)
                console.log('PATCH /my', { name: nickname, style, intensity, mbti: mbtiType });
                const patchRes = await fetchWithAuth('/my', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    name: nickname,
                    age: age === '' ? null : age,
                    gender: gender || null,
                    style,
                    intensity,
                    mbti: mbtiType
                  })
                });
                console.log('PATCH /my response', patchRes);
                if (patchRes.ok) {
                  // 저장 후 유저 정보 갱신
                  const res = await fetchWithAuth('/my');
                  console.log('GET /my after PATCH', res);
                  if (res.ok) {
                    const data = await res.json();
                    console.log('GET /my data', data);
                    if (data && data.user) {
                      // localStorage user 정보도 갱신
                      const userStr = localStorage.getItem('user');
                      if (userStr) {
                        const userObj = JSON.parse(userStr);
                        const newUser = { ...userObj, ...data.user };
                        localStorage.setItem('user', JSON.stringify(newUser));
                        console.log('localStorage user updated', newUser);
                        if (setCurrentUser) setCurrentUser(newUser);
                      }
                    }
                  }
                  setOriginalStyle(style);
                  setOriginalIntensity(intensity);
                  setOriginalMbtiType(mbtiType);
                  setActiveTab('posts');
                  alert('설정이 저장되었습니다!');
                } else {
                  alert('설정 저장에 실패했습니다. 다시 시도해주세요.');
                }
              }}
              className="flex-1 py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              저장
            </button>
            <button
              onClick={() => {
                setStyle(originalStyle);
                setIntensity(originalIntensity);
                setMbtiType(originalMbtiType);
                setActiveTab('posts');
              }}
              className="flex-1 py-4 px-6 rounded-2xl font-bold text-gray-500 bg-white border-2 border-gray-200 hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              취소
            </button>
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