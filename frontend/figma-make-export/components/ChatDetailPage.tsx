import { ArrowLeft, ThumbsUp, Trash2, Globe, Lock, Heart, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';

interface Worry {
  id: string;
  worry: string;
  response: string;
  category: string;
  style: string;
  intensityLevel: number;
  isPublic: boolean;
  author: string;
  authorEmail: string;
  createdAt: string;
  likes: number;
}

interface ChatDetailPageProps {
  worry: Worry;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export function ChatDetailPage({ worry, onBack, onDelete }: ChatDetailPageProps) {
  const [copied, setCopied] = useState(false);

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      love: '💕',
      career: '💼',
      appearance: '👤',
      relationship: '🤝',
      study: '📚',
    };
    return emojis[category] || '💭';
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      love: '연애',
      career: '진로',
      appearance: '외모',
      relationship: '관계',
      study: '공부',
    };
    return names[category] || category;
  };

  const getStyleName = (style: string) => {
    const names: Record<string, string> = {
      comfort: '순수 위로형',
      funny: '웃긴 억빠형',
      intense: '과몰입형',
    };
    return names[style] || style;
  };

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

  const handleCopy = () => {
    navigator.clipboard.writeText(worry.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareText = `고민: ${worry.worry}\n\n억빠: ${worry.response}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (confirm('정말 이 억빠를 삭제하시겠어요?')) {
      onDelete(worry.id);
      onBack();
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">뒤로 가기</span>
        </button>
        
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            억빠 내역
          </h2>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium"
          >
            <Trash2 className="w-5 h-5" />
            삭제
          </button>
        </div>
      </div>

      {/* Detail Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        {/* Meta Info */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
              {getCategoryEmoji(worry.category)} {getCategoryName(worry.category)}
            </span>
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
              {getStyleName(worry.style)}
            </span>
            {worry.isPublic ? (
              <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <Globe className="w-3 h-3" />
                공개
              </span>
            ) : (
              <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" />
                비공개
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{formatDate(worry.createdAt)}</p>
        </div>

        {/* Worry */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            😢 나의 고민
          </h3>
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {worry.worry}
            </p>
          </div>
        </div>

        {/* Response */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-pink-600 mb-3 flex items-center gap-2">
            <ThumbsUp className="w-6 h-6" />
            억빠의 응원
          </h3>
          <div className="bg-gradient-to-br from-yellow-50 to-pink-50 rounded-xl p-6 border-2 border-pink-200">
            <p className="text-gray-800 leading-relaxed text-lg whitespace-pre-wrap">
              {worry.response}
            </p>
            {worry.intensityLevel > 1 && (
              <div className="mt-4 inline-flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full">
                <span className="text-orange-600 font-semibold">
                  🔥 억빠 과몰입 레벨: {worry.intensityLevel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Likes (if public) */}
        {worry.isPublic && (
          <div className="mb-6">
            <div className="bg-pink-50 rounded-xl p-4 border-2 border-pink-200 flex items-center justify-center gap-2">
              <Heart className="w-6 h-6 text-pink-600 fill-pink-600" />
              <span className="text-pink-600 font-bold text-lg">{worry.likes} 좋아요</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleCopy}
            className="flex-1 bg-white text-pink-600 font-semibold py-3 px-6 rounded-lg hover:bg-pink-50 border-2 border-pink-300 transition-all flex items-center justify-center gap-2"
          >
            <Copy className="w-5 h-5" />
            {copied ? '복사 완료!' : '응원 메시지 복사'}
          </button>
          
          <button
            onClick={handleShare}
            className="flex-1 bg-white text-purple-600 font-semibold py-3 px-6 rounded-lg hover:bg-purple-50 border-2 border-purple-300 transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            {copied ? '복사 완료!' : '전체 공유하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
