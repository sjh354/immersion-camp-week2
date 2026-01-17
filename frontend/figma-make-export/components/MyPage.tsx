import { useState } from 'react';
import { FileText, MessageCircle } from 'lucide-react';

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
  author: string;
  authorEmail: string;
  originalAuthorEmail: string;
  content: string;
  timestamp: string;
}

interface MyPageProps {
  posts: Post[];
  comments: Comment[];
  currentUser: { name: string; email: string } | null;
  onNavigate: (page: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onDeletePost: (postId: string) => void;
}

export function MyPage({ posts, comments, currentUser, onNavigate, onDeleteComment, onDeletePost }: MyPageProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'comments'>('posts');
  
  // 현재 사용자의 포스트만 필터링 (익명 포스트 포함)
  const myPosts = posts.filter(p => p.originalAuthorEmail === currentUser?.email);
  
  // 현재 사용자의 댓글만 필터링 (익명 댓글 포함)
  const myComments = comments.filter(c => c.originalAuthorEmail === currentUser?.email);

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
    return posts.find(p => p.id === postId);
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
          <p className="text-3xl font-bold text-purple-600">{myPosts.length}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="bg-pink-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-6 h-6 text-pink-600" />
          </div>
          <p className="text-gray-600 text-sm mb-1">작성한 댓글</p>
          <p className="text-3xl font-bold text-pink-600">{myComments.length}</p>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('이 포스트를 삭제하시겠어요?')) {
                        onDeletePost(post.id);
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
      ) : (
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
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    {/* Comment Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {comment.author[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{comment.author}</p>
                          <p className="text-xs text-gray-500">{formatDate(comment.timestamp)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('이 댓글을 삭제하시겠어요?')) {
                            onDeleteComment(comment.postId, comment.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors text-sm"
                      >
                        삭제
                      </button>
                    </div>

                    {/* Comment Content */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-gray-800">{comment.content}</p>
                    </div>

                    {/* Original Post Preview */}
                    {post && (
                      <div 
                        onClick={() => onNavigate('community')}
                        className="border-l-4 border-purple-300 pl-3 cursor-pointer hover:bg-purple-50 p-2 rounded transition-colors"
                      >
                        <p className="text-xs text-gray-500 mb-1">원글</p>
                        <p className="text-sm text-gray-700">
                          {truncateText(post.messages[0]?.content || '', 80)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}