'use client'

import { useState } from 'react';
import { Heart, MessageCircle, Laugh, Frown, Send } from 'lucide-react';
import { User } from '@/src/app/page';
import PullToRefreshPage from '@/utils/PullToRefreshPage';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
}

interface Reaction {
  type: 'empathy' | 'sad' | 'laugh' | 'love';
  count: number;
  users: string[];
}

interface Comment {
  id: string;
  author: string;
  authorEmail: string;
  originalAuthorEmail: string;
  content: string;
  timestamp: string;
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
  reactions: Reaction[];
  comments: Comment[];
  likedByMe?: boolean;
}

interface CommunityPageProps {
  posts: Post[];
  currentUser: User | null;
  onReactToPost: (postId: string, reactionType: 'empathy' | 'sad' | 'laugh' | 'love') => void;
  onAddComment: (postId: string, content: string, isAnonymous?: boolean) => void;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onReloadCommunity: () => Promise<void>;
  likingPostIds?: Set<string>;
}

const reactionIcons = {
  empathy: { icon: '❤️', label: '좋아요', color: 'blue' },
  sad: { icon: '😢', label: '슬퍼요', color: 'gray' },
  laugh: { icon: '😂', label: '웃겨요', color: 'yellow' },
  love: { icon: '💕', label: '좋아요', color: 'pink' },
};

export function CommunityPage({ posts, currentUser, onReactToPost, onAddComment, onDeletePost, onDeleteComment, onReloadCommunity, likingPostIds }: CommunityPageProps) {
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  // 모든 댓글을 기본적으로 숨김 상태로 초기화
  const initialExpandedState = posts.reduce((acc, post) => {
    acc[post.id] = false;
    return acc;
  }, {} as { [key: string]: boolean });
  const [expandedPosts, setExpandedPosts] = useState<{ [postId: string]: boolean }>(initialExpandedState);
  const [commentAnonymous, setCommentAnonymous] = useState<{ [postId: string]: boolean }>({});

  const handleCommentSubmit = (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    const isAnonymous = commentAnonymous[postId] || false;
    onAddComment(postId, content, isAnonymous);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
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

  const toggleComments = (postId: string) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Header */}
      <PullToRefreshPage triggerFunction={onReloadCommunity} />
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
          커뮤니티
        </h2>
        <p className="text-gray-600">
          다른 사람들의 억빠 대화를 구경해보세요 💬
        </p>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">아직 공유된 대화가 없어요</p>
          <p className="text-gray-400 text-sm mt-2">첫 번째로 대화를 공유해보세요!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...posts].map((post) => {
            const totalReactions = post.reactions.reduce((sum, r) => sum + r.count, 0);
            const isExpanded = expandedPosts[post.id];

            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                {/* Author & Date */}
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
                  {currentUser && (post.originalAuthorEmail === currentUser.email || post.authorEmail === currentUser.email) && (
                    <button
                      onClick={() => {
                        if (confirm('이 포스트를 삭제하시겠어요?')) {
                          onDeletePost(post.id);
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors text-sm"
                    >
                      삭제
                    </button>
                  )}
                </div>

                {/* Messages */}
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 mb-4 space-y-3">
                  {post.messages.map((msg, idx) => (
                    <div key={msg.id}>
                      <div
                        className={`rounded-xl px-4 py-3 ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                            : 'bg-gradient-to-br from-yellow-50 to-pink-50 border-2 border-pink-200 text-gray-800'
                        }`}
                      >
                        {msg.sender === 'bot' && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-5 h-5 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">억</span>
                            </div>
                            <span className="text-xs font-semibold text-pink-600">억빠봇</span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                      {idx < post.messages.length - 1 && <div className="h-2" />}
                    </div>
                  ))}
                </div>

                {/* Reactions */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {post.reactions.map((reaction) => {
                    const config = reactionIcons[reaction.type];
                    // likedByMe가 true면 좋아요(공감) 버튼에 강조 표시
                    const hasReacted = reaction.type === 'empathy' ? post.likedByMe : false;

                    return (
                      <button
                        key={reaction.type}
                        onClick={() => onReactToPost(post.id, reaction.type)}
                        disabled={!!likingPostIds && likingPostIds.has(post.id)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                          hasReacted
                            ? reaction.type === 'empathy'
                              ? 'bg-blue-100 border-2 border-blue-400 text-blue-700'
                              : reaction.type === 'sad'
                              ? 'bg-gray-100 border-2 border-gray-400 text-gray-700'
                              : reaction.type === 'laugh'
                              ? 'bg-yellow-100 border-2 border-yellow-400 text-yellow-700'
                              : 'bg-pink-100 border-2 border-pink-400 text-pink-700'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <span>{config.icon}</span>
                        <span className="text-xs">{config.label}</span>
                        {reaction.count > 0 && (
                          <span className="ml-1 font-bold">{reaction.count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Comment Toggle */}
                <button
                  onClick={() => toggleComments(post.id)}
                  className="text-gray-600 hover:text-pink-600 transition-colors text-sm font-medium mb-3 flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  댓글 {post.comments.length}개
                  {isExpanded ? ' 숨기기' : ' 보기'}
                </button>

                {/* Comments */}
                {isExpanded && post.comments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">댓글 {post.comments.length}</p>
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-gray-300 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {comment.author[0]}
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-sm">{comment.author}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(comment.timestamp).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          {(currentUser && (comment.originalAuthorEmail === currentUser.email || comment.authorEmail === currentUser.email)) && (
                            <button
                              onClick={() => {
                                if (confirm('이 댓글을 삭제하시겠어요?')) {
                                  onDeleteComment(post.id, comment.id);
                                }
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors text-xs"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Input: 댓글이 펼쳐졌을 때만 보임 */}
                {isExpanded && (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={commentAnonymous[post.id] || false}
                          onChange={(e) => setCommentAnonymous(prev => ({ ...prev, [post.id]: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">익명으로 작성</span>
                      </label>
                      {commentAnonymous[post.id] && (
                        <span className="text-xs text-gray-500">"익명"으로 표시돼요</span>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [postId]: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCommentSubmit(post.id);
                          }
                        }}
                        placeholder="댓글을 입력하세요..."
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none text-sm"
                      />
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-2 rounded-lg hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}