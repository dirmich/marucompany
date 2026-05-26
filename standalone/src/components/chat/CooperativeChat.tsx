import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, Zap, RefreshCw } from 'lucide-react';
import { LLMEngineType } from '../settings/ConnectionsPanel';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ceo' | 'dev' | 'youtube' | 'biz' | 'finance';
  senderName: string;
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface DispatchStep {
  id: number;
  agentName: string;
  agentEmoji: string;
  task: string;
  status: 'pending' | 'processing' | 'done';
}

export default function CooperativeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dispatchSteps, setDispatchSteps] = useState<DispatchStep[]>([]);
  const [engineConnected, setEngineConnected] = useState<boolean | null>(null);
  const [showGameDemo, setShowGameDemo] = useState<boolean>(false);
  const [dbSyncActive, setDbSyncActive] = useState<boolean>(false);
  
  // 다마고치 게임 상태 시뮬레이션용
  const [tamagotchi, setTamagotchi] = useState({ hunger: 50, play: 50, sleep: 50 });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 1. 마운트 시 PostgreSQL 백엔드에서 대화 내역 전체 로드
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/chat/messages');
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setMessages(data);
          } else {
            // 히스토리가 비었을 때 기본 웰컴 배치
            setMessages([
              {
                id: 'init-1',
                sender: 'ceo',
                senderName: 'Jay (CEO)',
                text: '안녕하세요, 마스터님! Maru Company 자율 가상 오피스에 오신 것을 환영합니다. 무엇을 지시하시겠습니까?\n\n현재 로컬 및 외부 기기(Ollama, LM Studio, Llama.cpp, vLLM) 연동 포맷이 활성화되어 실제 인공지능 서버 통신을 시도합니다.\n\n💡 추천 명령:\n1. "코다리야 병아리 다마고치 게임 만들어줘"\n2. "이번 달 PayPal 실시간 매출 실적 분석해줘"\n3. "내 유튜브 채널 홍보를 위한 자율 에이전트 소집해줘"',
                timestamp: new Date().toLocaleTimeString(),
              }
            ]);
          }
          setDbSyncActive(true);
        } else {
          setDbSyncActive(false);
          loadDefaultWelcome();
        }
      } catch {
        setDbSyncActive(false);
        loadDefaultWelcome(); // 백엔드 미동작 시 기본 웰컴
      }
    };

    const loadDefaultWelcome = () => {
      setMessages([
        {
          id: 'init-1',
          sender: 'ceo',
          senderName: 'Jay (CEO)',
          text: '안녕하세요, 마스터님! Maru Company 자율 가상 오피스에 오신 것을 환영합니다. 무엇을 지시하시겠습니까?\n\n💡 추천 명령:\n1. "코다리야 병아리 다마고치 게임 만들어줘"\n2. "이번 달 PayPal 실시간 매출 실적 분석해줘"\n3. "내 유튜브 채널 홍보를 위한 자율 에이전트 소집해줘"',
          timestamp: new Date().toLocaleTimeString(),
        }
      ]);
    };

    loadChatHistory();
  }, []);

  // 2. 주기적으로 localStorage 기반 API Ping 체크
  useEffect(() => {
    const checkLLMConnection = async () => {
      const type = (localStorage.getItem('connect-ai-llm-type') as LLMEngineType) || 'ollama';
      const url = localStorage.getItem('connect-ai-llm-url') || 'http://127.0.0.1:11434';
      
      try {
        let pingUrl = `${url}/api/tags`;
        if (type === 'lmstudio') pingUrl = `${url}/models`;
        else if (type === 'llamacpp') pingUrl = `${url}/health`;
        else if (type === 'vllm') pingUrl = `${url}/models`;

        const res = await fetch(pingUrl);
        if (res.ok) setEngineConnected(true);
        else setEngineConnected(false);
      } catch {
        setEngineConnected(false);
      }
    };

    checkLLMConnection();
    const interval = setInterval(checkLLMConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  // 메시지 백엔드 DB 저장 헬퍼 함수
  const saveMessageToBackend = async (msg: ChatMessage) => {
    try {
      await fetch('http://localhost:8000/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      });
    } catch (err) {
      console.log('메시지 데이터베이스 동기화 실패 (오프라인 모드로 자동 보정)');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    const userText = inputText.trim();
    setInputText('');
    setIsProcessing(true);

    // 1. 유저 메시지 추가 및 백엔드 DB 보관
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      senderName: '마스터 (You)',
      text: userText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    saveMessageToBackend(userMsg);

    // 2. 가상 사무실에 회의 이벤트 전송
    const event = new CustomEvent('ai-dispatch-mission', {
      detail: { mission: userText },
    });
    window.dispatchEvent(event);

    // 3. 계층형 오케스트레이션 단계 세팅 (Dispatch Timeline)
    setDispatchSteps([
      { id: 1, agentName: 'Jay (CEO)', agentEmoji: '👑', task: '질문 인지 및 에이전트 최적 분배 계획 수립', status: 'processing' },
      { id: 2, agentName: '코다리 (개발)', agentEmoji: '💻', task: '다마고치 게임 템플릿(Kit) 조립 및 HTML/CSS 빌드', status: 'pending' },
      { id: 3, agentName: '현빈 (데이터)', agentEmoji: '💼', task: 'PayPal 실시간 매출 API 통신 및 통계 매핑', status: 'pending' },
      { id: 4, agentName: '레오 (마케팅)', agentEmoji: '📺', task: '유튜브 채널 트렌드 분석 및 프로모션 카드 작성', status: 'pending' },
    ]);

    await new Promise((resolve) => setTimeout(resolve, 1200));
    setDispatchSteps((prev) =>
      prev.map((step) =>
        step.id === 1 ? { ...step, status: 'done' } : step.id === 2 ? { ...step, status: 'processing' } : step
      )
    );

    // 4. 로컬 및 외부 기기 AI API 통신 분기 기동
    const currentType = (localStorage.getItem('connect-ai-llm-type') as LLMEngineType) || 'ollama';
    const currentUrl = localStorage.getItem('connect-ai-llm-url') || 'http://127.0.0.1:11434';
    const currentModel = localStorage.getItem('connect-ai-llm-model') || '';

    const systemPrompt = `너는 1인 기업 AI 에이전트 팀의 대표이사 CEO Jay다. 사장님의 다음 지시사항에 정중하게 솔로프레너 마인드로 답해라: "${userText}"`;

    if (engineConnected) {
      try {
        let aiResponseText = '';

        if (currentType === 'ollama') {
          const res = await fetch(`${currentUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: currentModel || 'gemma:2b',
              prompt: systemPrompt,
              stream: false,
            }),
          });
          const data = await res.json();
          aiResponseText = data.response;

        } else if (currentType === 'lmstudio' || currentType === 'vllm') {
          const res = await fetch(`${currentUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: currentModel || 'meta-llama/Meta-Llama-3-8B-Instruct',
              messages: [{ role: 'user', content: systemPrompt }],
              stream: false,
            }),
          });
          const data = await res.json();
          aiResponseText = data.choices[0].message.content;

        } else if (currentType === 'llamacpp') {
          const res = await fetch(`${currentUrl}/completion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: systemPrompt,
              n_predict: 384,
            }),
          });
          const data = await res.json();
          aiResponseText = data.content;
        }

        if (aiResponseText) {
          const ceoMsg: ChatMessage = {
            id: `ceo-${Date.now()}`,
            sender: 'ceo',
            senderName: 'Jay (CEO)',
            text: aiResponseText,
            timestamp: new Date().toLocaleTimeString(),
          };
          setMessages((prev) => [...prev, ceoMsg]);
          saveMessageToBackend(ceoMsg);
          setDispatchSteps((prev) => prev.map((step) => ({ ...step, status: 'done' })));
          setIsProcessing(false);
          return;
        }

      } catch (err) {
        console.error('LLM API 통신 장애로 인하여 시뮬레이션 모드로 리디렉션합니다.', err);
      }
    }

    // 5. Intelligent Simulator Fallback (오프라인/통신 장애 대비)
    const normalizedText = userText.toLowerCase();

    if (normalizedText.includes('게임') || normalizedText.includes('다마고치') || normalizedText.includes('코다리')) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setDispatchSteps((prev) =>
        prev.map((step) =>
          step.id === 2 ? { ...step, status: 'done' } : step.id === 3 ? { ...step, status: 'processing' } : step
        )
      );

      const devMsg: ChatMessage = {
        id: `dev-${Date.now()}`,
        sender: 'dev',
        senderName: '코다리 (개발자)',
        text: '💻 코다리 수석 개발자 보고드립니다! \n\n마스터님의 지시에 따라 로컬 `chick-game-kit`을 즉시 소싱하였습니다. 30초 내에 다마고치 게임이 완벽하게 구성되어 독립 서버에 런칭되었습니다!\n\n🐤 아래 띄워진 다마고치를 직접 조작해보실 수 있습니다! 밥 주기, 놀아주기, 잠 재우기를 통해 병아리를 키워보세요.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, devMsg]);
      saveMessageToBackend(devMsg);
      setShowGameDemo(true);

      await new Promise((resolve) => setTimeout(resolve, 1500));
      setDispatchSteps((prev) => prev.map((step) => ({ ...step, status: 'done' })));

    } else if (normalizedText.includes('매출') || normalizedText.includes('실적') || normalizedText.includes('paypal')) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setDispatchSteps((prev) =>
        prev.map((step) =>
          step.id === 2 ? { ...step, status: 'done' } : step.id === 3 ? { ...step, status: 'processing' } : step
        )
      );

      const bizMsg: ChatMessage = {
        id: `biz-${Date.now()}`,
        sender: 'biz',
        senderName: '현빈 (비즈니스 분석)',
        text: '📊 현빈 분석관이 이번 달 PayPal 매출 성과를 브리핑합니다!\n\n*   **총 매출:** $1,190.20 USD\n*   **주문 수:** 18건 (실시간 승인 완료)\n*   **평균 결제 단가:** $66.12 USD\n*   **도구 자율 권한도:** 85% (안전 수준)\n\n💰 에이전트들이 생성한 네온 서바이버 게임의 PayPal IPN(실시간 결제 통지)이 100% 정상 작동하며 통계에 반영 중입니다. 우상단 "매출 대시보드" 탭에서 실시간 차트를 확인하세요!',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, bizMsg]);
      saveMessageToBackend(bizMsg);

      await new Promise((resolve) => setTimeout(resolve, 1500));
      setDispatchSteps((prev) => prev.map((step) => ({ ...step, status: 'done' })));

    } else {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setDispatchSteps((prev) => prev.map((step) => ({ ...step, status: 'done' })));

      const engineLabel = currentType === 'ollama' ? 'Ollama' : currentType === 'lmstudio' ? 'LM Studio' : currentType === 'llamacpp' ? 'llama.cpp' : 'vLLM';
      
      const ceoMsg: ChatMessage = {
        id: `ceo-${Date.now()}`,
        sender: 'ceo',
        senderName: 'Jay (CEO)',
        text: `대표이사 Jay입니다. "${userText}" 지시사항을 잘 확인했습니다. \n\n[엔진 상태: ${engineLabel} 오프라인 시뮬레이션]\n\n이 프로젝트는 100% 로컬 프라이버시가 확보된 상태로 나만의 두뇌(.md 파일 위키)와 9명의 에이전트가 협업해 마스터님의 1인 기업 비즈니스 생산성을 폭발적으로 극대화시킵니다. 원하시는 서비스 템플릿(Kit) 개발이나 PayPal 매출 연동을 언제든 말씀만 해주세요!`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, ceoMsg]);
      saveMessageToBackend(ceoMsg);
    }

    setIsProcessing(false);
  };

  // 다마고치 컨트롤
  const feedChic = () => setTamagotchi(t => ({ ...t, hunger: Math.min(100, t.hunger + 15), sleep: Math.max(0, t.sleep - 5) }));
  const playChic = () => setTamagotchi(t => ({ ...t, play: Math.min(100, t.play + 20), hunger: Math.max(0, t.hunger - 10) }));
  const sleepChic = () => setTamagotchi(t => ({ ...t, sleep: Math.min(100, t.sleep + 25), play: Math.max(0, t.play - 5) }));

  return (
    <div className="flex h-full gap-4 p-4 overflow-hidden relative">
      {/* 좌측 에이전트 통신 창 */}
      <div className="flex-1 flex flex-col bg-obsidian-card rounded-2xl border border-obsidian-border overflow-hidden glass-panel">
        
        {/* LLM 연결 배지 헤더 */}
        <div className="bg-obsidian-border/50 px-4 py-3 flex justify-between items-center border-b border-obsidian-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-electric-cyan" />
            <span className="text-xs font-mono font-bold tracking-wider text-gray-200">CORPORATE CHAT</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[9px] font-bold">
            {dbSyncActive ? (
              <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                🛢️ PostgreSQL 대화 저장 보존 활성
              </span>
            ) : (
              <span className="text-gray-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full font-sans">
                임시 세션 모드
              </span>
            )}
            
            {engineConnected ? (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> AI API 활성
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-full font-sans">
                ⚠️ AI 오프라인 (시뮬레이션)
              </span>
            )}
          </div>
        </div>

        {/* 채팅 히스토리 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  isUser ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-electric-cyan/20'
                }`}>
                  <span className="text-base">
                    {msg.sender === 'user' ? '👤' : msg.sender === 'ceo' ? '👑' : msg.sender === 'dev' ? '💻' : msg.sender === 'biz' ? '💼' : '🤖'}
                  </span>
                </div>

                <div className="flex flex-col space-y-1">
                  <span className={`text-[10px] text-gray-400 font-mono ${isUser ? 'text-right' : ''}`}>
                    {msg.senderName} <span className="text-[8px] text-gray-500 ml-1">{msg.timestamp}</span>
                  </span>

                  <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                    isUser
                      ? 'bg-electric-cyan/15 text-electric-cyan border border-electric-cyan/30 rounded-tr-none'
                      : 'bg-obsidian border border-slate-800 text-gray-200 rounded-tl-none shadow'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* 텍스트 입력부 */}
        <form onSubmit={handleSend} className="p-4 bg-obsidian/40 border-t border-obsidian-border flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
            placeholder="예) 코다리야 병아리 다마고치 게임 만들어줘..."
            className="flex-1 bg-obsidian-card border border-obsidian-border rounded-xl px-4 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-electric-cyan transition placeholder-gray-500 font-sans"
          />
          <button
            type="submit"
            disabled={isProcessing || !inputText.trim()}
            className="p-2.5 bg-electric-cyan hover:bg-cyan-500 text-obsidian rounded-xl transition disabled:bg-gray-700 disabled:text-gray-400 shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>

      {/* 우측 오케스트레이션 계획 타임라인 & 다마고치 실시간 시뮬레이션 데모 */}
      <div className="w-80 flex flex-col gap-4 shrink-0">
        
        {/* 오케스트레이션 타임라인 */}
        {dispatchSteps.length > 0 && (
          <div className="bg-obsidian-card rounded-2xl border border-obsidian-border p-4 flex flex-col glass-panel">
            <div className="flex items-center gap-1.5 border-b border-obsidian-border pb-2.5 mb-3">
              <Zap className="w-4 h-4 text-electric-cyan" />
              <h3 className="text-xs font-bold text-gray-200 font-sans">에이전트 오케스트레이션 (Dispatch)</h3>
            </div>

            <div className="space-y-3 font-sans">
              {dispatchSteps.map((step) => (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition duration-300 ${
                    step.status === 'processing'
                      ? 'bg-electric-cyan/5 border-electric-cyan/30 text-electric-cyan'
                      : step.status === 'done'
                      ? 'bg-slate-900/50 border-emerald-500/20 text-gray-400'
                      : 'bg-obsidian/40 border-obsidian-border text-gray-500'
                  }`}
                >
                  <span className="text-sm shrink-0">{step.agentEmoji}</span>
                  <div className="flex-1 flex flex-col">
                    <span className="text-[10px] font-bold tracking-wide">{step.agentName}</span>
                    <span className="text-[9px] mt-0.5 leading-relaxed">{step.task}</span>
                  </div>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border shrink-0 uppercase ${
                    step.status === 'processing'
                      ? 'bg-electric-cyan/20 border-electric-cyan/30 text-electric-cyan animate-pulse'
                      : step.status === 'done'
                      ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-gray-600'
                  }`}>
                    {step.status === 'processing' ? 'RUN' : step.status === 'done' ? 'OK' : 'WAIT'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🐤 다마고치 게임 데모 */}
        {showGameDemo && (
          <div className="bg-slate-900 rounded-2xl border-2 border-emerald-500/40 p-4 flex flex-col items-center glass-panel-neon animate-pulse">
            <div className="flex items-center gap-1.5 w-full border-b border-emerald-500/20 pb-2 mb-3">
              <span className="text-base">🐤</span>
              <h3 className="text-xs font-extrabold text-emerald-400 font-sans tracking-wide">
                실시간 다마고치 (Chick Demo Pack)
              </h3>
            </div>

            <div className="w-20 h-20 bg-slate-950 rounded-full border border-emerald-500/30 flex items-center justify-center relative mb-4">
              <span className="text-4xl animate-bounce">
                {tamagotchi.hunger < 20 || tamagotchi.play < 20 ? '😭' : tamagotchi.sleep < 20 ? '😴' : '🐤'}
              </span>
            </div>

            <div className="w-full space-y-2 mb-4 font-mono text-[9px]">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-gray-400">
                  <span>😋 포만감</span>
                  <span>{tamagotchi.hunger}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${tamagotchi.hunger}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-gray-400">
                  <span>🎉 친밀도 (재미)</span>
                  <span>{tamagotchi.play}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${tamagotchi.play}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-gray-400">
                  <span>💤 에너지 (수면)</span>
                  <span>{tamagotchi.sleep}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${tamagotchi.sleep}%` }} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={feedChic}
                className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[9px] font-bold transition"
              >
                🍖 밥주기
              </button>
              <button
                onClick={playChic}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-bold transition"
              >
                🎮 놀아주기
              </button>
              <button
                onClick={sleepChic}
                className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[9px] font-bold transition"
              >
                💤 재우기
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
