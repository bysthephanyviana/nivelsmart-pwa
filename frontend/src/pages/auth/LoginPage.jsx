
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Droplet, Mail, Lock, User, ArrowRight, Loader } from 'lucide-react';
import Button from '../../components/ui/Button';

const LoginPage = () => {
    // Modes: 'login', 'register', 'forgot'
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({ email: '', senha: '', nome: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'login') {
                await login(formData.email, formData.senha);
                navigate('/dashboard');
            } else if (mode === 'register') {
                await api.post('/auth/register', {
                    nome: formData.nome,
                    email: formData.email,
                    senha: formData.senha
                });
                alert('Cadastro realizado! Faça login.');
                setMode('login');
            } else if (mode === 'forgot') {
                await api.post('/auth/forgot-password', { email: formData.email });
                alert('Se o email existir, enviaremos um link (verifique o console do backend).');
                setMode('login');
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erro na operação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-800 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-md">

                {/* Logo Area */}
                <div className="text-center mb-8">
                    <div className="bg-gradient-to-tr from-cyan-400 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                        <Droplet size={32} className="text-white fill-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">NivelSmart</h1>
                    <p className="text-blue-200 mt-2 text-sm">Monitoramento Inteligente de Água</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Name Field (Register Only) */}
                    {mode === 'register' && (
                        <div className="relative group">
                            <User className="absolute left-3 top-3.5 text-blue-200/50 group-focus-within:text-cyan-400 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Seu Nome Completo"
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all hover:bg-black/30"
                                value={formData.nome}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    {/* Email Field */}
                    <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 text-blue-200/50 group-focus-within:text-cyan-400 transition-colors" size={20} />
                        <input
                            type="email"
                            placeholder="seu@email.com"
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all hover:bg-black/30"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    {/* Password Field (Not for Forgot Mode) */}
                    {mode !== 'forgot' && (
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="password"
                                placeholder="Sua Senha"
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={formData.senha}
                                onChange={e => setFormData({ ...formData, senha: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            loading={loading}
                            className="w-full"
                        >
                            {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar Conta' : 'Recuperar Senha'}
                        </Button>
                    </div>
                </form>

                {/* Footer Links */}
                <div className="mt-6 text-center space-y-2 text-sm">
                    {mode === 'login' && (
                        <>
                            <p className="text-blue-200">
                                Não tem conta?{' '}
                                <button onClick={() => setMode('register')} className="text-cyan-300 font-semibold hover:text-white hover:underline transition-colors">
                                    Cadastre-se
                                </button>
                            </p>
                            <button onClick={() => setMode('forgot')} className="text-blue-300/80 hover:text-white text-xs hover:underline transition-colors block mx-auto mt-2">
                                Esqueci minha senha
                            </button>
                        </>
                    )}

                    {mode === 'register' && (
                        <p className="text-blue-200">
                            Já tem conta?{' '}
                            <button onClick={() => setMode('login')} className="text-cyan-300 font-semibold hover:text-white hover:underline transition-colors">
                                Fazer Login
                            </button>
                        </p>
                    )}

                    {mode === 'forgot' && (
                        <button onClick={() => setMode('login')} className="text-blue-300 hover:text-white hover:underline transition-colors">
                            Voltar para Login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
