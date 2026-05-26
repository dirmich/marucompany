import { useState } from 'react';
import VirtualOffice from './components/office/VirtualOffice';
import CooperativeChat from './components/chat/CooperativeChat';
import RevenueDashboard from './components/dashboard/RevenueDashboard';
import ConnectionsPanel from './components/settings/ConnectionsPanel';
import { Cpu, MessageSquare, LineChart, Sliders, Terminal, ShieldAlert } from 'lucide-react';

type Tab = 'office' | 'chat' | 'dashboard' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('office');

  return (
    <div className="flex h-screen bg-[#0B0F19] text-gray-100 overflow-hidden font-sans select-none">
      
      {/* 1. 슬릭 옵시디언 다크 사이드바 네비게이션 */}
      <aside className="w-64 bg-slate-950/70 border-r border-obsidian-border flex flex-col justify-between p-4 shrink-0 glass-panel">
        <div className="space-y-6">
          {/* 로고 & 브랜딩 */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-electric-cyan to-electric-violet flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)]">
              <span className="text-xl">🏢</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-widest text-white font-sans uppercase">Maru Company</span>
              <span className="text-[9px] text-electric-cyan font-mono tracking-wider font-bold">STANDALONE V2.0</span>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-obsidian-border" />

          {/* 메뉴 탭 리스트 */}
          <nav className="space-y-1.5 font-sans">
            <button
              onClick={() => setActiveTab('office')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition duration-300 ${
                activeTab === 'office'
                  ? 'bg-electric-cyan/10 border border-electric-cyan/30 text-electric-cyan shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                  : 'border border-transparent hover:bg-slate-900/60 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>🏢 가상 사무실 (Office)</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition duration-300 ${
                activeTab === 'chat'
                  ? 'bg-electric-cyan/10 border border-electric-cyan/30 text-electric-cyan shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                  : 'border border-transparent hover:bg-slate-900/60 text-gray-400 hover:text-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>💬 AI 전략 협업실 (Chat)</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition duration-300 ${
                activeTab === 'dashboard'
                  ? 'bg-electric-cyan/10 border border-electric-cyan/30 text-electric-cyan shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                  : 'border border-transparent hover:bg-slate-900/60 text-gray-400 hover:text-gray-200'
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>💰 매출 대시보드 (Sales)</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition duration-300 ${
                activeTab === 'settings'
                  ? 'bg-electric-cyan/10 border border-electric-cyan/30 text-electric-cyan shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                  : 'border border-transparent hover:bg-slate-900/60 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>⚙️ 외부 연결 설정 (Config)</span>
            </button>
          </nav>
        </div>

        {/* 하단 시스템 보안 요약 정보 */}
        <div className="bg-obsidian/60 p-3 rounded-xl border border-obsidian-border text-[9px] font-mono leading-relaxed space-y-1">
          <div className="flex items-center gap-1 text-gray-400">
            <Terminal className="w-3 h-3 text-electric-cyan" />
            <span>Node: Local Inference</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <ShieldAlert className="w-3 h-3 text-emerald-500" />
            <span>Security: 100% Offline</span>
          </div>
          <p className="text-gray-500 mt-1 pt-1 border-t border-slate-900 text-[8px] text-center select-none">
            Designed for Antigravity & A.U
          </p>
        </div>
      </aside>

      {/* 2. 메인 콘텐츠 뷰 영역 */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* 콘텐츠 컴포넌트 탭 렌더링 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'office' && <VirtualOffice />}
          {activeTab === 'chat' && <CooperativeChat />}
          {activeTab === 'dashboard' && <RevenueDashboard />}
          {activeTab === 'settings' && <ConnectionsPanel />}
        </div>
      </main>

    </div>
  );
}
