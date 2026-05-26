import React, { useState } from 'react';
import { Settings, Plug, Key, Database, RefreshCcw, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ConnectionsPanel() {
  const [llmType, setLlmType] = useState<'ollama' | 'lmstudio'>('ollama');
  const [llmUrl, setLlmUrl] = useState('http://127.0.0.1:11434');
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  
  const [teleToken, setTeleToken] = useState('123456789:AAEx-MockSecretaryBotToken12345');
  const [chatId, setChatId] = useState('987654321');
  const [teleTesting, setTeleTesting] = useState(false);
  const [teleStatus, setTeleStatus] = useState<'connected' | 'disconnected'>('connected');

  const [calendarLinked, setCalendarLinked] = useState(true);
  const [brainPath, setBrainPath] = useState('~/.connect-ai-brain');

  const testLlmPing = async () => {
    setPingStatus('testing');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    try {
      const pingUrl = llmType === 'ollama' ? `${llmUrl}/api/tags` : `${llmUrl}/models`;
      const res = await fetch(pingUrl);
      if (res.ok) {
        setPingStatus('success');
      } else {
        setPingStatus('failed');
      }
    } catch {
      setPingStatus('failed'); // 로컬 AI 미구동 시 실패
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
      <div className="bg-obsidian-card p-4 rounded-xl border border-obsidian-border flex items-center gap-3 glass-panel">
        <div className="p-2.5 bg-electric-cyan/15 rounded-lg border border-electric-cyan/20">
          <Settings className="w-5 h-5 text-electric-cyan" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-200">외부 시스템 API 연결 제어판</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">
            로컬 인공지능(LLM) 커넥션 진단 및 텔레그램, 구글 캘린더, 로컬 지식 리포지토리 연동 관리
          </p>
        </div>
      </div>

      {/* 설정 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* 1. 로컬 LLM 통신 진단 */}
        <div className="bg-obsidian-card p-4 rounded-2xl border border-obsidian-border glass-panel flex flex-col space-y-4">
          <div className="flex items-center gap-1.5 border-b border-obsidian-border pb-2">
            <Plug className="w-4 h-4 text-electric-cyan" />
            <h3 className="text-xs font-bold text-gray-200">로컬 인공지능 엔진 (Ollama / LM Studio)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400">엔진 타입 선택</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setLlmType('ollama'); setLlmUrl('http://127.0.0.1:11434'); }}
                  className={`flex-1 py-1.5 rounded-lg border transition font-bold ${
                    llmType === 'ollama'
                      ? 'bg-electric-cyan/10 border-electric-cyan text-electric-cyan'
                      : 'bg-obsidian/40 border-obsidian-border text-gray-400'
                  }`}
                >
                  Ollama (Brew/로컬)
                </button>
                <button
                  type="button"
                  onClick={() => { setLlmType('lmstudio'); setLlmUrl('http://127.0.0.1:1234/v1'); }}
                  className={`flex-1 py-1.5 rounded-lg border transition font-bold ${
                    llmType === 'lmstudio'
                      ? 'bg-electric-cyan/10 border-electric-cyan text-electric-cyan'
                      : 'bg-obsidian/40 border-obsidian-border text-gray-400'
                  }`}
                >
                  LM Studio
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400">API 엔드포인트 URL 주소</label>
              <input
                type="text"
                value={llmUrl}
                onChange={(e) => setLlmUrl(e.target.value)}
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
                    <AlertTriangle className="w-3.5 h-3.5" /> 연결 실패 (오프라인 시뮬레이션 적용)
                  </span>
                )}
                {pingStatus === 'idle' && (
                  <span className="text-[10px] text-gray-400">핑 테스트를 대기 중입니다.</span>
                )}
                {pingStatus === 'testing' && (
                  <span className="text-[10px] text-electric-cyan animate-pulse">상태 패킷 전송 중...</span>
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
                onChange={(e) => setTeleToken(e.target.value)}
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
                disabled={teleTesting}
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
                  setCalendarLinked(!calendarLinked);
                  alert(`구글 캘린더 OAuth 연결이 ${!calendarLinked ? '활성화' : '해제'}되었습니다.`);
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
                onChange={(e) => setBrainPath(e.target.value)}
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
