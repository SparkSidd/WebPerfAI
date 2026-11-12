import { LayoutDashboard, History, FileText, LogOut, Activity, Search, Zap, Code, Shield, Download } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="w-64 border-r border-dark-border bg-dark-bg h-screen flex flex-col p-6 sticky top-0">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_15px_rgba(188,19,254,0.4)]">
          <Activity size={24} color="white" />
        </div>
        <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">OptiWeb AI</h1>
      </div>

      <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 px-3">Analysis</div>
      <nav className="flex flex-col gap-1 flex-grow">
        <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" to="/dashboard" active={location.pathname === '/dashboard'} />
        <SidebarItem icon={<Shield size={20} />} label="Deep Analysis" to="/deep" active={location.pathname === '/deep'} badge="NEW" />
        <SidebarItem icon={<Activity size={20} />} label="Compare" to="/compare" active={location.pathname === '/compare'} />
        <SidebarItem icon={<Search size={20} />} label="Research" to="/research" active={location.pathname === '/research'} />

        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-6 mb-2 px-3">Optimization</div>
        <SidebarItem icon={<Zap size={20} />} label="Image Optimizer" to="/images" active={location.pathname === '/images'} />
        <SidebarItem icon={<Code size={20} />} label="Code Laboratory" to="/code" active={location.pathname === '/code'} />

        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-6 mb-2 px-3">Reports</div>
        <SidebarItem icon={<FileText size={20} />} label="My Reports" to="/reports" active={location.pathname === '/reports'} />
        <SidebarItem icon={<History size={20} />} label="History" to="/history" active={location.pathname === '/history'} />
      </nav>

      <div className="mt-auto pt-4 border-t border-dark-border">
        <div className="flex items-center gap-3 p-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold">U</div>
          <div>
            <p className="text-sm font-bold text-gray-300">Pro Plan</p>
            <p className="text-[10px] text-gray-600">v2.0.0</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors p-3 rounded-xl w-full text-left hover:bg-red-500/10">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, to, active = false, badge }: { icon: React.ReactNode, label: string, to: string, active?: boolean, badge?: string }) => {
  return (
    <Link to={to} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${active ? 'bg-gradient-to-r from-neon-blue/10 to-transparent text-neon-blue border border-neon-blue/20 shadow-[inset_2px_0_0_rgba(0,243,255,1)]' : 'text-gray-400 hover:text-white hover:bg-dark-card'}`}>
      {icon}
      <span className="font-medium flex-1">{label}</span>
      {badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple font-bold">{badge}</span>}
    </Link>
  );
};

export default Sidebar;
