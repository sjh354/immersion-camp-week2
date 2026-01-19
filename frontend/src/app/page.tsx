'use client'

import { useState, useEffect } from "react";
import { LoginPage } from "@/components/LoginPage";
import { Layout } from "@/components/Layout";
import { ChatListPage } from "@/components/ChatListPage";
import { ChatRoomPage } from "@/components/ChatRoomPage";
import { CommunityPage } from "@/components/CommunityPage";
import { MyPage } from "@/components/MyPage";
import { fetchWithAuth, clearTokens, updateUser } from "@/utils/apiClient";

export interface User {
  name: string;
  email: string;
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
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<"chat-list" | "chat-room" | "community" | "mypage">("chat-list");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

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
  }, []);

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
                  return { ...post, comments };
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
    setUser(userData);
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
          }
        } catch (err) {
          console.error("Failed to delete empty chat room:", err);
        }
      }
    }
    setCurrentPage("chat-list");
    setCurrentChatId(null);
  };

  const handleSendMessage = async (chatId: string, content: string, category?: string, style?: string) => {
    try {
      const resp = await fetchWithAuth(`/chat/messages?conversation_id=${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, role: 'user' }), // role defaults to user
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

  const handleReaction = (postId: string, reactionType: Reaction["type"]) => {
    if (!user) return;

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const reactions = post.reactions.map((r) => {
            if (r.type === reactionType) {
              const hasReacted = r.users.includes(user.email);
              return {
                ...r,
                count: hasReacted ? r.count - 1 : r.count + 1,
                users: hasReacted
                  ? r.users.filter((u) => u !== user.email)
                  : [...r.users, user.email],
              };
            }
            return {
              ...r,
              count: r.users.includes(user.email) ? r.count - 1 : r.count,
              users: r.users.filter((u) => u !== user.email),
            };
          });
          return { ...post, reactions };
        }
        return post;
      })
    );
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
      {currentPage === "chat-list" && (
        <ChatListPage
          currentUser={user}
          chatRooms={chatRooms}
          onSelectChat={handleSelectChat}
          onCreateNewChat={handleCreateNewChat}
        />
      )}
            {currentPage === "chat-room" && currentChatId && (
        <ChatRoomPage
          chatRoom={chatRooms.find((c) => c.id === currentChatId)!}
          onBack={handleBackToList}
          onSendMessage={handleSendMessage}
          onDeleteChat={handleDeleteChat}
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
        />
      )}
            {currentPage === "mypage" && (
        <MyPage
          currentUser={user}
          onNavigate={navigate}
          onDeleteComment={handleDeleteComment}
          onDeletePost={handleDeletePost}
          onLogout={handleLogout}
        />
      )}
    </Layout>
  );
}