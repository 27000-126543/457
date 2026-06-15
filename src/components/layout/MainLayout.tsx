import { Outlet } from 'react-router-dom';
import Sidebar, { TopBar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/stores/appStore';

export default function MainLayout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-deep-bg">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-56'
        }`}
      >
        <TopBar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
