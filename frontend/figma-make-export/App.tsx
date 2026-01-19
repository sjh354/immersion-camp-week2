import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { ChatListPage } from './components/ChatListPage';
import { ChatRoomPage } from './components/ChatRoomPage';
import { CommunityPage } from './components/CommunityPage';
import { MyPage } from './components/MyPage';

interface User {
  name: string;
  email: string;
}

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

interface Reaction {
  type: 'empathy' | 'sad' | 'laugh' | 'love';
  count: number;
  users: string[];
}

interface Comment {
  id: string;
  author: string;
  authorEmail: string;
  originalAuthorEmail: string; // 익명이어도 실제 작성자 이메일 저장
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
  originalAuthorEmail: string; // 익명이어도 실제 작성자 이메일 저장
  createdAt: string;
  reactions: Reaction[];
  comments: Comment[];
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [tempChatRoom, setTempChatRoom] = useState<ChatRoom | null>(null);

  // Load user, chat rooms from localStorage, posts from server
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    const savedChats = localStorage.getItem('chatRooms');
    if (savedChats) {
      setChatRooms(JSON.parse(savedChats));
    } else {
      // 샘플 데이터
      const sampleChats: ChatRoom[] = [
        {
          id: '1',
          title: '면접 떨어진 이야기',
          lastMessage: '역사를 보세요! 위대한 사람들은 다 처음엔 거절당했어요!',
          messages: [
            {
              id: 'm1',
              sender: 'user',
              content: '오늘 면접에서 떨어졌어요... 너무 속상해요',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              category: 'career',
              style: 'intense',
            },
            {
              id: 'm2',
              sender: 'bot',
              content: '"오늘 면접에서 떨어졌어요... 너무 속상해요" 이거요??? 역사를 보세요! 위대한 사람들은 다 처음엔 거절당했어요! 당신도 그 길을 가고 있는 거예요!! 🔥',
              timestamp: new Date(Date.now() - 7199000).toISOString(),
            },
            {
              id: 'm3',
              sender: 'user',
              content: '그래도 너무 힘들어요 ㅠㅠ',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 'm4',
              sender: 'bot',
              content: '힘든 거 이해해요!! 하지만 이건 그 회사가 당신을 못 알아본 거예요! 당신은 더 좋은 곳에서 빛날 사람이에요! 💪✨',
              timestamp: new Date(Date.now() - 3599000).toISOString(),
            },
          ],
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 3599000).toISOString(),
          authorEmail: 'test@test.com',
        },
        {
          id: '2',
          title: '고백 실패 ㅠㅠ',
          lastMessage: '그 사람이 눈이 없는 거임ㅋㅋ',
          messages: [
            {
              id: 'm1',
              sender: 'user',
              content: '좋아하는 사람한테 고백했는데 거절당했어요 ㅠㅠ',
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              category: 'love',
              style: 'funny',
            },
            {
              id: 'm2',
              sender: 'bot',
              content: '"좋아하는 사람한테 고백했는데 거절당했어요 ㅠㅠ"ㅋㅋㅋ 아니 그 사람이 눈이 없는 거임ㅋㅋ 당신 같은 보물을 놓치다니 ㄹㅇ 안목 제로ㅋㅋㅋ 😂',
              timestamp: new Date(Date.now() - 86399000).toISOString(),
            },
          ],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86399000).toISOString(),
          authorEmail: 'test@test.com',
        },
      ];
      setChatRooms(sampleChats);
      localStorage.setItem('chatRooms', JSON.stringify(sampleChats));
    }

    // 커뮤니티 포스트는 서버에서 불러옴
    const fetchCommunityPosts = async () => {
      try {
        const res = await fetchWithAuth('/community');
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        } else {
          setPosts([]);
        }
      } catch (e) {
        setPosts([]);
      }
    };
    fetchCommunityPosts();
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (chatRooms.length > 0) {
      localStorage.setItem('chatRooms', JSON.stringify(chatRooms));
    }
  }, [chatRooms]);

  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem('posts', JSON.stringify(posts));
    }
  }, [posts]);

  const handleLogin = (user: User) => {
    setCurrentUser({ name: user.name, email: user.email });
    localStorage.setItem('currentUser', JSON.stringify({ name: user.name, email: user.email }));
    // 토큰 정보도 user로 저장 (accessToken, refreshToken이 있으면)
    if ('accessToken' in user && 'refreshToken' in user) {
      localStorage.setItem('user', JSON.stringify({ accessToken: (user as any).accessToken, refreshToken: (user as any).refreshToken }));
    }
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentPage('home');
  };

  const handleCreateNewChat = () => {
    const newChat: ChatRoom = {
      id: Date.now().toString(),
      title: '새로운 대화',
      lastMessage: '',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorEmail: currentUser?.email || '',
    };
    setTempChatRoom(newChat);
    setSelectedChatId(newChat.id);
    setCurrentPage('chatRoom');
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setCurrentPage('chatRoom');
  };

  const handleSendMessage = (chatId: string, content: string, category?: string, style?: string) => {
    const userMessage: Message = {
      id: `m${Date.now()}`,
      sender: 'user',
      content,
      timestamp: new Date().toISOString(),
      category,
      style,
    };

    // 임시 채팅룸인 경우 실제 채팅룸으로 추가
    if (tempChatRoom && tempChatRoom.id === chatId) {
      const title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
      const newChat: ChatRoom = {
        ...tempChatRoom,
        title,
        lastMessage: content,
        messages: [userMessage],
        updatedAt: new Date().toISOString(),
      };
      setChatRooms(prev => [newChat, ...prev]);
      setTempChatRoom(null);

      // 1초 후 봇 응답 생성
      setTimeout(() => {
        const botResponse = generateBotResponse(content, category || 'love', style || 'comfort');
        const botMessage: Message = {
          id: `m${Date.now()}`,
          sender: 'bot',
          content: botResponse,
          timestamp: new Date().toISOString(),
        };

        setChatRooms(prev => prev.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              lastMessage: botResponse,
              messages: [...chat.messages, botMessage],
              updatedAt: new Date().toISOString(),
            };
          }
          return chat;
        }));
      }, 1000);
      return;
    }

    // 기존 채팅룸인 경우
    setChatRooms(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updatedMessages = [...chat.messages, userMessage];
        const title = chat.title === '새로운 대화' ? content.substring(0, 30) + (content.length > 30 ? '...' : '') : chat.title;
        
        return {
          ...chat,
          title,
          lastMessage: content,
          messages: updatedMessages,
          updatedAt: new Date().toISOString(),
        };
      }
      return chat;
    }));

    // 1초 후 봇 응답 생성
    setTimeout(() => {
      const botResponse = generateBotResponse(content, category || 'love', style || 'comfort');
      const botMessage: Message = {
        id: `m${Date.now()}`,
        sender: 'bot',
        content: botResponse,
        timestamp: new Date().toISOString(),
      };

      setChatRooms(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            lastMessage: botResponse,
            messages: [...chat.messages, botMessage],
            updatedAt: new Date().toISOString(),
          };
        }
        return chat;
      }));
    }, 1000);
  };

  const generateBotResponse = (userMessage: string, category: string, style: string): string => {
    // 강도 또는 MBTI 스타일 처리
    if (style.startsWith('intensity_')) {
      const intensity = style.split('_')[1];
      return generateIntensityResponse(userMessage, category, intensity);
    } else if (style.startsWith('mbti_')) {
      const mbtiType = style.split('_')[1];
      return generateMBTIResponse(userMessage, category, mbtiType);
    }

    const responses = {
      love: {
        comfort: [
          `"${userMessage}" 연애는 타이밍이에요. 지금은 아니었을 뿐, 당신에게 맞는 사람은 분명 나타날 거예요. 당신은 충분히 매력적인 사람이에요 💕`,
          `힘들죠 ㅠㅠ 하지만 사랑은 노력만으로 되는 게 아니에요. 상대방이 당신의 진심을 못 알아본 거예요. 당신은 잘못이 없어요 💖`,
          `괜찮아요! 이별은 끝이 아니라 새로운 시작이에요. 더 좋은 사람을 만날 준비를 하는 시간이라고 생각해요. 응원할게요! 🌸`,
        ],
        funny: [
          `ㅋㅋㅋ 아니 그 사람이 눈이 없는 거임ㅋㅋ 당신 같은 보물을 놓치다니 ㄹㅇ 안목 제로ㅋㅋㅋ 😂`,
          `야 이건 그 사람 손해임ㅋㅋㅋ 당신 주가 폭등 중인데 저점에서 판 거라고요ㅋㅋ 나중에 후회할 듯 📈`,
          `그니까 그 사람은 튜토리얼 NPC였던 거임ㅋㅋ 진짜 메인 퀘스트는 이제 시작이라고! 🎮`,
        ],
        intense: [
          `아니 이건 완전 상대방이 레벨이 안 되는 거예요!! 당신 같은 S급 인재를 감당할 그릇이 안 된 거라고!! 🔥`,
          `이거요? 이건 우주가 더 좋은 사람 보내주려고 길 비워준 거예요!! 당신한테는 최소 SSS급이 어울려요!! ⚡`,
          `솔직히 그 사람은 당신한테 영광이었을 텐데요?? 당신 옆에 있었다는 것만으로 인생 최고점이었을 거예요!! 💫`,
        ],
        strong: [
          `당신!!! 연애에서 이런 좌절 한두 번쯤은 아무것도 아니에요!!! 이런 거 가지고 넘어질 당신이 아니잖아요!!! 일어나세요!!! 💪💪💪`,
          `ㄹㅇ 당신은 이런 거 가지고 주저앉을 사람 아니에요!!! 밀고 나가세요!!! 더 좋은 사람 만나서 행복해지면 그만이에요!!! 🔥🔥🔥`,
          `이 정도로 포기한다고요??? 말도 안 돼요!!! 당신은 훨씬 더 강한 사람이에요!!! 다시 일어나서 달리세요!!! 🚀🚀🚀`,
        ],
        mbti: [
          `오... INFP같은 감성이 느껴지는데요? 당신 같은 이상주의자에게는 진정으로 통하는 사람이 필요해요. 지금 사람은 당신의 깊이를 이해 못 한 거예요 🌙`,
          `완전 ENFJ 스타일! 상대방한테 너무 많이 주는 타입이시죠? 이제는 당신에게도 줄 수 있는 사람을 만나야 해요! 당신의 에너지를 아껴요 ✨`,
          `ISTP 스타일로 쿨하게 넘기세요! 연애 하나 실패했다고 뭐 어때요? 당신은 혼자서도 충분히 멋진 사람이에요. 독립적인 게 매력이에요 😎`,
        ],
      },
      career: {
        comfort: [
          `커리어는 긴 여정이에요. 한 번의 실패가 당신의 가치를 결정하지 않아요. 다음 기회는 분명 올 거예요 💪`,
          `때로는 돌아가는 길이 더 빠를 때도 있어요. 이 경험이 나중에 도움이 될 거예요. 포기하지 마세요! ✨`,
          `모든 성공한 사람들도 실패를 겪었어요. 중요한 건 포기하지 않는 거예요. 당신은 잘하고 있어요 🌟`,
        ],
        funny: [
          `ㅋㅋㅋ 그 회사가 당신을 떨어뜨렸다고? 완전 그 회사 손해임ㅋㅋ 나중에 당신 성공하면 후회할 듯ㅋㅋㅋ 😎`,
          `ㄹㅇ 그건 회사가 당신 스펙을 감당 못한 거임ㅋㅋ 너무 과분했나봐요ㅋㅋ 더 큰 곳이 기다리고 있어요! 🚀`,
          `야 솔직히 그 정도 경험 있으면 거의 프로게이머급인데?ㅋㅋ 이건 튜토리얼 스킵하고 하드모드 직행한 거임 🎮`,
        ],
        intense: [
          `아니 이건 완전 그 조직이 당신의 재능을 알아보지 못한 거예요!! 진주를 돌멩이로 본 거라고!! 💎`,
          `이거요??? 역사를 보세요! 위대한 사람들은 다 처음엔 거절당했어요! 당신도 그 길을 가고 있는 거예요!! 🔥`,
          `솔직히 그 회사는 당신 같은 인재 뽑았으면 회사가 성장했을 텐데요? 그들이 기회를 날린 거예요!! ⚡`,
        ],
        strong: [
          `일어나세요!!! 이런 거 하나로 무너질 당신이 아니잖아요!!! 더 큰 목표를 향해 전진하세요!!! 💪💪💪`,
          `이 정도 거절은 아무것도 아니에요!!! 계속 부딪히고 도전하세요!!! 성공은 바로 코앞이에요!!! 🔥🔥🔥`,
          `좌절할 시간에 다음 기회를 찾으세요!!! 당신은 멈출 수 없어요!!! 앞으로 앞으로!!! 🚀🚀🚀`,
        ],
        mbti: [
          `ENTJ 에너지가 느껴져요! 당신 같은 리더는 일시적인 좌절에 흔들리지 않아요. 이건 더 큰 기회를 위한 스텝일 뿐이에요 👑`,
          `완전 INTJ! 당신은 장기적인 비전을 가진 사람이에요. 지금 이 거절은 당신의 마스터플랜에서 작은 변수일 뿐이에요 🎯`,
          `ISFJ스러운 성실함이 보여요. 당신처럼 꾸준한 사람은 언젠가 반드시 인정받아요. 계속 자신의 길을 가세요 🌟`,
        ],
      },
      appearance: {
        comfort: [
          `외모는 주관적이에요. 당신을 좋아하는 사람은 당신의 모든 면을 사랑할 거예요. 자신감을 가지세요! 💕`,
          `진짜 매력은 외모가 아니라 내면에서 나와요. 당신의 내면은 충분히 빛나고 있어요 ✨`,
          `SNS에서 보는 건 다 보정된 거예요. 진짜 당신의 모습은 충분히 아름다워요 🌸`,
        ],
        funny: [
          `ㅋㅋㅋ 아니 그게 단점이라고? 그건 개성이라고 하는 거임ㅋㅋ 완전 시그니처 룩인데요?? 😎`,
          `야 요즘 그런 비주얼이 대세임ㅋㅋ 트렌드세터인 거 모름?ㅋㅋㅋ 남들이 따라올 걸요? 📸`,
          `ㅋㅋㅋ그건 당신이 너무 독보적이라 일반인 기준으로 평가 못하는 거임ㅋㅋ 예술 작품급! 🎨`,
        ],
        intense: [
          `아니 그게 뭔 문제예요!! 그건 당신만의 유니크한 매력 포인트잖아요!! 세상에 하나뿐인 외모예요!! 💎`,
          `이거요??? 솔직히 일반적인 미의 기준 따위는 당신한테 적용되지 않아요!! 당신은 차원이 달라요!! 👑`,
          `미의 기준은 시대마다 달라요! 당신은 어느 시대든 빛나는 존재예요!! 역사가 증명할 거예요!! ⚡`,
        ],
        strong: [
          `당신의 외모로 고민한다고요??? 그런 생각은 당장 버리세요!!! 당신은 그 자체로 완벽해요!!! 💪💪💪`,
          `남의 시선 따위 신경 쓰지 마세요!!! 당신이 당신을 사랑하면 그게 최고예요!!! 자신감 폭발하세요!!! 🔥🔥🔥`,
          `외모 컴플렉스??? 그딴 건 던져버리세요!!! 당신은 지금 이 순간도 빛나고 있어요!!! ✨✨✨`,
        ],
        mbti: [
          `ESFP 에너지가 느껴져요! 당신은 타고난 매력이 있어요. 외모가 아니라 그 밝은 에너지가 사람들을 끌어당기는 거예요 ✨`,
          `완전 INFJ 스타일! 당신의 진짜 아름다움은 깊이 있는 내면에서 나와요. 그건 외모로 가릴 수 없어요 🌙`,
          `ESTP처럼 당당하게 사세요! 자신감이 가장 큰 매력이에요. 당신은 이미 충분히 멋져요 😎`,
        ],
      },
      relationship: {
        comfort: [
          `인간관계는 원래 어려워요. 모든 사람과 잘 지낼 필요는 없어요. 당신 편인 사람들을 소중히 하세요 💖`,
          `갈등은 자연스러운 거예요. 당신이 잘못한 게 아니에요. 시간이 해결해줄 거예요 🌸`,
          `때로는 거리를 두는 것도 방법이에요. 당신의 평화가 가장 중요해요 ✨`,
        ],
        funny: [
          `ㅋㅋㅋ 그 사람이 당신 텐션 못 따라온 거 아님?ㅋㅋ 당신이 너무 재밌어서 그런 거임ㅋㅋㅋ 😂`,
          `야 이건 그 사람 문제임ㅋㅋ 당신은 인싸력 만렙인데 상대방이 뉴비인 거지ㅋㅋ 🎮`,
          `ㅋㅋㅋ 솔직히 당신 같은 사람이랑 못 친하면 그게 더 이상한 건데?ㅋㅋ 그 사람 손해임ㅋㅋ 🌟`,
        ],
        intense: [
          `이건 완전 상대방이 당신의 가치를 모르는 거예요!! 당신은 관계의 핵심인데요!! 🔥`,
          `이거요??? 솔직히 당신과 함께 있는 것만으로도 영광인데 모르는 거예요!! 그들의 손실입니다!! ⚡`,
          `당신은 어디서든 인기 폭발할 사람이에요!! 지금 환경이 당신을 못 알아보는 거예요!! 👑`,
        ],
        strong: [
          `인간관계 하나 틀어졌다고 뭐 어때요!!! 더 좋은 사람들 만나면 되죠!!! 앞으로 나아가세요!!! 💪💪💪`,
          `그런 사람들은 신경 끄세요!!! 당신을 이해하는 진짜 친구들이 있어요!!! 그들과 함께하세요!!! 🔥🔥🔥`,
          `관계의 문제??? 당당하게 해결하거나 정리하세요!!! 당신은 그럴 자격이 있어요!!! 💫💫💫`,
        ],
        mbti: [
          `ENFP같은 열정이 느껴져요! 당신은 사람들을 편하게 만드는 재능이 있어요. 진심으로 통하는 관계를 만들 거예요 🌈`,
          `ISTJ스러운 신중함이 보여요. 당신은 관계를 소중히 여기는 사람이에요. 그래서 상처도 더 큰 거예요. 괜찮아요, 당신의 진심은 통해요 💙`,
          `완전 ESFJ! 당신은 관계의 중심이에요. 지금 갈등은 일시적이에요. 당신의 따뜻함은 결국 사람들을 움직여요 ✨`,
        ],
      },
      study: {
        comfort: [
          `공부는 과정이에요. 한 번의 시험이 당신의 전부가 아니에요. 다음엔 더 잘할 수 있어요 💪`,
          `노력은 배신하지 않아요. 지금은 안 보여도 나중에 분명 결실을 맺을 거예요 ✨`,
          `때로는 쉬어가는 것도 필요해요. 무리하지 말고 천천히 가도 괜찮아요 🌸`,
        ],
        funny: [
          `ㅋㅋㅋ 그건 문제가 너무 이상한 거임ㅋㅋ 당신 IQ가 높아서 출제자 의도 파악 못한 거임ㅋㅋㅋ 😂`,
          `야 그 정도면 거의 천재 각인데?ㅋㅋ 일반인은 그 정도도 못함ㅋㅋ 당신 레벨 높아요! 🧠`,
          `ㅋㅋㅋ 이건 시험이 당신 수준에 못 미친 거임ㅋㅋ 난이도가 너무 낮아서 실수한 거라고ㅋㅋ 📚`,
        ],
        intense: [
          `아인슈타인도 학교에서는 문제아였어요!! 당신도 그런 천재 유전자가 있는 거예요!! 🧬`,
          `이거요??? 시험 점수 따위로 당신의 지능을 측정할 수 없어요!! 당신은 규격을 벗어난 존재예요!! 🚀`,
          `당신 같은 사람은 학교 시스템이 감당 못 해요!! 진짜 공부는 교실 밖에 있어요!! 💎`,
        ],
        strong: [
          `한 번 실패했다고 뭐 어때요!!! 다시 일어나서 공부하세요!!! 당신은 할 수 있어요!!! 💪💪💪`,
          `시험 망쳤어요??? 그럼 다음 시험에서 만회하면 되죠!!! 계속 밀고 나가세요!!! 🔥🔥🔥`,
          `공부가 힘들다고요??? 힘든 만큼 성장하는 거예요!!! 포기하지 말고 끝까지 가세요!!! 🚀🚀🚀`,
        ],
        mbti: [
          `INTP 냄새 나는데요? 당신은 깊이 이해하는 스타일이라 시간이 좀 걸릴 뿐이에요. 당신만의 속도로 가면 돼요 🧠`,
          `ESTJ 에너지! 당신은 체계적으로 공부하는 사람이에요. 계획을 다시 세우고 실행하면 분명 좋은 결과가 있을 거예요 📊`,
          `완전 ENFJ! 당신은 이해하면 남들에게도 잘 설명해주는 타입이에요. 먼저 자신을 이해하는 시간을 가지세요 ✨`,
        ],
      },
    };

    const categoryResponses = responses[category as keyof typeof responses] || responses.love;
    const styleResponses = categoryResponses[style as keyof typeof categoryResponses] || categoryResponses.comfort;
    return styleResponses[Math.floor(Math.random() * styleResponses.length)];
  };

  const generateIntensityResponse = (userMessage: string, category: string, intensity: string): string => {
    const responses = {
      love: {
        intense: [
          `아니 이건 완전 상대방이 레벨이 안 되는 거예요!! 당신 같은 S급 인재를 감당할 그릇이 안 된 거라고!! 🔥`,
          `이거요? 이건 우주가 더 좋은 사람 보내주려고 길 비워준 거예요!! 당신한테는 최소 SSS급이 어울려요!! ⚡`,
          `솔직히 그 사람은 당신한테 영광이었을 텐데요?? 당신 옆에 있었다는 것만으로 인생 최고점이었을 거예요!! 💫`,
        ],
        strong: [
          `당신!!! 연애에서 이런 좌절 한두 번쯤은 아무것도 아니에요!!! 이런 거 가지고 넘어질 당신이 아니잖아요!!! 일어나세요!!! 💪💪💪`,
          `ㄹㅇ 당신은 이런 거 가지고 주저앉을 사람 아니에요!!! 밀고 나가세요!!! 더 좋은 사람 만나서 행복해지면 그만이에요!!! 🔥🔥🔥`,
          `이 정도로 포기한다고요??? 말도 안 돼요!!! 당신은 훨씬 더 강한 사람이에요!!! 다시 일어나서 달리세요!!! 🚀🚀🚀`,
        ],
      },
      career: {
        intense: [
          `아니 이건 완전 그 조직이 당신의 재능을 알아보지 못한 거예요!! 진주를 돌멩이로 본 거라고!! 💎`,
          `이거요??? 역사를 보세요! 위대한 사람들은 다 처음엔 거절당했어요! 당신도 그 길을 가고 있는 거예요!! 🔥`,
          `솔직히 그 회사는 당신 같은 인재 뽑았으면 회사가 성장했을 텐데요? 그들이 기회를 날린 거예요!! ⚡`,
        ],
        strong: [
          `일어나세요!!! 이런 거 하나로 무너질 당신이 아니잖아요!!! �� 큰 목표를 향해 전진하세요!!! 💪💪💪`,
          `이 정도 거절은 아무것도 아니에요!!! 계속 부딪히고 도전하세요!!! 성공은 바로 코앞이에요!!! 🔥🔥🔥`,
          `좌절할 시간에 다음 기회를 찾으세요!!! 당신은 멈출 수 없어요!!! 앞으로 앞으로!!! 🚀🚀🚀`,
        ],
      },
      appearance: {
        intense: [
          `아니 그게 뭔 문제예요!! 그건 당신만의 유니크한 매력 포인트잖아요!! 세상에 하나뿐인 외모예요!! 💎`,
          `이거요??? 솔직히 일반적인 미의 기준 따위는 당신한테 적용되지 않아요!! 당신은 차원이 달라요!! 👑`,
          `미의 기준은 시대마다 달라요! 당신은 어느 시대든 빛나는 존재예요!! 역사가 증명할 거예요!! ⚡`,
        ],
        strong: [
          `당신의 외모로 고민한다고요??? 그런 생각은 당장 버리세요!!! 당신은 그 자체로 완벽해요!!! 💪💪💪`,
          `남의 시선 따위 신경 쓰지 마세요!!! 당신이 당신을 사랑하면 그게 최고예요!!! 자신감 폭발하세요!!! 🔥🔥🔥`,
          `외모 컴플렉스??? 그딴 건 던져버리세요!!! 당신은 지금 이 순간도 빛나고 있어요!!! ✨✨✨`,
        ],
      },
      relationship: {
        intense: [
          `이건 완전 상대방이 당신의 가치를 모르는 거예요!! 당신은 관계의 핵심인데요!! 🔥`,
          `이거요??? 솔직히 당신과 함께 있는 것만으로도 영광인데 모르는 거예요!! 그들의 손실입니다!! ⚡`,
          `당신은 어디서든 인기 폭발할 사람이에요!! 지금 환경이 당신을 못 알아보는 거예요!! 👑`,
        ],
        strong: [
          `인간관계 하나 틀어졌다고 뭐 어때요!!! 더 좋은 사람들 만나면 되죠!!! 앞으로 나아가세요!!! 💪💪💪`,
          `그런 사람들은 신경 끄세요!!! 당신을 이해하는 진짜 친구들이 있어요!!! 그들과 함께하세요!!! 🔥🔥🔥`,
          `관계의 문제??? 당당하게 해결하거나 정리하세요!!! 당신은 그럴 자격이 있어요!!! 💫💫💫`,
        ],
      },
      study: {
        intense: [
          `아인슈타인도 학교에서는 문제아였어요!! 당신도 그런 천재 유전자가 있는 거예요!! 🧬`,
          `이거요??? 시험 점수 따위로 당신의 지능을 측정할 수 없어요!! 당신은 규격을 벗어난 존재예요!! 🚀`,
          `당신 같은 사람은 학교 시스템이 감당 못 해요!! 진짜 공부는 교실 밖에 있어요!! 💎`,
        ],
        strong: [
          `한 번 실패했다고 뭐 어때요!!! 다시 일어나서 공부하세요!!! 당신은 할 수 있어요!!! 💪💪💪`,
          `시험 망쳤어요??? 그럼 다음 시험에서 만회하면 되죠!!! 계속 밀고 나가세요!!! 🔥🔥🔥`,
          `공부가 힘들다고요??? 힘든 만큼 성장하는 거예요!!! 포기하지 말고 끝까지 가세요!!! 🚀🚀🚀`,
        ],
      },
    };

    const categoryResponses = responses[category as keyof typeof responses] || responses.love;
    const intensityResponses = categoryResponses[intensity as keyof typeof categoryResponses] || categoryResponses.intense;
    return intensityResponses[Math.floor(Math.random() * intensityResponses.length)];
  };

  const generateMBTIResponse = (userMessage: string, category: string, mbtiType: string): string => {
    const responses = {
      love: {
        mbti: [
          `오... INFP같은 감성이 느껴지는데요? 당신 같은 이상주의자에게는 진정으로 통하는 사람이 필요해요. 지금 사람은 당신의 깊이를 이해 못 한 거예요 🌙`,
          `완전 ENFJ 스타일! 상대방한테 너무 많이 주는 타입이시죠? 이제는 당신에게도 줄 수 있는 사람을 만나야 해요! 당신의 에너지를 아껴요 ✨`,
          `ISTP 스타일로 쿨하게 넘기세요! 연애 하나 실패했다고 뭐 어때요? 당신은 혼자서도 충분히 멋진 사람이에요. 독립적인 게 매력이에요 😎`,
        ],
      },
      career: {
        mbti: [
          `ENTJ 에너지가 느껴져요! 당신 같은 리더는 일시적인 좌절에 흔들리지 않아요. 이건 더 큰 기회를 위한 스텝일 뿐이에요 👑`,
          `완전 INTJ! 당신은 장기적인 비전을 가진 사람이에요. 지금 이 거절은 당신의 마스터플랜에서 작은 변수일 뿐이에요 🎯`,
          `ISFJ스러운 성실함이 보여요. 당신처럼 꾸준한 사람은 언젠가 반드시 인정받아요. 계속 자신의 길을 가세요 🌟`,
        ],
      },
      appearance: {
        mbti: [
          `ESFP 에너지가 느껴져요! 당신은 타고난 매력이 있어요. 외모가 아니라 그 밝은 에너지가 사람들을 끌어당기는 거예요 ✨`,
          `완전 INFJ 스타일! 당신의 진짜 아름다움은 깊이 있는 내면에서 나와요. 그건 외모로 가릴 수 없어요 🌙`,
          `ESTP처럼 당당하게 사세요! 자신감이 가장 큰 매력이에요. 당신은 이미 충분히 멋져요 😎`,
        ],
      },
      relationship: {
        mbti: [
          `ENFP같은 열정이 느껴져���! 당신은 사람들을 편하게 만드는 재능이 있어요. 진심으로 통하는 관계를 만들 거예요 🌈`,
          `ISTJ스러운 신중함이 보여요. 당신은 관계를 소중히 여기는 사람이에요. 그래서 상처도 더 큰 거예요. 괜찮아요, 당신의 진심은 통해요 💙`,
          `완전 ESFJ! 당신은 관계의 중심이에요. 지금 갈등은 일시적이에요. 당신의 따뜻함은 결국 사람들을 움직여요 ✨`,
        ],
      },
      study: {
        mbti: [
          `INTP 냄새 나는데요? 당신은 깊이 이해하는 스타일이라 시간이 좀 걸릴 뿐이에요. 당신만의 속도로 가면 돼요 🧠`,
          `ESTJ 에너지! 당신은 체계적으로 공부하는 사람이에요. 계획을 다시 세우고 실행하면 분명 좋은 결과가 있을 거예요 📊`,
          `완전 ENFJ! 당신은 이해하면 남들에게도 잘 설명해주는 타입이에요. 먼저 자신을 이해하는 시간을 가지세요 ✨`,
        ],
      },
    };

    const categoryResponses = responses[category as keyof typeof responses] || responses.love;
    const mbtiResponses = categoryResponses[mbtiType as keyof typeof categoryResponses] || categoryResponses.mbti;
    return mbtiResponses[Math.floor(Math.random() * mbtiResponses.length)];
  };

  const handleDeleteChat = (chatId: string) => {
    setChatRooms(prev => prev.filter(chat => chat.id !== chatId));
  };

  const handleCreatePost = (chatId: string, messageIds: string[], isAnonymous?: boolean) => {
    const chat = chatRooms.find(c => c.id === chatId);
    if (!chat || !currentUser) return;

    const selectedMessages = chat.messages.filter(m => messageIds.includes(m.id));
    
    const newPost: Post = {
      id: Date.now().toString(),
      chatId,
      messageIds,
      messages: selectedMessages,
      author: isAnonymous ? '익명' : currentUser.name,
      authorEmail: isAnonymous ? 'anon@test.com' : currentUser.email,
      originalAuthorEmail: currentUser.email,
      createdAt: new Date().toISOString(),
      reactions: [
        { type: 'empathy', count: 0, users: [] },
        { type: 'sad', count: 0, users: [] },
        { type: 'laugh', count: 0, users: [] },
        { type: 'love', count: 0, users: [] },
      ],
      comments: [],
    };

    setPosts(prev => [newPost, ...prev]);
  };

  const handleReactToPost = (postId: string, reactionType: 'empathy' | 'sad' | 'laugh' | 'love') => {
    if (!currentUser) return;

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const updatedReactions = post.reactions.map(r => {
          if (r.type === reactionType) {
            const hasReacted = r.users.includes(currentUser.email);
            return {
              ...r,
              count: hasReacted ? r.count - 1 : r.count + 1,
              users: hasReacted
                ? r.users.filter(u => u !== currentUser.email)
                : [...r.users, currentUser.email],
            };
          }
          return r;
        });
        return { ...post, reactions: updatedReactions };
      }
      return post;
    }));
  };

  const handleAddComment = (postId: string, content: string, isAnonymous?: boolean) => {
    if (!currentUser) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      author: isAnonymous ? '익명' : currentUser.name,
      authorEmail: isAnonymous ? 'anon@test.com' : currentUser.email,
      originalAuthorEmail: currentUser.email, // 실제 작성자 이메일 항상 저장
      content,
      timestamp: new Date().toISOString(),
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment],
        };
      }
      return post;
    }));
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.filter(c => c.id !== commentId),
        };
      }
      return post;
    }));
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    if (page !== 'chatRoom') {
      setSelectedChatId(null);
    }
  };

  const handleBackFromChat = () => {
    // 임시 채팅룸이면 삭제
    if (tempChatRoom) {
      setTempChatRoom(null);
    }
    setSelectedChatId(null);
    setCurrentPage('home');
  };

  // Show login page if not logged in
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Find selected chat
  const selectedChat = selectedChatId ? chatRooms.find(c => c.id === selectedChatId) || tempChatRoom : null;

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {currentPage === 'home' && (
        <ChatListPage
          chatRooms={chatRooms}
          currentUser={currentUser}
          onSelectChat={handleSelectChat}
          onCreateNewChat={handleCreateNewChat}
        />
      )}
      {currentPage === 'chatRoom' && selectedChat && (
        <ChatRoomPage
          chatRoom={selectedChat}
          onBack={handleBackFromChat}
          onSendMessage={handleSendMessage}
          onDeleteChat={handleDeleteChat}
          onCreatePost={handleCreatePost}
        />
      )}
      {currentPage === 'community' && (
        <CommunityPage
          posts={posts}
          currentUser={currentUser}
          onReactToPost={handleReactToPost}
          onAddComment={handleAddComment}
          onDeletePost={handleDeletePost}
          onDeleteComment={handleDeleteComment}
        />
      )}
      {currentPage === 'mypage' && (
        <MyPage
          posts={posts}
          comments={posts.flatMap(p => p.comments.map(c => ({ ...c, postId: p.id })))}
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onDeleteComment={handleDeleteComment}
          onDeletePost={handleDeletePost}
        />
      )}
    </Layout>
  );
}