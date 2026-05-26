import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, ShieldAlert, Cpu, Sparkles, UserCheck } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  status: 'idle' | 'working' | 'meeting' | 'resting';
  x: number; // 0 ~ 100 (%)
  y: number; // 0 ~ 100 (%)
  color: string;
}

const INITIAL_AGENTS: Agent[] = [
  { id: 'ceo', name: 'Jay', role: '대표이사 (CEO)', emoji: '👑', status: 'idle', x: 50, y: 15, color: '#F59E0B' },
  { id: 'dev', name: '코다리', role: '수석 개발자', emoji: '💻', status: 'idle', x: 20, y: 35, color: '#00F0FF' },
  { id: 'youtube', name: '레오', role: '유튜브 디렉터', emoji: '📺', status: 'idle', x: 20, y: 65, color: '#EF4444' },
  { id: 'biz', name: '현빈', role: '비즈니스 분석가', emoji: '💼', status: 'idle', x: 80, y: 35, color: '#8B5CF6' },
  { id: 'finance', name: '영숙', role: '재무 관리자 (CFO)', emoji: '💰', status: 'idle', x: 80, y: 65, color: '#10B981' },
  { id: 'design', name: '루나', role: 'UI/UX 디자이너', emoji: '🎨', status: 'idle', x: 35, y: 80, color: '#EC4899' },
  { id: 'security', name: '셜록', role: 'QA & 보안 팀장', emoji: '🔍', status: 'idle', x: 65, y: 80, color: '#3B82F6' },
  { id: 'writer', name: '아라', role: '수석 카피라이터', emoji: '✍️', status: 'idle', x: 35, y: 45, color: '#F59E0B' },
  { id: 'media', name: '민우', role: '미디어 아티스트', emoji: '🎵', status: 'idle', x: 65, y: 45, color: '#14B8A6' },
];

interface Beam {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

export default function VirtualOffice() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [autoCycle, setAutoCycle] = useState<boolean>(true);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [isMeeting, setIsMeeting] = useState<boolean>(false);
  const [glitchActive, setGlitchActive] = useState<boolean>(false);
  const [beams, setBeams] = useState<Beam[]>([]);
  const [activeChatter, setActiveChatter] = useState<{ [key: string]: string }>({});
  const [dbSync, setDbSync] = useState<boolean>(false);
  const officeRef = useRef<HTMLDivElement>(null);

  // 1. 마운트 시 Hono 백엔드에서 과거 작동 로그 가져오기
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/logs');
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setStatusLog(data);
          } else {
            const initLog = '[System] 가상 오피스 시스템이 활성화되었으며, 파일리스 DB-First 지식망 작동 준비를 마쳤습니다.';
            setStatusLog([initLog]);
            saveLogToBackend(initLog);
          }
          setDbSync(true);
        } else {
          loadFallbackLogs();
        }
      } catch {
        loadFallbackLogs();
      }
    };

    const loadFallbackLogs = () => {
      setStatusLog(['[System] 가상 오피스 시스템이 로컬 네트워크에서 대기 중입니다.']);
      setDbSync(false);
    };

    fetchLogs();
  }, []);

  // 2. 미션 브로드캐스트 이벤트 구독
  useEffect(() => {
    const handleDispatch = (e: Event) => {
      const customEvent = e as CustomEvent;
      triggerMeeting(customEvent.detail?.mission || '종합 매출 & 서비스 확장 전략 회의');
    };
    window.addEventListener('ai-dispatch-mission', handleDispatch);
    return () => window.removeEventListener('ai-dispatch-mission', handleDispatch);
  }, [agents, isMeeting]);

  // 작동 로그 백엔드 DB 전송 헬퍼 함수
  const saveLogToBackend = async (msg: string) => {
    try {
      await fetch('http://localhost:8000/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
    } catch {
      console.log('회사 로그 DB 동기화 불가 (오프라인)');
    }
  };

  const addLog = (msg: string) => {
    const formatted = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setStatusLog((prev) => [formatted, ...prev.slice(0, 15)]);
    saveLogToBackend(formatted);
  };

  // 시네마틱 회의 트리거
  const triggerMeeting = async (missionName: string) => {
    if (isMeeting) return;
    setIsMeeting(true);
    setGlitchActive(true);
    addLog(`🚨 DISPATCH PROTOCOL: "${missionName}" 미션이 발동되었습니다!`);

    await new Promise((resolve) => setTimeout(resolve, 2000));
    setGlitchActive(false);

    addLog('⚡ CEO가 각 분야 전문 에이전트들을 소집합니다. 광선 통신 개시.');
    
    const newBeams: Beam[] = [];
    agents.forEach((agent, i) => {
      if (agent.id === 'ceo') return;
      newBeams.push({
        id: Date.now() + i,
        startX: 50,
        startY: 15,
        endX: agent.x,
        endY: agent.y,
        color: agent.color,
      });
    });
    setBeams(newBeams);

    await new Promise((resolve) => setTimeout(resolve, 1200));
    setBeams([]);

    addLog('👥 에이전트들이 중앙 회의실 테이블로 이동하여 합류합니다.');
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === 'ceo') return { ...agent, status: 'meeting', x: 50, y: 40 };
        const angle = (INITIAL_AGENTS.findIndex((a) => a.id === agent.id) * 360) / (INITIAL_AGENTS.length - 1);
        const rad = (angle * Math.PI) / 180;
        const radius = 12;
        return {
          ...agent,
          status: 'meeting',
          x: 50 + radius * Math.cos(rad),
          y: 53 + radius * Math.sin(rad),
        };
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
    setActiveChatter({ ceo: '이번 달 종합 비즈니스 성과와 향후 자율 서비스 확장 전략을 수립합시다.' });
    
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setActiveChatter({
      ceo: '',
      biz: '📊 PayPal 실시간 매출 추적 결과, 30일간 $1,190.20의 거래(18건)가 정상 승인되었습니다.',
    });

    await new Promise((resolve) => setTimeout(resolve, 2500));
    setActiveChatter({
      biz: '',
      youtube: '📺 유튜브 채널 분석 결과 트렌드 반응성이 18% 증가했습니다. 신규 랜딩 홍보 숏츠를 배포하겠습니다.',
    });

    await new Promise((resolve) => setTimeout(resolve, 2500));
    setActiveChatter({
      youtube: '',
      dev: '💻 Neon Survivor 게임 결제 연동 패치 완료! 30초 내 빌드 및 즉시 배포할 준비가 되었습니다.',
    });

    await new Promise((resolve) => setTimeout(resolve, 2500));
    setActiveChatter({
      dev: '',
      ceo: '👍 훌륭합니다. 그럼 코다리는 게임 배포를, 레오는 랜딩 프로모션을 개시하세요. 즉각 1스텝 실행!',
    });

    await new Promise((resolve) => setTimeout(resolve, 2500));
    setActiveChatter({});

    addLog('🚀 회의가 완벽히 종료되었습니다. 각 에이전트들이 실무 실현 태스크에 즉시 착수합니다.');
    setAgents((prev) =>
      prev.map((agent) => {
        const initial = INITIAL_AGENTS.find((a) => a.id === agent.id)!;
        return {
          ...agent,
          status: agent.id === 'ceo' ? 'idle' : 'working',
          x: initial.x,
          y: initial.y,
        };
      })
    );

    setIsMeeting(false);
  };

  const resetOffice = () => {
    setAgents(INITIAL_AGENTS);
    setIsMeeting(false);
    setGlitchActive(false);
    setBeams([]);
    setActiveChatter({});
    setStatusLog([]);
    addLog('오피스 레이아웃과 요원 상태가 초기화되었습니다.');
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-4 overflow-hidden relative select-none">
      
      {glitchActive && (
        <div className="absolute inset-0 bg-red-950/80 backdrop-blur-md flex flex-col justify-center items-center z-50 animate-pulse border-2 border-red-500/30">
          <div className="text-red-500 font-extrabold text-3xl tracking-widest uppercase animate-bounce font-mono">
            ⚠️ DISPATCH PROTOCOL INITIALIZED ⚠️
          </div>
          <div className="text-gray-300 text-sm mt-2 tracking-wide font-mono">
            CEO & 9 요원 협업 회의실 이동 중...
          </div>
          <div className="flex space-x-2 text-[10px] text-red-500/40 mt-4 font-mono">
            <span>01001100</span>
            <span>11001010</span>
            <span>00111100</span>
            <span>11100101</span>
          </div>
        </div>
      )}

      {beams.map((beam) => {
        const dx = beam.endX - beam.startX;
        const dy = beam.endY - beam.startY;
        return (
          <div
            key={beam.id}
            className="beam-laser"
            style={
              {
                left: `${beam.startX}%`,
                top: `${beam.startY}%`,
                '--tx': `${dx * 8}px`,
                '--ty': `${dy * 5}px`,
                '--beam-color': beam.color,
              } as React.CSSProperties
            }
          />
        );
      })}

      {/* 상단 헤더 및 통제 패널 */}
      <div className="flex justify-between items-center bg-obsidian-card p-4 rounded-xl border border-obsidian-border flex-wrap gap-3 glass-panel">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-electric-cyan font-sans">
            <Cpu className="w-5 h-5 text-electric-cyan" /> Maru Company 24시간 가상 사무실
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            대표이사 Jay와 9명의 에이전트 요원들이 로컬에서 협업하며 24시간 오프라인 작동하는 자율 회사 모델
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-obsidian/60 px-3 py-1.5 rounded-lg border border-obsidian-border">
            <span className="text-sm text-gray-400">24H 자율 사이클</span>
            <button
              onClick={() => {
                setAutoCycle(!autoCycle);
                addLog(`자율 사이클 운영 모드가 ${!autoCycle ? '활성화' : '비활성화'} 되었습니다.`);
              }}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ${
                autoCycle ? 'bg-emerald-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  autoCycle ? 'transform translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => triggerMeeting('종합 비즈니스 매출 성과 & 1인 기업 확장 회의')}
            disabled={isMeeting}
            className="px-4 py-2 bg-electric-violet hover:bg-violet-600 disabled:bg-gray-700 transition rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.4)]"
          >
            <Play className="w-3.5 h-3.5" /> 미션 소집 (Dispatch)
          </button>

          <button
            onClick={resetOffice}
            className="p-2 bg-obsidian-border hover:bg-gray-700 transition rounded-lg"
            title="레이아웃 리셋"
          >
            <RotateCcw className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      {/* 메인 사무실 플로어 */}
      <div className="flex-1 flex gap-4 min-h-[480px]">
        <div
          ref={officeRef}
          className="flex-1 bg-slate-950/80 rounded-2xl relative border border-obsidian-border overflow-hidden glass-panel"
          style={{
            backgroundImage: 'radial-gradient(rgba(31, 41, 55, 0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <div className="absolute top-[52%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-20 rounded-full bg-slate-900 border-2 border-electric-cyan/40 shadow-[0_0_30px_rgba(0,240,255,0.15)] flex flex-col justify-center items-center z-10">
            <span className="text-[10px] text-electric-cyan/80 font-mono tracking-widest">CONFERENCE</span>
            <div className="flex gap-1 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isMeeting ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
              <span className="text-[9px] text-gray-400 font-mono">{isMeeting ? 'BUSY' : 'READY'}</span>
            </div>
          </div>

          {agents.map((agent) => {
            const hasChatter = !!activeChatter[agent.id];
            return (
              <div
                key={agent.id}
                className="absolute transition-all duration-1000 ease-out z-20"
                style={{
                  left: `${agent.x}%`,
                  top: `${agent.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {hasChatter && (
                  <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-48 bg-obsidian-card border border-electric-cyan/40 px-3 py-2 rounded-xl text-xs leading-relaxed text-gray-200 shadow-[0_4px_20px_rgba(0,240,255,0.15)] z-30 after:content-[''] after:absolute after:top-full after:left-1/2 after:transform after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-obsidian-card">
                    {activeChatter[agent.id]}
                  </div>
                )}

                <div className="flex flex-col items-center group cursor-pointer">
                  <span className="text-[11px] bg-slate-900/90 text-gray-300 border border-slate-800 px-1.5 py-0.5 rounded-md mb-1 shadow font-mono max-w-[80px] truncate">
                    {agent.name}
                  </span>

                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center relative transition-transform duration-300 hover:scale-110 ${
                      agent.status === 'working'
                        ? 'border-2 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                        : agent.status === 'meeting'
                        ? 'border-2 border-electric-cyan shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                        : 'border border-slate-700 bg-slate-900'
                    }`}
                  >
                    <span className="text-2xl select-none">{agent.emoji}</span>

                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${
                        agent.status === 'working'
                          ? 'bg-emerald-500'
                          : agent.status === 'meeting'
                          ? 'bg-electric-cyan animate-ping'
                          : 'bg-gray-600'
                      }`}
                    />
                  </div>

                  <span className="text-[8px] text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 px-1 rounded absolute top-full mt-1 z-40 whitespace-nowrap">
                    {agent.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 회사 실시간 작동 로그 패널 */}
        <div className="w-80 bg-obsidian-card rounded-2xl border border-obsidian-border p-4 flex flex-col glass-panel max-h-[500px]">
          <div className="flex items-center justify-between border-b border-obsidian-border pb-2.5 mb-3 font-sans">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-electric-cyan" />
              <h3 className="text-sm font-bold text-gray-200">회사 라이브 활동 로그</h3>
            </div>
            
            <span className="text-[10px] font-mono text-gray-400">
              {dbSync ? '🛢️ DB-First Active' : '임시 세션'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs leading-relaxed text-gray-300">
            {statusLog.map((log, index) => {
              const isSystem = log.includes('[System]');
              const isDispatch = log.includes('DISPATCH');
              return (
                <div
                  key={index}
                  className={`p-2 rounded-lg border transition ${
                    isDispatch
                      ? 'bg-red-950/20 border-red-500/20 text-red-400'
                      : isSystem
                      ? 'bg-slate-900/50 border-slate-800/50 text-electric-cyan/90'
                      : 'bg-obsidian/40 border-obsidian-border text-gray-300'
                  }`}
                >
                  {log}
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-obsidian-border flex items-center justify-between text-xs text-gray-400 font-sans">
            <span className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-emerald-500" /> 요원 9명 대기중</span>
            <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-amber-500" /> 오프라인 모드</span>
          </div>
        </div>
      </div>

    </div>
  );
}
