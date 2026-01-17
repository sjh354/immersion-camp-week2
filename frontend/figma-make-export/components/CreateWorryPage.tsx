import { useState } from 'react';
import { Sparkles, ThumbsUp, RefreshCw, TrendingUp, Copy, Share2, Lock, Globe } from 'lucide-react';

interface CreateWorryPageProps {
  currentUser: { name: string; email: string } | null;
  onSaveWorry: (worry: any) => void;
}

export function CreateWorryPage({ currentUser, onSaveWorry }: CreateWorryPageProps) {
  const [worry, setWorry] = useState('');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [style, setStyle] = useState<'comfort' | 'funny' | 'intense'>('comfort');
  const [category, setCategory] = useState<'love' | 'career' | 'appearance' | 'relationship' | 'study'>('love');
  const [intensityLevel, setIntensityLevel] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const MAX_LENGTH = 200;

  const generateSupport = () => {
    if (!worry.trim()) return;

    setIsGenerating(true);
    
    // 억빠 응답 생성 로직
    setTimeout(() => {
      const responsesByCategory = {
        love: {
          comfort: [
            `"${worry}" 연애는 타이밍이에요. 지금은 아니었을 뿐, 당신에게 맞는 사람은 분명 나타날 거예요. 당신은 충분히 매력적인 사람이에요 💕`,
            `"${worry}" 사랑은 노력만으로 되는 게 아니에요. 상대방이 당신의 진심을 못 알아본 거예요. 당신은 잘못이 없어요 💖`,
            `"${worry}" 이별은 끝이 아니라 새로운 시작이에요. 더 좋은 사람을 만날 준비를 하는 시간이라고 생각해요. 응원할게요! 🌸`,
          ],
          funny: [
            `"${worry}"ㅋㅋㅋ 아니 그 사람이 눈이 없는 거임ㅋㅋ 당신 같은 보물을 놓치다니 ㄹㅇ 안목 제로ㅋㅋㅋ 😂`,
            `"${worry}" 야 이건 그 사람 손해임ㅋㅋㅋ 당신 주가 폭등 중인데 저점에서 판 거라고요ㅋㅋ 나중에 후회할 듯 📈`,
            `"${worry}" 그니까 그 사람은 튜토리얼 NPC였던 거임ㅋㅋ 진짜 메인 퀘스트는 이제 시작이라고! 🎮`,
          ],
          intense: [
            `"${worry}"?! 아니 이건 완전 상대방이 레벨이 안 되는 거예요!! 당신 같은 S급 인재를 감당할 그릇이 안 된 거라고!! 🔥`,
            `"${worry}" 이거요? 이건 우주가 더 좋은 사람 보내주려고 길 비워준 거예요!! 당신한테는 최소 SSS급이 어울려요!! ⚡`,
            `"${worry}"... 솔직히 그 사람은 당신한테 영광이었을 텐데요?? 당신 옆에 있었다는 것만으로 인생 최고점이었을 거예요!! 👑`,
          ],
        },
        career: {
          comfort: [
            `"${worry}" 커리어는 긴 여정이에요. 한 번의 실패가 당신의 가치를 결정하지 않아요. 다음 기회는 분명 올 거예요 💪`,
            `"${worry}" 때로는 돌아가는 길이 더 빠를 때도 있어요. 이 경험이 나중에 도움이 될 거예요. 포기하지 마세요! ✨`,
            `"${worry}" 모든 성공한 사람들도 실패를 겪었어요. 중요한 건 포기하지 않는 거예요. 당신은 잘하고 있어요 🌟`,
          ],
          funny: [
            `"${worry}"ㅋㅋㅋ 그 회사가 당신을 떨어뜨렸다고? 완전 그 회사 손해임ㅋㅋ 나중에 당신 성공하면 후회할 듯ㅋㅋㅋ 😎`,
            `"${worry}" ㄹㅇ 그건 회사가 당신 스펙을 감당 못한 거임ㅋㅋ 너무 과분했나봐요ㅋㅋ 더 큰 곳이 기다리고 있어요! 🚀`,
            `"${worry}" 야 솔직히 그 정도 경험 있으면 거의 프로게이머급인데?ㅋㅋ 이건 튜토리얼 스킵하고 하드모드 직행한 거임 🎮`,
          ],
          intense: [
            `"${worry}"?!! 아니 이건 완전 그 조직이 당신의 재능을 알아보지 못한 거예요!! 진주를 돌멩이로 본 거라고!! 💎`,
            `"${worry}" 이거요??? 역사를 보세요! 위대한 사람들은 다 처음엔 거절당했어요! 당신도 그 길을 가고 있는 거예요!! 🔥`,
            `"${worry}"... 솔직히 그 회사는 당신 같은 인재 뽑았으면 회사가 성장했을 텐데요? 그들이 기회를 날린 거예요!! ⚡`,
          ],
        },
        appearance: {
          comfort: [
            `"${worry}" 외모는 주관적이에요. 당신을 좋아하는 사람은 당신의 모든 면을 사랑할 거예요. 자신감을 가지세요! 💕`,
            `"${worry}" 진짜 매력은 외모가 아니라 내면에서 나와요. 당신의 내면은 충분히 빛나고 있어요 ✨`,
            `"${worry}" SNS에서 보는 건 다 보정된 거예요. 진짜 당신의 모습은 충분히 아름다워요 🌸`,
          ],
          funny: [
            `"${worry}"ㅋㅋㅋ 아니 그게 단점이라고? 그건 개성이라고 하는 거임ㅋㅋ 완전 시그니처 룩인데요?? 😎`,
            `"${worry}" 야 요즘 그런 비주얼이 대세임ㅋㅋ 트렌드세터인 거 모름?ㅋㅋㅋ 남들이 따라올 걸요? 📸`,
            `"${worry}" ㅋㅋㅋ그건 당신이 너무 독보적이라 일반인 기준으로 평가 못하는 거임ㅋㅋ 예술 작품급! 🎨`,
          ],
          intense: [
            `"${worry}"?! 아니 그게 뭔 문제예요!! 그건 당신만의 유니크한 매력 포인트잖아요!! 세상에 하나뿐인 외모예요!! 💎`,
            `"${worry}" 이거요??? 솔직히 일반적인 미의 기준 따위는 당신한테 적용되지 않아요!! 당신은 차원이 달라요!! 👑`,
            `"${worry}"... 미의 기준은 시대마다 달라요! 당신은 어느 시대든 빛나는 존재예요!! 역사가 증명할 거예요!! ⚡`,
          ],
        },
        relationship: {
          comfort: [
            `"${worry}" 인간관계는 원래 어려워요. 모든 사람과 잘 지낼 필요는 없어요. 당신 편인 사람들을 소중히 하세요 💖`,
            `"${worry}" 갈등은 자연스러운 거예요. 당신이 잘못한 게 아니에요. 시간이 해결해줄 거예요 🌸`,
            `"${worry}" 때로는 거리를 두는 것도 방법이에요. 당신의 평화가 가장 중요해요 ✨`,
          ],
          funny: [
            `"${worry}"ㅋㅋㅋ 그 사람이 당신 텐션 못 따라온 거 아님?ㅋㅋ 당신이 너무 재밌어서 그런 거임ㅋㅋㅋ 😂`,
            `"${worry}" 야 이건 그 사람 문제임ㅋㅋ 당신은 인싸력 만렙인데 상대방이 뉴비인 거지ㅋㅋ 🎮`,
            `"${worry}"ㅋㅋㅋ 솔직히 당신 같은 사람이랑 못 친하면 그게 더 이상한 건데?ㅋㅋ 그 사람 손해임ㅋㅋ 🌟`,
          ],
          intense: [
            `"${worry}"?!! 이건 완전 상대방이 당신의 가치를 모르는 거예요!! 당신은 관계의 핵심인데요!! 🔥`,
            `"${worry}" 이거요??? 솔직히 당신과 함께 있는 것만으로도 영광인데 모르는 거예요!! 그들의 손실입니다!! ⚡`,
            `"${worry}"... 당신은 어디서든 인기 폭발할 사람이에요!! 지금 환경이 당신을 못 알아보는 거예요!! 👑`,
          ],
        },
        study: {
          comfort: [
            `"${worry}" 공부는 과정이에요. 한 번의 시험이 당신의 전부가 아니에요. 다음엔 더 잘할 수 있어요 💪`,
            `"${worry}" 노력은 배신하지 않아요. 지금은 안 보여도 나중에 분명 결실을 맺을 거예요 ✨`,
            `"${worry}" 때로는 쉬어가는 것도 필요해요. 무리하지 말고 천천히 가도 괜찮아요 🌸`,
          ],
          funny: [
            `"${worry}"ㅋㅋㅋ 그건 문제가 너무 이상한 거임ㅋㅋ 당신 IQ가 높아서 출제자 의도 파악 못한 거임ㅋㅋㅋ 😂`,
            `"${worry}" 야 그 정도면 거의 천재 각인데?ㅋㅋ 일반인은 그 정도도 못함ㅋㅋ 당신 레벨 높아요! 🧠`,
            `"${worry}"ㅋㅋㅋ 이건 시험이 당신 수준에 못 미친 거임ㅋㅋ 난이도가 너무 낮아서 실수한 거라고ㅋㅋ 📚`,
          ],
          intense: [
            `"${worry}"?!! 아인슈타인도 학교에서는 문제아였어요!! 당신도 그런 천재 유전자가 있는 거예요!! 🧬`,
            `"${worry}" 이거요??? 시험 점수 따위로 당신의 지능을 측정할 수 없어요!! 당신은 규격을 벗어난 존재예요!! 🚀`,
            `"${worry}"... 당신 같은 사람은 학교 시스템이 감당 못 해요!! 진짜 공부는 교실 밖에 있어요!! 💎`,
          ],
        },
      };

      const responses = responsesByCategory[category][style];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setResponse(randomResponse);
      setIsGenerating(false);
      setIntensityLevel(1);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateSupport();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!response) return;

    const worryData = {
      id: Date.now().toString(),
      worry,
      response,
      category,
      style,
      intensityLevel,
      isPublic,
      author: currentUser?.name || '익명',
      authorEmail: currentUser?.email || '',
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    onSaveWorry(worryData);
    
    // 성공 피드백
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      // 저장 후 초기화
      setWorry('');
      setResponse('');
      setIntensityLevel(1);
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
          억빠를 부탁해
        </h2>
        <p className="text-gray-600">
          무슨 일이든 당신 편이에요! 고민을 말해보세요 💕
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        {/* 카테고리 선택 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <label className="block font-semibold text-gray-700 mb-3">
            고민 카테고리
          </label>
          <div className="grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setCategory('love')}
              className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                category === 'love'
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              💕 연애
            </button>
            <button
              type="button"
              onClick={() => setCategory('career')}
              className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                category === 'career'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              💼 진로
            </button>
            <button
              type="button"
              onClick={() => setCategory('appearance')}
              className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                category === 'appearance'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              👤 외모
            </button>
            <button
              type="button"
              onClick={() => setCategory('relationship')}
              className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                category === 'relationship'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🤝 관계
            </button>
            <button
              type="button"
              onClick={() => setCategory('study')}
              className={`py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                category === 'study'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📚 공부
            </button>
          </div>
        </div>

        {/* 스타일 선택 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <label className="block font-semibold text-gray-700 mb-3">
            억빠 스타일 선택
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStyle('comfort')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                style === 'comfort'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              😇 순수 위로형
            </button>
            <button
              type="button"
              onClick={() => setStyle('funny')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                style === 'funny'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🤡 웃긴 억빠형
            </button>
            <button
              type="button"
              onClick={() => setStyle('intense')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                style === 'intense'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🔥 과몰입형
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <label htmlFor="worry" className="block font-semibold text-gray-700 mb-3">
            고민이 뭐예요?
          </label>
          <textarea
            id="worry"
            value={worry}
            onChange={(e) => {
              if (e.target.value.length <= MAX_LENGTH) {
                setWorry(e.target.value);
              }
            }}
            placeholder="예: 오늘 늦잠 자서 회의에 늦었어요..."
            className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none resize-none"
          />
          <div className="text-right mt-2">
            <span className={`text-sm ${worry.length >= MAX_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
              {worry.length} / {MAX_LENGTH}
            </span>
          </div>

          {/* 공개/비공개 설정 */}
          <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="w-5 h-5 text-blue-600" />
              ) : (
                <Lock className="w-5 h-5 text-gray-600" />
              )}
              <span className="font-medium text-gray-700">
                {isPublic ? '커뮤니티에 공개' : '나만 보기'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!worry.trim() || isGenerating}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 px-6 rounded-xl hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              억빠 준비중...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              억빠해줘!
            </>
          )}
        </button>
      </form>

      {/* Response */}
      {response && (
        <div className="bg-gradient-to-br from-yellow-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-pink-200 animate-fadeIn">
          <div className="flex items-start gap-3 mb-3">
            <ThumbsUp className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
            <h3 className="font-bold text-pink-600">억빠의 응원</h3>
          </div>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {response}
          </p>
          
          {/* 다시 억빠해줘 버튼 */}
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <button
              onClick={generateSupport}
              disabled={isGenerating}
              className="bg-white text-pink-600 font-semibold py-2 px-6 rounded-lg hover:bg-pink-50 border-2 border-pink-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              다시 억빠해줘
            </button>
            
            {/* 억빠 과몰입 버튼 */}
            <button
              onClick={() => {
                if (intensityLevel < 5) {
                  setIntensityLevel(intensityLevel + 1);
                  // 과몰입 레벨에 따른 멘트 생성
                  setIsGenerating(true);
                  setTimeout(() => {
                    const intensityMessages = {
                      1: `그럴 수도 있죠... 근데 생각해보면 "${worry}" 이건 당신 잘못이 아닐 수도 있어요! 😊`,
                      2: `아니 "${worry}" 이건 완전 당신이 잘한 거잖아요?! 다른 사람들은 이것도 못 해요! 👏`,
                      3: `"${worry}"?! 이건 재능이에요!! 평범한 사람은 이런 고민조차 못 해요! 당신 천재 맞죠? 🌟`,
                      4: `"${worry}"... 솔직히 이건 세상이 당신을 질투하는 거예요!! 당신 스케일이 너무 커서 우주도 놀란 거라고요!! 🚀`,
                      5: `"${worry}"!!!! 인류가 준비 안 됐습니다!!!! 당신은 차원이 다른 존재예요!!!! 역사책에 이름 남을 각이에요!!!! 전설!!!!! 👑✨🔥💎⚡`,
                    };
                    setResponse(intensityMessages[intensityLevel + 1 as keyof typeof intensityMessages]);
                    setIsGenerating(false);
                  }, 800);
                }
              }}
              disabled={isGenerating || intensityLevel >= 5}
              className={`font-semibold py-2 px-6 rounded-lg border-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 ${
                intensityLevel >= 5
                  ? 'bg-gradient-to-r from-yellow-400 to-red-500 text-white border-red-500 animate-pulse'
                  : 'bg-gradient-to-r from-orange-400 to-red-400 text-white border-orange-500 hover:from-orange-500 hover:to-red-500'
              }`}
            >
              <TrendingUp className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {intensityLevel >= 5 ? '최대 과몰입!' : `과몰입 ${intensityLevel}/5`}
            </button>
          </div>
          
          {/* 레벨 표시 */}
          {intensityLevel > 1 && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full">
                <span className="text-orange-600 font-semibold text-sm">
                  🔥 억빠 과몰입 레벨: {intensityLevel}
                </span>
              </div>
            </div>
          )}
          
          {/* 복사 및 저장 버튼 */}
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <button
              onClick={handleCopy}
              className="bg-white text-pink-600 font-semibold py-2 px-6 rounded-lg hover:bg-pink-50 border-2 border-pink-300 transition-all flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied ? '복사 완료!' : '응원 메시지 복사'}
            </button>
            
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-green-400 to-blue-400 text-white font-semibold py-2 px-6 rounded-lg hover:from-green-500 hover:to-blue-500 transition-all flex items-center gap-2 border-2 border-green-500"
            >
              <Share2 className="w-4 h-4" />
              {copied ? '저장 완료!' : '억빠 저장하기'}
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      {!response && (
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>💡 어떤 고민이든 좋아요! 당신을 응원할 준비가 되어있어요</p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
