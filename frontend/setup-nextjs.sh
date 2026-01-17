#!/bin/bash

# 억빠를 부탁해 - Next.js 변환 스크립트
# 사용법: ./setup-nextjs.sh

cd ~/immersion-camp-week2/frontend

echo "🚀 설치 시작..."

# 1. 디렉토리 생성
mkdir -p app/eokbba lib

# 2. utils 복사
cp figma-make-export/components/ui/utils.ts lib/utils.ts

# 3. components 복사
cp -r figma-make-export/components/* components/

# 4. UI 컴포넌트 utils 경로 수정
find components/ui -type f ! -name utils.ts -exec sed -i 's|from "./utils"|from "@/lib/utils"|g' {} +

# 5. 메인 컴포넌트에 'use client' 추가
for file in components/{LoginPage,ChatListPage,ChatRoomPage,CommunityPage,MyPage,Layout,HomePage,CreateWorryPage,ChatDetailPage}.tsx; do
  if [ -f "$file" ]; then
    if ! grep -q "'use client'" "$file"; then
      sed -i "1i 'use client'\n" "$file"
    fi
    sed -i 's|from "./ui/|from "@/components/ui/|g' "$file"
  fi
done

# 6. page.tsx 생성
cat > app/eokbba/page.tsx << 'EOF'
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
  messageId: string;
  userMessage: string;
  botResponse: string;
  author: string;
  authorEmail: string;
  timestamp: string;
  reactions: Reaction[];
  comments: Comment[];
  isAnonymous: boolean;
}

export default function EokbbaApp() {
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

  const handleSendMessage = (chatId: string, message: Message) => {
    setChatRooms((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, message],
            lastMessage: message.content,
            updatedAt: message.timestamp,
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
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      {currentPage === "chat-list" && (
        <ChatListPage
          user={user}
          chatRooms={chatRooms}
          onSelectChat={handleSelectChat}
          onCreateChat={handleCreateChat}
          onDeleteChat={handleDeleteChat}
        />
      )}
      {currentPage === "chat-room" && currentChatId && (
        <ChatRoomPage
          user={user}
          chatRoom={chatRooms.find((c) => c.id === currentChatId)!}
          onBack={handleBackToList}
          onSendMessage={handleSendMessage}
          onShareToFeed={handleShareToFeed}
        />
      )}
      {currentPage === "community" && (
        <CommunityPage
          user={user}
          posts={posts}
          onReaction={handleReaction}
          onComment={handleComment}
          onDeleteComment={handleDeleteComment}
          onDeletePost={handleDeletePost}
        />
      )}
      {currentPage === "mypage" && (
        <MyPage
          user={user}
          chatRooms={chatRooms}
          posts={posts}
          onDeleteChat={handleDeleteChat}
          onDeletePost={handleDeletePost}
        />
      )}
    </Layout>
  );
}
EOF

# 7. styles 복사
cp figma-make-export/styles/globals.css styles/

# 8. 패키지 설치
npm install lucide-react class-variance-authority clsx tailwind-merge

echo ""
echo "✅ 완료!"
echo "🚀 실행: npm run dev"
echo "📱 접속: http://localhost:3000/eokbba"
