'use client'

import { useState, useEffect, Suspense } from "react";
import { LoginPage } from "@/components/LoginPage";
import { Layout } from "@/components/Layout";
import { ChatListPage, invalidateChatCache } from "@/components/ChatListPage";
import { ChatRoomPage } from "@/components/ChatRoomPage";
import { CommunityPage } from "@/components/CommunityPage";
import { MyPage } from "@/components/MyPage";
import { MessageCircleHeart } from "lucide-react";
import { fetchWithAuth, clearTokens, updateUser } from "@/utils/apiClient";
import { ChatDetailPage } from "@/components/ChatDetailPage";
import PushEnableButton from "@/components/PushEnableButton";


export interface User {
  name: string;
  email: string;
  age?: number;
  gender?: 'male' | 'female';
  mbti?: string;
  intensity?: number;
  style?: string;
  postCnt?: number;
  commentCnt?: number;
  accessToken?: string;
  refreshToken?: string;
}

interface Message {
  id: string;
  sender: "user" | "bot";
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

interface Reaction {
  type: "empathy" | "sad" | "laugh" | "love";
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

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<"chat-list" | "chat-room" | "community" | "mypage">("chat-list");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  
  // 좋아요 서버 요청 중인 포스트 id 집합
  const [likingPostIds, setLikingPostIds] = useState<Set<string>>(new Set());
  const [isPWA, setIsPWA] = useState(false);
  
    useEffect(() => {
      // PWA 모드 감지
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone;
      setIsPWA(isStandalone);
    }, []);


  // 마이페이지 진입 시 서버에서 최신 유저 정보 동기화
  useEffect(() => {
    if (currentPage === 'mypage') {
      fetchUserProfile();
    }
    // eslint-disable-next-line
  }, [currentPage]);

  type Page = "chat-list" | "chat-room" | "community" | "mypage";

const navigate = (page: string) => {
  const allowed: Page[] = ["chat-list", "chat-room", "community", "mypage"];
  if (!allowed.includes(page as Page)) {
    console.error("Invalid page from Layout:", page);
    return;
  }

  const next = page as Page;
  if (next !== "chat-room") {
    setCurrentChatId(null);
  }
  // Invalidate chat cache when navigating to chat-list to refetch data
  if (next === "chat-list") {
    invalidateChatCache();
  }
  setCurrentPage(next);
};

const myComments = user
  ? posts.flatMap((p) =>
      p.comments
        .filter((c) => c.authorEmail === user.email)
        .map((c) => ({ ...c, postId: p.id }))
    )
  : [];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, []); // Run once on mount

  // 한 번만 실행: 닉네임 변경 시스템 이벤트 리스너
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleNicknameChange = (e: any) => {
        if (e.detail?.name) {
          setUser((prev) => prev ? { ...prev, name: e.detail.name } : null);
        }
      };
      window.addEventListener('nicknameChanged', handleNicknameChange);
      return () => window.removeEventListener('nicknameChanged', handleNicknameChange);
    }
  }, []); // Run once on mount

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [chatRes, postRes] = await Promise.all([
          fetchWithAuth('/chat'),
          fetchWithAuth('/community')
        ]);

        if (chatRes.ok) {
          const chats = await chatRes.json();
          setChatRooms(chats);
        }

        if (postRes.ok) {
          const fetchedPosts: Post[] = await postRes.json();
          
          // Fetch comments for each post
          const postsWithComments = await Promise.all(
            fetchedPosts.map(async (post) => {
              try {
                const commentRes = await fetchWithAuth(`/community/comment?post_id=${post.id}`);
                if (commentRes.ok) {
                  const comments = await commentRes.json();
                  // likedByMe 필드가 누락되지 않도록 명시적으로 복사
                  return { ...post, comments, likedByMe: post.likedByMe };
                }
              } catch (err) {
                console.error(`Failed to fetch comments for post ${post.id}:`, err);
              }
              return post;
            })
          );
          setPosts(postsWithComments);
        }
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChatId) return;

      try {
        const resp = await fetchWithAuth(`/chat/messages?conversation_id=${currentChatId}`);
        if (resp.ok) {
          const messages: Message[] = await resp.json();
          setChatRooms((prev) =>
            prev.map((chat) =>
              chat.id === currentChatId ? { ...chat, messages } : chat
            )
          );
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    if (currentPage === "chat-room") {
      fetchMessages();
      const interval = setInterval(fetchMessages, 1000); // Poll every 1 seconds
      return () => clearInterval(interval);
    }
  }, [currentChatId, currentPage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    }
  }, [user]);

  const handleLogin = (userData: User) => {
    // 닉네임, 나이, 성별이 있으면 User 객체에 반영
    setUser(prev => {
      // userData에 age, gender, name이 있으면 우선 반영
      return {
        ...prev,
        ...userData,
        name: userData.name ?? prev?.name ?? '',
        age: userData.age ?? prev?.age ?? '',
        gender: userData.gender ?? prev?.gender ?? '',
      };
    });
  };

  const fetchUserProfile = async () => {
    try {
      const resp = await fetchWithAuth('/my', { method: 'GET' });
      if (resp.ok) {
        const data = await resp.json();
        // Update user state and localStorage
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchWithAuth("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearTokens();
      setUser(null);
      setCurrentPage("chat-list");
    }
  };

  const handleCreateNewChat = async () => {
    try {
      const resp = await fetchWithAuth('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: '새 채팅' }),
      });

      if (resp.ok) {
        const newChat: ChatRoom = await resp.json();
        setChatRooms([newChat, ...chatRooms]);
        invalidateChatCache(); // Invalidate cache for ChatListPage
        setCurrentChatId(newChat.id);
        setCurrentPage("chat-room");
      } else {
        console.error("Failed to create chat room:", await resp.text());
      }
    } catch (err) {
      console.error("Error creating chat room:", err);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setCurrentPage("chat-room");
  };

  const handleBackToList = async () => {
    if (currentChatId) {
      const room = chatRooms.find((c) => c.id === currentChatId);
      // Only delete if there are no messages
      if (room && room.messages.length === 0) {
        try {
          const resp = await fetchWithAuth(`/chat?conversation_id=${currentChatId}`, {
            method: 'DELETE',
          });
          if (resp.ok) {
            setChatRooms((prev) => prev.filter((c) => c.id !== currentChatId));
            invalidateChatCache(); // Invalidate cache for ChatListPage
          }
        } catch (err) {
          console.error("Failed to delete empty chat room:", err);
        }
      }
    }
    setCurrentPage("chat-list");
    setCurrentChatId(null);
  };

  const handleSendMessage = async (chatId: string, content: string, category?: string, style?: string, useLocalLLM?: boolean) => {
    try {
      const resp = await fetchWithAuth(`/chat/messages?conversation_id=${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, role: 'user', useLocalLLM: useLocalLLM }), // role defaults to user
      });

      if (resp.ok) {
        const newMessage: Message = await resp.json();
        setChatRooms((prev) =>
          prev.map((chat) => {
            if (chat.id === chatId) {
              return {
                ...chat,
                messages: [...chat.messages, newMessage],
                lastMessage: content,
                updatedAt: new Date().toISOString(),
              };
            }
            return chat;
          })
        );
      } else {
        console.error("Failed to send message:", await resp.text());
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleShareToFeed = async (newPostData: { chatId: string, messageIds: string[] }) => {
    try {
      const resp = await fetchWithAuth('/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: newPostData.chatId,
          messageIds: newPostData.messageIds,
        }),
      });

      if (resp.ok) {
        const createdPost: Post = await resp.json();
        setPosts([createdPost, ...posts]);
        await fetchUserProfile();
      } else {
        console.error("Failed to share to feed:", await resp.text());
      }
    } catch (err) {
      console.error("Error sharing to feed:", err);
    }
  };

  const handleReaction = async (postId: string, reactionType: Reaction["type"]) => {
    if (!user) return;
    if (likingPostIds.has(postId)) return; // 연타 방지

    // 좋아요 서버 요청 중 표시
    setLikingPostIds(prev => new Set(prev).add(postId));

    // 1. 현재 좋아요 상태 판단 (likedByMe 기준)
    const post = posts.find((p) => p.id === postId);
    const isLiked = !!post?.likedByMe;

    // 2. optimistic UI update (likedByMe, reactions.count, reactions.users 모두 즉시 반영)
    setPosts((prev) => {
      return prev.map((p) => {
        if (p.id !== postId) return p;
        let newLikedByMe = p.likedByMe;
        const reactions = p.reactions.map((r) => {
          if (r.type === reactionType) {
            const hasReacted = r.users.includes(user.email);
            // 실제 토글될 때만 count 증감
            if (reactionType === "empathy") {
              newLikedByMe = !hasReacted;
            }
            return {
              ...r,
              count: hasReacted ? Math.max(0, r.count - 1) : r.count + 1,
              users: hasReacted
                ? r.users.filter((u) => u !== user.email)
                : [...r.users, user.email],
            };
          }
          return r;
        });
        return {
          ...p,
          likedByMe: reactionType === "empathy" ? newLikedByMe : p.likedByMe,
          reactions,
        };
      });
    });

    // 3. 서버에 동기화 (POST: 추가, DELETE: 취소)
    if (reactionType === "empathy") {
      const method = isLiked ? "DELETE" : "POST";
      try {
        await fetchWithAuth(`/community/${postId}/like`, { method });
        // 서버에서 최신 포스트 데이터 받아와서 동기화
        const resp = await fetchWithAuth(`/community/${postId}`);
        if (resp.ok) {
          const updatedPost = await resp.json();
          setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, ...updatedPost } : p));
        }
      } catch (err) {
        console.error("좋아요 동기화 실패:", err);
      }
    }
    // 서버 요청 끝나면 연타 방지 해제
    setLikingPostIds(prev => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  };

  const handleComment = async (postId: string, content: string, isAnonymous: boolean = false) => {
    try {
      const resp = await fetchWithAuth(`/community/comment?post_id=${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, anonymous: isAnonymous }),
      });

      if (resp.ok) {
        const newComment: Comment = await resp.json();
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                comments: [...post.comments, newComment],
              };
            }
            return post;
          })
        );
        if (user) {
          await fetchUserProfile();
        }
      } else {
        console.error("Failed to add comment:", await resp.text());
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const resp = await fetchWithAuth(`/community/comment/${commentId}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                comments: post.comments.filter((c) => c.id !== commentId),
              };
            }
            return post;
          })
        );
        await fetchUserProfile();
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const resp = await fetchWithAuth(`/community/${postId}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        await fetchUserProfile();
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const resp = await fetchWithAuth(`/chat?conversation_id=${chatId}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        setChatRooms((prev) => prev.filter((c) => c.id !== chatId));
        setPosts((prev) => prev.filter((p) => p.chatId !== chatId));
        invalidateChatCache(); // Invalidate cache for ChatListPage
        if (currentChatId === chatId) {
          setCurrentPage("chat-list");
          setCurrentChatId(null);
        }
      } else {
        console.error("Failed to delete chat room:", await resp.text());
      }
    } catch (err) {
      console.error("Error deleting chat room:", err);
    }
  };

  const handleUpdateTitle = async (chatId: string, title: string) => {
    try {
      const commentRes = await fetchWithAuth('/chat', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversation_id: chatId, title: title }),
      });
      if (commentRes.ok) {
        const chatRes = await fetchWithAuth('/chat');
        if (chatRes.ok) {
          const chats = await chatRes.json();
          setChatRooms(chats);
          // Invalidate cache so ChatListPage shows updated data
          invalidateChatCache();
        }
      }
    } catch (err) {
      console.error(`Failed to update chat room id ${chatId}:`, err);
    }
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout
      currentPage={currentPage}
      currentUser={user}
      onNavigate={navigate}
      onLogout={handleLogout}
    >
      {isPWA ? <PushEnableButton /> : null}
      {currentPage === "chat-list" && (
        <Suspense fallback={
          <div className="max-w-4xl mx-auto pb-24">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <MessageCircleHeart className="w-16 h-16 text-pink-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-gray-600 font-medium">대화 목록을 불러오는 중...</p>
                </div>
              </div>
            </div>
          </div>
        }>
          <ChatListPage
            currentUser={user}
            onSelectChat={handleSelectChat}
            onCreateNewChat={handleCreateNewChat}
          />
        </Suspense>
      )}
            {currentPage === "chat-room" && currentChatId && (
        <ChatRoomPage
          chatRoom={chatRooms.find((c) => c.id === currentChatId)!}
          onBack={handleBackToList}
          onSendMessage={handleSendMessage}
          onDeleteChat={handleDeleteChat}
          onUpdateTitle={handleUpdateTitle}
          onCreatePost={async (chatId, messageIds, isAnonymous) => {
            await handleShareToFeed({ chatId, messageIds });
            setCurrentPage("community");
          }}
        />
      )}
            {currentPage === "community" && (
        <CommunityPage
          posts={posts}
          currentUser={user}
          onReactToPost={handleReaction}
          onAddComment={handleComment}
          onDeletePost={handleDeletePost}
          onDeleteComment={handleDeleteComment}
          likingPostIds={likingPostIds}
        />
      )}
      {currentPage === "mypage" && (
        <MyPage
          currentUser={user}
          setCurrentUser={setUser}
          onNavigate={navigate}
          onDeleteComment={handleDeleteComment}
          onDeletePost={handleDeletePost}
          onLogout={handleLogout}
        />
      )}
    </Layout>
  );
}

// 마이페이지 진입 시 서버에서 최신 유저 정보 동기화
// 반드시 컴포넌트 함수 내부 최상단에서 호출되어야 함
// (컴포넌트 return 이후에 훅 호출 불가)