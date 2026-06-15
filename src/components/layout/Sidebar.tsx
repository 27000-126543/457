import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShieldAlert, Zap, ClipboardCheck, History,
  FileBarChart, Search, ChevronLeft, ChevronRight, Globe
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

const navItems = [
  { path: '/dashboard', label: '风控仪表盘', icon: LayoutDashboard },
  { path: '/risk-monitor', label: '风险监控', icon: ShieldAlert },
  { path: '/emergency', label: '应急响应', icon: Zap },
  { path: '/approval', label: '审批管理', icon: ClipboardCheck },
  { path: '/analysis', label: '历史分析', icon: History },
  { path: '/reports', label: '日报中心', icon: FileBarChart },
  { path: '/query', label: '全链路查询', icon: Search },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-deep-bg/95 border-r border-deep-border/40 z-40 transition-all duration-300 flex flex-col ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex items-center gap-2 px-3 h-14 border-b border-deep-border/30">
        <Globe className="w-7 h-7 text-neon-cyan shrink-0" />
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-rajdhani font-bold text-white leading-tight">SupplyChain</h1>
            <p className="text-[10px] text-neon-cyan/70 font-rajdhani tracking-widest">RISK CONTROL</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
                  : 'text-steel hover:text-white hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <Icon className="w-4.5 h-4.5 shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium truncate">{label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-10 border-t border-deep-border/30 text-steel hover:text-neon-cyan transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}

export function TopBar() {
  const location = useLocation();
  const currentNav = navItems.find((n) => location.pathname.startsWith(n.path));

  return (
    <header className="h-12 bg-deep-bg/80 backdrop-blur-md border-b border-deep-border/30 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-dim">首页</span>
        <span className="text-slate-dim">/</span>
        <span className="text-white font-medium">{currentNav?.label ?? '风控仪表盘'}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-steel">
          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
          实时监控中
        </div>
        <div className="text-xs text-slate-dim font-mono">
          {new Date().toLocaleDateString('zh-CN')}
        </div>
      </div>
    </header>
  );
}
