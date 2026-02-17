import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, LogOut, Camera, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const ProfilePage = () => {
    const { user, updateUser, updateAvatar, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '', // Optional new password
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                nome: user.nome || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Filter out empty password if not changing
            const payload = { ...formData };
            if (!payload.senha) delete payload.senha;

            await updateUser(payload);
            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Erro ao atualizar perfil.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoading(true);
            await updateAvatar(file);
            toast.success('Foto de perfil atualizada!');
        } catch (error) {
            toast.error('Erro ao atualizar foto.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get avatar URL (handles relative/absolute)
    const getAvatarUrl = (user) => {
        if (!user?.foto_url) return null;
        if (user.foto_url.startsWith('http')) return user.foto_url;
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        return `${baseUrl}${user.foto_url}`;
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meu Perfil</h1>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-100">
                        <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input').click()}>

                            {user?.foto_url ? (
                                <img
                                    src={getAvatarUrl(user)}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center border-4 border-white shadow-sm text-blue-600 transition-transform group-hover:scale-105">
                                    <User size={40} />
                                </div>
                            )}

                            <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors z-10">
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                            </div>

                            <input
                                id="avatar-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                                disabled={loading}
                            />
                        </div>
                        <h2 className="mt-4 text-xl font-bold text-slate-900">{user?.nome}</h2>
                        <span className="text-sm text-slate-400 font-medium capitalize">{user?.role || 'Usuário'}</span>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div className="grid gap-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-gray-800"
                                    placeholder="Seu nome"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-gray-800"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Nova Senha <span className="text-gray-400 font-normal">(Opcional)</span></label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    name="senha"
                                    value={formData.senha}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-gray-800"
                                    placeholder="Deixe em branco para manter a atual"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            icon={loading ? Loader2 : Save}
                            className={loading ? "opacity-80" : ""}
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </Card>

            <div className="flex justify-center">
                <button
                    onClick={handleLogout}
                    className="text-red-500 hover:text-red-600 font-semibold text-sm flex items-center space-x-2 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <LogOut size={16} />
                    <span>Sair da minha conta</span>
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
