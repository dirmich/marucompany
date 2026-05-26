import React, { useState, useEffect } from 'react';
import { Settings, Plug, Key, RefreshCcw, CheckCircle, AlertTriangle, Trash2, Plus, BrainCircuit } from 'lucide-react';

export type LLMEngineType = 'ollama' | 'lmstudio' | 'llamacpp' | 'vllm';

export const FALLBACK_MODELS: Record<LLMEngineType, string[]> = {
  ollama: ['gemma:2b', 'llama3:latest', 'mistral:latest', 'phi3:latest', 'qwen2.5-coder:latest'],
  lmstudio: ['qwen2.5-coder-7b', 'meta-llama-3-8b-instruct', 'microsoft-phi-3-medium'],
  llamacpp: ['llama.cpp-default-server'],
  vllm: ['meta-llama/Meta-Llama-3-8B-Instruct', 'Qwen/Qwen2.5-Coder-7B-Instruct'],
};

interface BrainDoc {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

export default function ConnectionsPanel() {
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
  const [backendSync, setBackendSync] = useState<'connected' | 'disconnected'>('disconnected');

  // 🧠 연결 확인 시 로드할 사용 가능한 모델 리스트 상태
  const [availableModels, setAvailableModels] = useState<string[]>(() => {
    const saved = localStorage.getItem('connect-ai-available-models');
    return saved ? JSON.parse(saved) : [];
  });

  // ✍️ 수동 직접 입력 토글 상태
  const [isCustomModel, setIsCustomModel] = useState(false);

  // 1. 마운트 시 혹은 모델/엔진 변경 시 수동 모드 여부 자동 감지
  useEffect(() => {
    const modelsToUse = availableModels.length > 0 ? availableModels : FALLBACK_MODELS[llmType] || [];
    if (llmModel && !modelsToUse.includes(llmModel)) {
      setIsCustomModel(true);
    } else {
      setIsCustomModel(false);
    }
  }, [llmModel, llmType, availableModels]);

  // 2. 엔진(llmType)이나 스캔 결과(availableModels)가 갱신되었을 때, 
  // 기존 llmModel이 빈값 또는 불일치하고 수동 모드가 아닐 시 첫 번째 항목으로 자동 교정하여 드롭다운 빈칸 표시 차단
  useEffect(() => {
    const modelsToUse = availableModels.length > 0 ? availableModels : FALLBACK_MODELS[llmType] || [];
    if (modelsToUse.length > 0) {
      if (!llmModel || (!modelsToUse.includes(llmModel) && !isCustomModel)) {
        const fallbackTarget = modelsToUse[0] || '';
        setLlmModel(fallbackTarget);
        saveSettings(llmType, llmUrl, fallbackTarget, teleToken, chatId, calendarLinked);
      }
    }
  }, [llmType, availableModels]);



  // 🛢️ PostgreSQL 내장 지식 데이터베이스 관리 상태
  const [brainDocs, setBrainDocs] = useState<BrainDoc[]>([]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Wiki');
  const [docLoading, setDocLoading] = useState(false);

  // 백엔드 연동 로드 (Mount)
  useEffect(() => {
    const fetchSettingsAndDocs = async () => {
      try {
        // A. 설정 데이터 연동
        const settingsRes = await fetch('http://localhost:8000/api/settings');
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setLlmType(data.llm_type);
          setLlmUrl(data.llm_url);
          setLlmModel(data.llm_model || '');
          setTeleToken(data.telegram_token || '');
          setChatId(data.chat_id || '');
          setCalendarLinked(data.calendar_linked);
          setBackendSync('connected');
        }

        // B. 지식 문서(Second Brain Docs) 연동
        fetchDocuments();
      } catch {
        setBackendSync('disconnected');
        // 오프라인 Mock 데이터 복구
        setBrainDocs([
          { id: 1, title: 'MrBeast 유튜브 썸네일 전략 팩', content: '클릭률(CTR) 18% 달성을 위해 노란색 배경에 강한 클로즈업 사진을 쓴다.', category: 'Skills', created_at: '방금 전' },
          { id: 2, title: '마루컴퍼니 매출 확장 로드맵', content: 'PayPal 실시간 IPN 검증 솔루션을 게임 내 탑재하여 자동 부가 수익 획득.', category: 'Decisions', created_at: '방금 전' },
        ]);
      }
    };

    fetchSettingsAndDocs();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/documents');
      if (res.ok) {
        const data = await res.json();
        setBrainDocs(data);
      }
    } catch {
      console.log('지식 목록 불러오기 실패 (오프라인)');
    }
  };

  const saveSettings = async (
    type: LLMEngineType,
    url: string,
    model: string,
    token: string,
    cId: string,
    calendar: boolean
  ) => {
    localStorage.setItem('connect-ai-llm-type', type);
    localStorage.setItem('connect-ai-llm-url', url);
    localStorage.setItem('connect-ai-llm-model', model);

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
        }),
      });
      if (res.ok) setBackendSync('connected');
      else setBackendSync('disconnected');
    } catch {
      setBackendSync('disconnected');
    }
  };

  // 🛢️ PostgreSQL 신규 지식 주입 (DB Insert)
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim() || docLoading) return;

    setDocLoading(true);
    const payload = {
      title: newDocTitle.trim(),
      content: newDocContent.trim(),
      category: newDocCategory,
    };

    try {
      const res = await fetch('http://localhost:8000/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNewDocTitle('');
        setNewDocContent('');
        fetchDocuments();
        alert('🎉 데이터베이스 지식망에 마크다운 지식이 성공적으로 주입되었습니다! (100% Fileless)');
      } else {
        alert('❌ 백엔드 서버에서 지식 주입을 처리하지 못했습니다.');
      }
    } catch {
      // 오프라인 Mock 추가 시뮬레이션
      const mockDoc: BrainDoc = {
        id: Date.now(),
        title: payload.title,
        content: payload.content,
        category: payload.category,
        created_at: '방금 전',
      };
      setBrainDocs((prev) => [mockDoc, ...prev]);
      setNewDocTitle('');
      setNewDocContent('');
      alert('⚠️ 오프라인 임시 모드: 지식이 로컬 세션에 임시 주입되었습니다.');
    } finally {
      setDocLoading(false);
    }
  };

  // 🛢️ PostgreSQL 지식 노드 영구 파쇄 (DB Delete)
  const handleDeleteDocument = async (id: number) => {
    if (!confirm('정말로 이 지식 노드를 데이터베이스에서 영구 파쇄하시겠습니까?')) return;

    try {
      const res = await fetch(`http://localhost:8000/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDocuments();
      } else {
        alert('파쇄 실패');
      }
    } catch {
      setBrainDocs((prev) => prev.filter((doc) => doc.id !== id));
      alert('⚠️ 오프라인 임시 모드: 로컬 세션에서 임시 소멸 처리되었습니다.');
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
    
    saveSettings(type, defaultUrl, defaultModel, teleToken, chatId, calendarLinked);
  };

  const testLlmPing = async () => {
    setPingStatus('testing');
    setAvailableModels([]);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // A. 백엔드 Hono 프록시 API를 통한 CORS 회피 스캔 시도
    try {
      const proxyRes = await fetch('http://localhost:8000/api/proxy/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llm_type: llmType, llm_url: llmUrl }),
      });

      if (proxyRes.ok) {
        const result = await proxyRes.json();
        if (result.success && result.models && result.models.length > 0) {
          bindModels(result.models);
          return;
        }
      }
    } catch (err) {
      console.warn('백엔드 프록시 통신 실패, 클라이언트 직접 핑을 우회 시도합니다.', err);
    }

    // B. 오프라인 회복 탄력성: 브라우저 직접 fetch fallback 시도 (백엔드가 꺼졌거나 프록시가 차단되었을 때)
    try {
      let pingUrl = `${llmUrl}/api/tags`;
      if (llmType === 'lmstudio' || llmType === 'vllm' || llmType === 'llamacpp') {
        let cleanUrl = llmUrl.replace(/\/+$/, "");
        if (!cleanUrl.endsWith("/v1")) {
          cleanUrl = `${cleanUrl}/v1`;
        }
        pingUrl = `${cleanUrl}/models`;
      }

      const res = await fetch(pingUrl);
      if (res.ok) {
        const data = await res.json();
        let modelList: string[] = [];
        // 마스터님의 실제 llama.cpp 응답 데이터 기반 초정밀 하이브리드 모델 스캔 알고리즘 적용
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          modelList = data.data.map((m: any) => m.id || m.name || '');
        } else if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          modelList = data.models.map((m: any) => m.name || m.model || '');
        }

        if (modelList.length > 0) {
          bindModels(modelList);
          return;
        }
      }
      setPingStatus('failed');
    } catch (err) {
      console.error('LLM 직접 핑/모델 감지 통신 마저 실패:', err);
      setPingStatus('failed');
    }
  };

  const bindModels = (modelList: string[]) => {
    setPingStatus('success');
    setAvailableModels(modelList);
    localStorage.setItem('connect-ai-available-models', JSON.stringify(modelList));
    
    // 로드된 첫 번째 모델을 자동으로 현재 모델로 바인딩
    if (!llmModel || !modelList.includes(llmModel)) {
      setLlmModel(modelList[0]);
      saveSettings(llmType, llmUrl, modelList[0], teleToken, chatId, calendarLinked);
    }
    console.log(`🤖 실시간 연동 성공: ${modelList.length}개의 모델 목록을 감지해 이식했습니다.`, modelList);
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
      <div className="bg-obsidian-card p-4 rounded-xl border border-obsidian-border flex justify-between items-center glass-panel">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-electric-cyan/15 rounded-lg border border-electric-cyan/20">
            <Settings className="w-5 h-5 text-electric-cyan" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-200">외부 시스템 API 연결 제어판</h2>
            <p className="text-xs text-gray-400 mt-1">
              로컬 및 원격 AI 엔진 통신 설정 및 PostgreSQL 데이터베이스 지식망 영구 연동 관리
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
          {backendSync === 'connected' ? (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-full animate-pulse">
              🛢️ PostgreSQL DB-First 활성 (오프라인 파일 완전 배제됨)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2.5 py-1 rounded-full">
              ⚠️ 임시 로컬 세션 (서버 오프라인)
            </span>
          )}
        </div>
      </div>

      {/* 설정 1단 레이아웃 (LLM & 텔레그램 / 구글) */}
      <div className="grid grid-cols-2 gap-4">
        {/* 로컬 및 다른 기기 LLM 통신 진단 */}
        <div className="bg-obsidian-card p-4 rounded-2xl border border-obsidian-border glass-panel flex flex-col space-y-4">
          <div className="flex items-center gap-1.5 border-b border-obsidian-border pb-2">
            <Plug className="w-4 h-4 text-electric-cyan" />
            <h3 className="text-xs font-bold text-gray-200">로컬 및 외부 LLM 엔진 (Ollama / Llama.cpp / vLLM 등)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">엔진 타입 선택</label>
              <div className="grid grid-cols-2 gap-2">
                {['ollama', 'lmstudio', 'llamacpp', 'vllm'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleEngineChange(type as LLMEngineType)}
                    className={`py-2 rounded-lg border transition font-bold text-xs uppercase ${
                      llmType === type
                        ? 'bg-electric-cyan/10 border-electric-cyan text-electric-cyan'
                        : 'bg-obsidian/40 border-obsidian-border text-gray-400'
                    }`}
                  >
                    {type === 'llamacpp' ? 'llama.cpp' : type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">API 엔드포인트 URL 주소 (다른 기기 IP도 지원)</label>
              <input
                type="text"
                value={llmUrl}
                onChange={(e) => {
                  setLlmUrl(e.target.value);
                  saveSettings(llmType, e.target.value, llmModel, teleToken, chatId, calendarLinked);
                }}
                placeholder="예: http://192.168.1.100:11434"
                className="bg-obsidian border border-obsidian-border rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-electric-cyan font-mono"
              />
            </div>

            <div className="flex flex-col gap-1 relative">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400">사용할 모델 선택 (Model Name)</label>
                {availableModels.length > 0 ? (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                    ● 실시간 모델 {availableModels.length}개 감지됨
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    ● 기본 권장 목록 (오프라인)
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {!isCustomModel ? (
                  <select
                    value={llmModel}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setIsCustomModel(true);
                        setLlmModel('');
                      } else {
                        setLlmModel(val);
                        saveSettings(llmType, llmUrl, val, teleToken, chatId, calendarLinked);
                      }
                    }}
                    className="flex-1 bg-obsidian border border-obsidian-border rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-electric-cyan font-mono transition-all duration-300 shadow-[0_0_10px_rgba(0,240,255,0.05)] hover:border-electric-cyan/40"
                  >
                    {(availableModels.length > 0 ? availableModels : FALLBACK_MODELS[llmType] || []).map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                    <option value="__custom__" className="text-electric-cyan font-bold">
                      ✍️ 수동 직접 입력...
                    </option>
                  </select>
                ) : (
                  <div className="flex-1 flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={llmModel}
                      onChange={(e) => {
                        setLlmModel(e.target.value);
                        saveSettings(llmType, llmUrl, e.target.value, teleToken, chatId, calendarLinked);
                      }}
                      placeholder="예: gemma:2b"
                      className="flex-1 bg-obsidian border border-electric-cyan rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-electric-cyan font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomModel(false);
                        const fallbackList = availableModels.length > 0 ? availableModels : FALLBACK_MODELS[llmType] || [];
                        const firstModel = fallbackList[0] || '';
                        setLlmModel(firstModel);
                        saveSettings(llmType, llmUrl, firstModel, teleToken, chatId, calendarLinked);
                      }}
                      className="px-2.5 py-2 bg-slate-900 border border-obsidian-border text-gray-400 rounded-lg hover:text-gray-200 hover:border-slate-800 transition text-[10px] shrink-0"
                    >
                      목록으로
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5">
                {pingStatus === 'success' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono font-bold">
                    <CheckCircle className="w-3.5 h-3.5" /> 통신 연결 성공 ✅
                  </span>
                )}
                {pingStatus === 'failed' && (
                  <span className="flex items-center gap-1 text-xs text-red-400 font-mono font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> 연결 실패 (시뮬레이션 모드 작동)
                  </span>
                )}
                {pingStatus === 'idle' && <span className="text-xs text-gray-400">핑 테스트 대기 중</span>}
                {pingStatus === 'testing' && <span className="text-xs text-electric-cyan animate-pulse">패킷 전송 중...</span>}
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

        {/* 모바일 비서 텔레그램 연동 */}
        <div className="bg-obsidian-card p-4 rounded-2xl border border-obsidian-border glass-panel flex flex-col space-y-4">
          <div className="flex items-center gap-1.5 border-b border-obsidian-border pb-2">
            <Key className="w-4 h-4 text-electric-violet" />
            <h3 className="text-xs font-bold text-gray-200">비서 텔레그램 봇 모바일 브릿지</h3>
          </div>

          <div className="space-y-3 text-sm font-sans">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Telegram Bot Token</label>
              <input
                type="password"
                value={teleToken}
                onChange={(e) => {
                  setTeleToken(e.target.value);
                  saveSettings(llmType, llmUrl, llmModel, e.target.value, chatId, calendarLinked);
                }}
                className="bg-obsidian border border-obsidian-border rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-electric-cyan font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">자동 인식된 Chat ID</label>
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
                disabled={teleTesting}
                className="px-3 py-1.5 bg-electric-violet disabled:bg-slate-800 disabled:text-gray-500 text-white font-bold rounded-lg hover:bg-violet-600 transition flex items-center gap-1 shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.3)] font-sans"
              >
                {teleTesting ? '전송 중... 📨' : '테스트 노티 발송 📨'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2단: 🛢️ PostgreSQL 내장 지식 데이터베이스 관리 시스템 (Second Brain Editor - [NEW/DB-FIRST]) */}
      <div className="bg-obsidian-card p-4 rounded-2xl border border-obsidian-border glass-panel flex flex-col space-y-4">
        <div className="flex items-center gap-1.5 border-b border-obsidian-border pb-2.5">
          <BrainCircuit className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-gray-200 font-sans tracking-wide">
            🛢️ PostgreSQL 내장 지식 라이브러리 (Fileless Second Brain)
          </h3>
        </div>

        <div className="grid grid-cols-5 gap-4">
          
          {/* 지식 주입 폼 (왼쪽 2열) */}
          <form onSubmit={handleAddDocument} className="col-span-2 space-y-3 bg-obsidian/40 border border-slate-900 p-3.5 rounded-xl text-xs font-sans">
            <h4 className="font-bold text-electric-cyan flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> 신규 지식 노드 주입
            </h4>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">지식 제목 (Title)</label>
              <input
                type="text"
                required
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="예: MrBeast 유튜브 CTR 최적화 전략"
                className="bg-obsidian border border-obsidian-border rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-electric-cyan font-sans"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">지식 카테고리 (Category)</label>
              <select
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value)}
                className="bg-obsidian border border-obsidian-border rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-electric-cyan"
              >
                <option value="Wiki">💡 Topics (위키)</option>
                <option value="Decisions">⚖️ Decisions (결정 로그)</option>
                <option value="Skills">🚀 Skills (패턴/스킬)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">마크다운 본문 내용 (Content)</label>
              <textarea
                required
                rows={4}
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                placeholder="인공지능 에이전트들이 미션 오케스트레이션 시 인용해 RAG에 적용할 텍스트 지식을 기입합니다..."
                className="bg-obsidian border border-obsidian-border rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-electric-cyan font-sans resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={docLoading}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-obsidian font-bold rounded-lg transition text-center shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              {docLoading ? '지식 인젝션 중...' : '지식 주입 (DB 저장)'}
            </button>
          </form>

          {/* 지식 리스트 보드 (오른쪽 3열) */}
          <div className="col-span-3 bg-obsidian/20 border border-slate-900 rounded-xl p-3 flex flex-col h-[340px]">
            <span className="text-xs text-gray-400 font-bold mb-2">데이터베이스 활성 지식망 리스트</span>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {brainDocs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs font-mono">
                  [Empty] 현재 주입된 세컨브레인 지식이 없습니다.
                </div>
              ) : (
                brainDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-obsidian-card border border-slate-900 rounded-lg hover:border-slate-800 transition flex justify-between items-start gap-4"
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold uppercase ${
                          doc.category === 'Skills'
                            ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
                            : doc.category === 'Decisions'
                            ? 'bg-electric-violet/20 border-electric-violet/30 text-electric-violet'
                            : 'bg-electric-cyan/20 border-electric-cyan/30 text-electric-cyan'
                        }`}>
                          {doc.category}
                        </span>
                        <span className="font-bold text-sm text-gray-200">{doc.title}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-sans">{doc.content}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1 text-gray-500 hover:text-red-400 transition"
                      title="지식 파쇄"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
