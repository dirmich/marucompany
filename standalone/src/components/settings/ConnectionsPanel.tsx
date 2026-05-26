import React, { useState, useEffect } from 'react';
import { Settings, Plug, Key, Database, RefreshCcw, CheckCircle, AlertTriangle } from 'lucide-react';

export type LLMEngineType = 'ollama' | 'lmstudio' | 'llamacpp' | 'vllm';

export default function ConnectionsPanel() {
  // localStorage 연동 초기화
  const [llmType, setLlmType] = useState<LLMEngineType>(() => {
    return (localStorage.getItem('connect-ai-llm-type') as LLMEngineType) || 'ollama';
  });
  
  const [llmUrl, setLlmUrl] = useState(() => {
    return localStorage.getItem('connect-ai-llm-url') || 'http://127.0.0.1:11434';
  });

  const [llmModel, setLlmModel] = useState(() => {
    return localStorage.getItem('connect-ai-llm-model') || '';
  });

  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  
  const [teleToken, setTeleToken] = useState('123456789:AAEx-MockSecretaryBotToken12345');
  const [chatId, setChatId] = useState('987654321');
  const [teleTesting, setTeleTesting] = useState(false);

  const [calendarLinked, setCalendarLinked] = useState(true);
  const [brainPath, setBrainPath] = useState('~/.marucompany-brain');

  const [backendSync, setBackendSync] = useState<'connected' | 'disconnected'>('disconnected');

  // 백엔드 Hono API 연동 로드 (Mount)
  useEffect(() => {
    const fetchSettingsFromBackend = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/settings');
        if (res.ok) {
          const data = await res.json();
          // 백엔드 설정을 상태 및 로컬 스토리지에 동기화
          setLlmType(data.llm_type);
          setLlmUrl(data.llm_url);
          setLlmModel(data.llm_model || '');
          setTeleToken(data.telegram_token || '');
          setChatId(data.chat_id || '');
          setCalendarLinked(data.calendar_linked);
          setBrainPath(data.brain_path || '');
          setBackendSync('connected');
          console.log('📶 PostgreSQL 백엔드 데이터베이스로부터 설정을 안전하게 동기화했습니다.');
        } else {
          setBackendSync('disconnected');
        }
      } catch {
        setBackendSync('disconnected'); // 백엔드 오프라인 시 로컬 스토리지 모드 자동 유지
      }
    };
    fetchSettingsFromBackend();
  }, []);

  // 설정 저장 처리 함수 (로컬 + 백엔드 DB 동시 영구 저장)
  const saveSettings = async (
    type: LLMEngineType,
    url: string,
    model: string,
    token: string,
    cId: string,
    calendar: boolean,
    path: string
  ) => {
    // 1. 로컬 스토리지 저장
    localStorage.setItem('connect-ai-llm-type', type);
    localStorage.setItem('connect-ai-llm-url', url);
    localStorage.setItem('connect-ai-llm-model', model);

    // 2. 백엔드 PostgreSQL 저장 시도 (CORS 대응)
    try {
      const res = await fetch('http://localhost:8000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llm_type: type,
          llm_url: url,
          llm_model: model,
          telegram_token: token,
          chat_id: cId,
          calendar_linked: calendar,
          brain_path: path,
        }),
      });
      if (res.ok) {
        setBackendSync('connected');
      } else {
        setBackendSync('disconnected');
      }
    } catch {
      setBackendSync('disconnected');
    }
  };

  const handleEngineChange = (type: LLMEngineType) => {
    setLlmType(type);
    let defaultUrl = 'http://127.0.0.1:11434';
    let defaultModel = '';
    
    if (type === 'lmstudio') {
      defaultUrl = 'http://127.0.0.1:1234/v1';
      defaultModel = 'qwen2.5-coder-7b';
    } else if (type === 'llamacpp') {
      defaultUrl = 'http://127.0.0.1:8080';
      defaultModel = 'llama-3';
    } else if (type === 'vllm') {
      defaultUrl = 'http://127.0.0.1:8000/v1';
      defaultModel = 'meta-llama/Meta-Llama-3-8B-Instruct';
    } else if (type === 'ollama') {
      defaultUrl = 'http://127.0.0.1:11434';
      defaultModel = 'gemma:2b';
    }

    setLlmUrl(defaultUrl);
    setLlmModel(defaultModel);
    setPingStatus('idle');
    
    saveSettings(type, defaultUrl, defaultModel, teleToken, chatId, calendarLinked, brainPath);
  };

  const testLlmPing = async () => {
    setPingStatus('testing');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    try {
      let pingUrl = `${llmUrl}/api/tags`; // ollama default
      
      if (llmType === 'lmstudio') {
        pingUrl = `${llmUrl}/models`;
      } else if (llmType === 'llamacpp') {
        pingUrl = `${llmUrl}/health`;
      } else if (llmType === 'vllm') {
        pingUrl = `${llmUrl}/models`;
      }

      const res = await fetch(pingUrl);
      if (res.ok) {
        setPingStatus('success');
      } else {
        setPingStatus('failed');
      }
    } catch {
      setPingStatus('failed'); // 타 기기 등 오프라인/통신 실패 시
    }
  };

  const testTelegram = async () => {
    setTeleTesting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setTeleTesting(false);
    alert('📨 핸드폰 텔레그램으로 테스트 카드가 전송되었습니다! (시뮬레이션)');
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 overflow-y-auto relative select-none font-sans">
      
      {/* 타이틀 헤더 */}
      <div className="bg-obsidian-card p-4 rounded-xl border border-obsidian-border flex items-center justify-between glass-panel">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-electric-cyan/15 rounded-lg border border-electric-cyan/20">
            <Settings className="w-5 h-5 text-electric-cyan" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-200">외부 시스템 API 연결 제어판</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              로컬 및 외부 기기 인공지능(LLM) 커넥션 진단 및 텔레그램, 구글 캘린더, 로컬 지식 리포지토리 연동 관리
            </p>
          </div>
        </div>

        {/* 백엔드 데이터베이스 연결 상태 */}
        <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold">
          {backendSync === 'connected' ? (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 🛢️ PostgreSQL 백엔드 영구 보존 동기화 활성
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2.5 py-1 rounded-full">
              ⚠️ 백엔드 미동기화 (로컬 브라우저 백업 가동)
            </span>
          )}
        </div>
      </div>

      {/* 설정 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* 1. 로컬 및 다른 기기 LLM 통신 진단 */}
        <div className="bg-obsidian-card p-4 rounded-2xl border border-obsidian-border glass-panel flex flex-col space-y-4">
          <div className="flex items-center gap-1.5 border-b border-obsidian-border pb-2">
            <Plug className="w-4 h-4 text-electric-cyan" />
            <h3 className="text-xs font-bold text-gray-200">로컬 및 외부 LLM 엔진 연결 (Ollama / Llama.cpp / vLLM 등)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400">엔진 타입 선택</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleEngineChange('ollama')}
                  className={`py-1.5 rounded-lg border transition font-bold text-[11px] ${
                    llmType === 'ollama'
                      ? 'bg-electric-cyan/10 border-electric-cyan text-electric-cyan'
                      : 'bg-obsidian/40 border-obsidian-border text-gray-400'
                  }`}
                >
                  Ollama
                </button>
                <button
                  type="button"
                  onClick={() => handleEngineChange('lmstudio')}
                  className={`py-1.5 rounded-lg border transition font-bold text-[11px] ${
                    llmType === 'lmstudio'
                      ? 'bg-electric-cyan/10 border-electric-cyan text-electric-cyan'
                      : 'bg-obsidian/40 border-obsidian-border text-gray-400'
                  }`}
                >
                  LM Studio
                </button>
                <button
                  type="button"
                  onClick={() => handleEngineChange('llamacpp')}
                  className={`py-1.5 rounded-lg border transition font-bold text-[11px] ${
                    llmType === 'llamacpp'
                      ? 'bg-electric-cyan/10 border-electric-cyan text-electric-cyan'
                      : 'bg-obsidian/40 border-obsidian-border text-gray-400'
                  }`}
                >
                  llama.cpp
                </button>
                <button
                  type="button"
                  onClick={() => handleEngineChange('vllm')}
                  className={`py-1.5 rounded-lg border transition font-bold text-[11px] ${
                    llmType === 'vllm'
                      ? 'bg-electric-cyan/10 border-electric-cyan text-electric-cyan'
                      : 'bg-obsidian/40 border-obsidian-border text-gray-400'
                  }`}
                >
                  vLLM (OpenAI API)
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400">API 엔드포인트 URL 주소 (다른 기기 IP도 가능)</label>
              <input
                type="text"
                value={llmUrl}
                onChange={(e) => {
                  setLlmUrl(e.target.value);
                  saveSettings(llmType, e.target.value, llmModel, teleToken, chatId, calendarLinked, brainPath);
                }}
                placeholder="예: http://192.168.1.100:11434"
                className="bg-obsidian border border-obsidian-border rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-electric-cyan font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400">사용할 모델 이름 (Model Name)</label>
              <input
                type="text"
                value={llmModel}
                onChange={(e) => {
                  setLlmModel(e.target.value);
                  saveSettings(llmType, llmUrl, e.target.value, teleToken, chatId, calendarLinked, brainPath);
                }}
                placeholder="비우면 기본 지정 모델 사용"
                className="bg-obsidian border border-obsidian-border rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-electric-cyan font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5">
                {pingStatus === 'success' && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                    <CheckCircle className="w-3.5 h-3.5" /> 통신 연결 성공 ✅
                  </span>
                )}
                {pingStatus === 'failed' && (
                  <span className="flex items-center gap-1 text-[10px] text-red-400 font-mono font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> 연결 실패 (시뮬레이션 모드 작동)
                  </span>
                )}
                {pingStatus === 'idle' && (
                  <span className="text-[10px] text-gray-400">핑 테스트 대기 중</span>
                )}
                {pingStatus === 'testing' && (
                  <span className="text-[10px] text-electric-cyan animate-pulse">패킷 전송 중...</span>
                )}
              </div>

              <button
                onClick={testLlmPing}
                disabled={pingStatus === 'testing'}
                className="px-3 py-1.5 bg-electric-cyan text-obsidian font-bold rounded-lg hover:bg-cyan-500 transition flex items-center gap-1 shrink-0"
              >
                <RefreshCcw className={`w-3 h-3 ${pingStatus === 'testing' ? 'animate-spin' : ''}`} /> 연결 확인 (Ping)
              </button>
            </div>
          </div>
        </div>

        {/* 2. 모바일 비서 텔레그램 연동 */}
        <div className="bg-obsidian-card p-4 rounded-2xl border border-obsidian-border glass-panel flex flex-col space-y-4">
          <div className="flex items-center gap-1.5 border-b border-obsidian-border pb-2">
            <Key className="w-4 h-4 text-electric-violet" />
            <h3 className="text-xs font-bold text-gray-200 font-sans">비서 텔레그램 봇 모바일 브릿지</h3>
          </div>

          <div className="space-y-3 text-xs font-sans">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400">Telegram Bot Token</label>
              <input
                type="password"
                value={teleToken}
                onChange={(e) => {
                  setTeleToken(e.target.value);
                  saveSettings(llmType, llmUrl, llmModel, e.target.value, chatId, calendarLinked, brainPath);
                }}
                className="bg-obsidian border border-obsidian-border rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-electric-cyan font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400">자동 인식된 Chat ID</label>
              <input
                type="text"
                value={chatId}
                disabled
                className="bg-slate-900 border border-obsidian-border rounded-lg px-3 py-2 text-gray-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-500/20 px-2 py-0.5 rounded">
                ● LIVE BRIDGE ACTIVE
              </span>

              <button
                onClick={testTelegram}
                className="px-3 py-1.5 bg-electric-violet text-white font-bold rounded-lg hover:bg-violet-600 transition flex items-center gap-1 shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.3)]"
              >
                테스트 노티 발송 📨
              </button>
            </div>
          </div>
        </div>

        {/* 3. 구글 캘린더 OAuth */}
        <div className="bg-obsidian-card p-4 rounded-2xl border border-obsidian-border glass-panel flex flex-col space-y-4">
          <div className="flex items-center gap-1.5 border-b border-obsidian-border pb-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-gray-200">Google Calendar OAuth 연동</h3>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              비서가 마스터님의 구글 캘린더에 접근하여 자연어로 일정을 조회하고 미팅을 예약/삭제할 수 있는 권한 승인 상태입니다.
            </p>

            <div className="flex items-center justify-between bg-obsidian/60 p-3 rounded-lg border border-obsidian-border">
              <div className="flex flex-col">
                <span className="font-bold text-gray-300">구글 계정 연결 상태</span>
                <span className="text-[9px] text-gray-500">wonseokjung@gmail.com</span>
              </div>

              <button
                onClick={() => {
                  const targetLink = !calendarLinked;
                  setCalendarLinked(targetLink);
                  saveSettings(llmType, llmUrl, llmModel, teleToken, chatId, targetLink, brainPath);
                  alert(`구글 캘린더 OAuth 연결이 ${targetLink ? '활성화' : '해제'}되었습니다.`);
                }}
                className={`px-3 py-1 rounded text-[10px] font-bold transition ${
                  calendarLinked ? 'bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/40' : 'bg-emerald-500 text-obsidian hover:bg-emerald-400'
                }`}
              >
                {calendarLinked ? '연결 끊기' : '구글 연동 활성화'}
              </button>
            </div>
          </div>
        </div>

        {/* 4. 로컬 지식 저장소 (Second Brain) */}
        <div className="bg-obsidian-card p-4 rounded-2xl border border-obsidian-border glass-panel flex flex-col space-y-4">
          <div className="flex items-center gap-1.5 border-b border-obsidian-border pb-2">
            <Database className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-gray-200">로컬 제2의 두뇌 (Local Second Brain Path)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400">지식 위키 저장 폴더 경로</label>
              <input
                type="text"
                value={brainPath}
                onChange={(e) => {
                  setBrainPath(e.target.value);
                  saveSettings(llmType, llmUrl, llmModel, teleToken, chatId, calendarLinked, e.target.value);
                }}
                className="bg-obsidian border border-obsidian-border rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-electric-cyan font-mono"
              />
            </div>

            <p className="text-[9px] text-gray-500 leading-relaxed">
              * 해당 로컬 디렉토리 내부의 `.md` 파일들이 P-Reinforce 규칙에 맞춰 자율 구조화되며, 지정된 백업 깃허브 저장소로 Auto-Git Sync가 자동 기동됩니다.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
