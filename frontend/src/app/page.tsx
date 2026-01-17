'use client'

import { useState, useEffect } from "react";
import { LoginPage } from "@/components/LoginPage";
import { Layout } from "@/components/Layout";
import { ChatListPage } from "@/components/ChatListPage";
import { ChatRoomPage } from "@/components/ChatRoomPage";
import { CommunityPage } from "@/components/CommunityPage";
import { MyPage } from "@/components/MyPage";

interface User {
  name: string;
  email: string;
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("user");
      const storedChats = localStorage.getItem("chatRooms");
      const storedPosts = localStorage.getItem("communityPosts");

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedChats) setChatRooms(JSON.parse(storedChats));
      if (storedPosts) setPosts(JSON.parse(storedPosts));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("chatRooms", JSON.stringify(chatRooms));
      localStorage.setItem("communityPosts", JSON.stringify(posts));
    }
  }, [user, chatRooms, posts]);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("user");
    }
    setUser(null);
    setCurrentPage("chat-list");
  };

  const handleCreateChat = (chatRoom: ChatRoom) => {
    setChatRooms([chatRoom, ...chatRooms]);
    setCurrentChatId(chatRoom.id);
    setCurrentPage("chat-room");
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setCurrentPage("chat-room");
  };

  const handleBackToList = () => {
    setCurrentPage("chat-list");
    setCurrentChatId(null);
  };

    const handleSendMessage = (chatId: string, content: string, category?: string, style?: string) => {
    const message: Message = {
      id: Date.now().toString(),
      sender: "user",
      content,
      timestamp: new Date().toISOString(),
      category,
      style,
    };

    setChatRooms((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, message],
            lastMessage: content,
            updatedAt: new Date().toISOString(),
          };
        }
        return chat;
      })
    );
  };

  const handleShareToFeed = (post: Post) => {
    setPosts([post, ...posts]);
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

  const handleComment = (postId: string, comment: Comment) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, comment],
          };
        }
        return post;
      })
    );
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
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
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleDeleteChat = (chatId: string) => {
    setChatRooms((prev) => prev.filter((c) => c.id !== chatId));
    setPosts((prev) => prev.filter((p) => p.chatId !== chatId));
    if (currentChatId === chatId) {
      setCurrentPage("chat-list");
      setCurrentChatId(null);
    }
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout
      currentPage={currentPage}
      currentUser={user}
      onNavigate={(page) => setCurrentPage(page as "chat-list" | "chat-room" | "community" | "mypage")}
      onLogout={handleLogout}
    >
      {currentPage === "chat-list" && (
        <ChatListPage
          currentUser={user}
          chatRooms={chatRooms}
          onSelectChat={handleSelectChat}
          onCreateNewChat={() => setCurrentPage("chat-room")}
        />
      )}
            {currentPage === "chat-room" && currentChatId && (
        <ChatRoomPage
          chatRoom={chatRooms.find((c) => c.id === currentChatId)!}
          onBack={handleBackToList}
          onSendMessage={handleSendMessage}
          onDeleteChat={handleDeleteChat}
          onCreatePost={(chatId, messageIds, isAnonymous) => {
            const chatRoom = chatRooms.find((c) => c.id === chatId);
            if (chatRoom) {
              const selectedMessages = chatRoom.messages.filter((m) => messageIds.includes(m.id));
              const post: Post = {
                id: Date.now().toString(),
                chatId,
                messageIds,
                messages: selectedMessages,
                author: isAnonymous ? "익명" : user.name,
                authorEmail: user.email,
                originalAuthorEmail: chatRoom.authorEmail,
                createdAt: new Date().toISOString(),
                reactions: [
                  { type: "empathy", count: 0, users: [] },
                  { type: "sad", count: 0, users: [] },
                  { type: "laugh", count: 0, users: [] },
                  { type: "love", count: 0, users: [] },
                ],
                comments: [],
              };
              handleShareToFeed(post);
            }
          }}
        />
      )}
            {currentPage === "community" && (
        <CommunityPage
          posts={posts}
          currentUser={user}
          onReactToPost={handleReaction}
          onAddComment={(postId, content, isAnonymous) => {
            const comment: Comment = {
              id: Date.now().toString(),
              author: isAnonymous ? "익명" : user?.name || "알 수 없음",
              authorEmail: user?.email || "",
              originalAuthorEmail: user?.email || "",
              content,
              timestamp: new Date().toISOString(),
            };
            handleComment(postId, comment);
          }}
          onDeletePost={handleDeletePost}
          onDeleteComment={handleDeleteComment}
        />
      )}
            {currentPage === "mypage" && (
        <MyPage
          posts={posts}
          comments={[]}
          currentUser={user}
          onNavigate={(page) => setCurrentPage(page as "chat-list" | "chat-room" | "community" | "mypage")}
          onDeleteComment={handleDeleteComment}
          onDeletePost={handleDeletePost}
        />
      )}
    </Layout>
  );
}