import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, LogOut, PlusCircle, Building2, ChevronDown, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const user = useAuth().user;
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [imgError, setImgError] = useState(false);

    const menuItems = [
        { path: '/dashboard', label: 'Condomínios', icon: LayoutDashboard },
        { path: '/condominios/novo', label: 'Novo Condomínio', icon: PlusCircle },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="hidden lg:flex flex-col w-64 bg-white h-screen sticky top-0 z-50 border-r border-slate-200">
            {/* 1. Logo Area */}
            <div className="h-16 flex items-center px-5 border-b border-slate-50 bg-white shrink-0">
                <div className="flex items-center space-x-2">
                    <img
                        src="/logo.png"
                        alt="NivelSmart"
                        className="h-7 w-auto object-contain opacity-90"
                        onError={(e) => e.target.style.display = 'none'}
                    />
                    <span className="font-bold text-lg text-slate-900 tracking-tight">NivelSmart</span>
                </div>
            </div>

            {/* 2. Profile Block (Interactive) */}
            <div className="px-3 py-4 border-b border-slate-100 relative">
                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={clsx(
                        "w-full flex items-center p-2 rounded-xl transition-all duration-200 group text-left",
                        isProfileOpen ? "bg-slate-50 ring-1 ring-slate-200" : "hover:bg-slate-50"
                    )}
                >
                    {/* Foto Circular 40-48px */}
                    <div className="relative shrink-0">
                        {user?.foto_url && !imgError ? (
                            <img
                                src={user.foto_url}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 ring-2 ring-white shadow-sm">
                                <span className="font-bold text-sm">{user?.nome?.charAt(0).toUpperCase() || 'U'}</span>
                            </div>
                        )}
                        {/* Status Indicator inside Photo area or text area? Request said "close to name". Keeping it simpler here. */}
                    </div>

                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                            {user?.nome || 'Usuário'}
                        </p>
                        <div className="flex items-center mt-0.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                            <span className="text-xs text-slate-500 font-medium">Online</span>
                        </div>
                    </div>

                    <ChevronDown size={14} className={clsx("text-slate-400 transition-transform duration-200 ml-2", isProfileOpen && "rotate-180")} />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                    <div className="absolute top-full left-3 right-3 mt-1 bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="py-1">
                            <button
                                onClick={() => { navigate('/perfil'); setIsProfileOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center transition-colors"
                            >
                                <User size={16} className="mr-2" />
                                Meu Perfil
                            </button>
                            <button
                                disabled // Placeholder as requested "Configurações"
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-400 flex items-center cursor-not-allowed"
                            >
                                <Settings size={16} className="mr-2" />
                                Configurações
                            </button>
                            <div className="h-px bg-slate-50 my-1"></div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                            >
                                <LogOut size={16} className="mr-2" />
                                Sair
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 mt-6">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                        (item.path === '/dashboard' && location.pathname === '/condominios') ||
                        (item.path === '/dashboard' && location.pathname === '/');

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={clsx(
                                "flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                                isActive
                                    ? "bg-blue-50/60 text-blue-800"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            {/* Active Indicator: Left Border */}
                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-blue-600" />}

                            <Icon size={22} className={clsx(
                                "transition-transform ml-1",
                                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                            )} />
                            <span className="ml-1">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
            {/* Version / Legal */}
            <div className="p-4 border-t border-slate-50 text-center">
                <p className="text-[10px] text-slate-300 font-medium">NivelSmart v1.2</p>
            </div>
        </div>
    );
};

export default Sidebar;
