'use client'

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Trash2, MoreVertical, Sparkles, Share2, Check } from 'lucide-react';
import { fetchWithAuth } from '@/utils/apiClient';

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

interface ChatRoomPageProps {
  chatRoom: ChatRoom;
  onBack: () => void;
  onSendMessage: (chatId: string, content: string, category?: string, style?: string, useLocalLLM?: boolean) => void;
  onDeleteChat: (chatId: string) => void;
  onCreatePost: (chatId: string, messageIds: string[], isAnonymous?: boolean) => void;
  onUpdateTitle: (chatId: string, title: string) => void;
}

export function ChatRoomPage({ chatRoom, onBack, onSendMessage, onDeleteChat, onCreatePost, onUpdateTitle }: ChatRoomPageProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [shareAsAnonymous, setShareAsAnonymous] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [changeTitle, setChangeTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(chatRoom.title);
  const [localLLM, setLocalLLM] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevMessageCountRef = useRef(chatRoom.messages.length);

  // 메시지 추가될 때마다 스크롤 하단으로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isGenerating]);

  // 봇 응답이 도착했는지 감지
  useEffect(() => {
    const currentCount = chatRoom.messages.length;
    const prevCount = prevMessageCountRef.current;
    
    // 메시지가 추가되고, 마지막 메시지가 봇 메시지면 생성 완료
    if (currentCount > prevCount && chatRoom.messages[currentCount - 1]?.sender === 'bot') {
      setIsGenerating(false);
      // TODO : 알람 푸쉬
    }
    
    prevMessageCountRef.current = currentCount;
  }, [chatRoom.messages]);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    setIsGenerating(true);
    onSendMessage(chatRoom.id, inputMessage, undefined, undefined, localLLM);
    setInputMessage('');
    
    // 입력창 포커스 유지
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = () => {
    if (confirm('이 대화를 삭제하시겠어요?')) {
      onDeleteChat(chatRoom.id);
      onBack();
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleShareToFeed = () => {
    if (selectedMessages.length === 0) {
      alert('공유할 메시지를 선택해주세요!');
      return;
    }

    onCreatePost(chatRoom.id, selectedMessages, shareAsAnonymous);
    setSelectionMode(false);
    setSelectedMessages([]);
    setShareAsAnonymous(false);
    alert('커뮤니티에 공유되었습니다! 🎉');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    }
  };

  // 날짜별로 메시지 그룹화
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  chatRoom.messages.forEach((msg) => {
    const dateLabel = formatDate(msg.timestamp);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    
    if (lastGroup && lastGroup.date === dateLabel) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateLabel, messages: [msg] });
    }
  });

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-white rounded-t-2xl shadow-md p-4 mb-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-pink-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 min-w-0">
              {changeTitle ? (
                <div className="flex items-center gap-1 w-full">
                  <input
                    type="text"
                    value={newTitle}
                    autoFocus
                    placeholder="채팅방 이름을 입력하세요"
                    className="border-b border-pink-400 bg-pink-50 px-2 py-1 rounded font-bold text-gray-800 focus:outline-none focus:border-purple-500 transition-all w-full max-w-xs"
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        await onUpdateTitle(chatRoom.id, newTitle);
                        setChangeTitle(false);
                      }
                    }}
                    onBlur = {async () => {
                      await onUpdateTitle(chatRoom.id, newTitle);
                      setChangeTitle(false);
                    }}
                  />
                  <button
                    className="ml-1 p-1 rounded bg-pink-500 text-white hover:bg-pink-600 transition-all flex items-center justify-center"
                    title="이름 저장"
                    onClick={async () => {
                      await onUpdateTitle(chatRoom.id, newTitle);
                      setChangeTitle(false);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </button>
                  <button
                    className="ml-1 p-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition-all flex items-center justify-center"
                    title="취소"
                    onClick={() => {
                      setNewTitle(chatRoom.title);
                      setChangeTitle(false);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <h2 className="font-bold text-gray-800 truncate" onClick={() => setChangeTitle(true)}>{chatRoom.title}</h2>
                  <button
                    className="ml-1 px-2 py-1 rounded bg-pink-100 text-pink-500 font-semibold hover:bg-pink-200 transition-all text-xs"
                    title="이름 변경"
                    onClick={() => setChangeTitle(true)}
                  >변경</button>
                </div>
              )}
              <p className="text-xs text-gray-500">
                {chatRoom.messages.length}개 메시지
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <>
                <button
                  onClick={handleShareToFeed}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all text-sm font-medium flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  공유 ({selectedMessages.length})
                </button>
                <button
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedMessages([]);
                  }}
                  className="text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  취소
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {showSettings && (
                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48 z-20">
                    <button
                      onClick={() => {
                        setSelectionMode(true);
                        setShowSettings(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>커뮤니티에 공유</span>
                    </button>
                    <button className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors flex items-center gap-2">
                      <input type='checkbox' checked={localLLM} onChange={(e) => setLocalLLM(e.target.checked)}></input>
                      <span>내피땀눈물내마지막춤을</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        handleDelete();
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>대화 삭제</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {selectionMode && (
          <div className="mt-3 space-y-2">
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-800 font-medium">
                💡 커뮤니티에 공유할 메시지를 선택하세요
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg p-3 border-2 border-gray-200">
              <input
                type="checkbox"
                checked={shareAsAnonymous}
                onChange={(e) => setShareAsAnonymous(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">익명으로 공유하기</span>
            </div>
          </div>
        )}
      </div>

      {/* Category Selection (첫 메시지 전) */}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-lg p-4 mb-4">
        {chatRoom.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 rounded-full mb-4">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2 text-lg">새로운 대화 시작!</h3>
            <p className="text-gray-600 text-sm mb-4">
              고민을 말해보세요. 무조건 당신 편이에요! 💕
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMessages.map((group, groupIdx) => (
              <div key={groupIdx}>
                {/* Date Divider */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                    {group.date}
                  </div>
                </div>

                {/* Messages in this date group */}
                <div className="space-y-3">
                  {group.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                        {msg.sender === 'bot' && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-6 h-6 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">억</span>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">억빠봇</span>
                          </div>
                        )}
                        <div
                          onClick={() => selectionMode && toggleMessageSelection(msg.id)}
                          className={`rounded-2xl px-4 py-3 relative ${
                            msg.sender === 'user'
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                              : 'bg-gradient-to-br from-yellow-50 to-pink-50 border-2 border-pink-200 text-gray-800'
                          } ${
                            selectionMode ? 'cursor-pointer hover:opacity-80' : ''
                          } ${
                            selectedMessages.includes(msg.id) ? 'ring-4 ring-purple-400' : ''
                          }`}
                        >
                          {selectedMessages.includes(msg.id) && (
                            <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {msg.content}
                          </p>
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator - shown when bot is generating */}
                  {isGenerating && groupIdx === groupedMessages.length - 1 && (
                    <div className="flex justify-start">
                      <div className="max-w-[75%]">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-6 h-6 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">억</span>
                          </div>
                          <span className="text-xs text-gray-500 font-medium">억빠봇</span>
                        </div>
                        <div className="rounded-2xl px-4 py-3 bg-gradient-to-br from-yellow-50 to-pink-50 border-2 border-pink-200 text-gray-800">
                          <p className="whitespace-pre-wrap break-words leading-relaxed animate-pulse">
                            입력중...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      {!selectionMode && (
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none resize-none max-h-32"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim()}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-3 rounded-xl hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}