import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { getParentPath, getPageTitle } from '../utils/navigation';

const AppLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const { logout } = useAuth();

    // Logic to determine if Back button should be shown
    const showBackButton = location.pathname !== '/dashboard' && location.pathname !== '/condominios' && location.pathname !== '/';

    // Smart Back Navigation
    const handleBack = () => {
        // Use browser back to avoid "double back" history loops
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            // Fallback for direct links / fresh tabs
            const parentPath = getParentPath(location, params);
            navigate(parentPath);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-800">

            {/* ================= DESKTOP LAYOUT (lg+) ================= */}
            <div className="hidden lg:flex w-full bg-slate-50">
                <Sidebar />
                <main className="flex-1 overflow-y-auto h-screen scroll-smooth text-text-primary">
                    {/* Main Content Container - SaaS Standard Width */}
                    <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                        {/* Back Button */}
                        {showBackButton && (
                            <div className="mb-0">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center space-x-2 text-text-secondary hover:text-brand-dark transition-colors group px-3 py-2 rounded-btn hover:bg-white/50"
                                >
                                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                                    <span className="font-medium">Voltar</span>
                                </button>
                            </div>
                        )}
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* ================= MOBILE LAYOUT (Default < lg) ================= */}
            <div className="lg:hidden w-full min-h-screen bg-scaffold flex flex-col">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm shrink-0">
                    <div className="flex items-center">
                        {showBackButton ? (
                            <button
                                onClick={handleBack}
                                className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors active:scale-95"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        ) : (
                            <div className="w-10" />
                        )}
                    </div>

                    <div className="flex flex-col items-center">
                        <img
                            src="/logo.png"
                            alt="NivelSmart"
                            className="h-6 mb-0.5 object-contain"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                        <h1 className="font-bold text-[10px] text-brand-900 tracking-tight uppercase opacity-60 leading-none">
                            {getPageTitle(location.pathname)}
                        </h1>
                    </div>

                    <div className="flex items-center justify-end w-10">
                        {!showBackButton ? (
                            <button
                                onClick={() => navigate('/perfil')}
                                className="p-2 -mr-2 text-slate-400 hover:text-brand-600 rounded-full transition-colors"
                            >
                                <UserCircle size={24} />
                            </button>
                        ) : (
                            <div className="w-6" />
                        )}
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-scaffold">
                    <div className="pb- Safe-Area-Inset-Bottom">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
