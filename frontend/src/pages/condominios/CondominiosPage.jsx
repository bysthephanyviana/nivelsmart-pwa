import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Building2, MapPin, ChevronRight, Activity, Droplets, Trash2, Edit2, AlertTriangle, Settings, MoreVertical } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import clsx from 'clsx';

const CondominiosPage = () => {
    const [condominios, setCondominios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCardId, setExpandedCardId] = useState(null); // For inline dropdown
    const navigate = useNavigate();

    useEffect(() => {
        fetchCondominios();
    }, []);

    const fetchCondominios = async () => {
        try {
            const response = await api.get('/condominios');
            setCondominios(response.data);
        } catch (error) {
            console.error('Erro ao buscar condomínios:', error);
            toast.error('Erro ao carregar seus imóveis');
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (e, condominio) => {
        e.preventDefault();
        const reservatorios = condominio.reservatorios || [];

        if (reservatorios.length === 0) {
            toast('Nenhum reservatório cadastrado neste condomínio.', { icon: 'ℹ️' });
            return;
        }

        // Smart Redirect Rule 1: Only 1 Reservoir
        if (reservatorios.length === 1) {
            const res = reservatorios[0];
            // Check sensors
            if (res.sensores && res.sensores.length === 1) {
                // Direct to specific sensor detail
                navigate(`/sensor/${res.sensores[0].id}`);
            } else {
                // Go to reservoir list (since it has 0 or >1 sensors, or just to be safe)
                // Actually, if it has 0 sensors, maybe go to Add Sensor? 
                // Let's stick to standard flow if distinct sensor not found
                navigate(`/condominio/${condominio.id}`);
            }
            return;
        }

        // Smart Redirect Rule 2: > 1 Reservoirs -> Inline Dropdown/Action
        // Toggle expansion
        setExpandedCardId(expandedCardId === condominio.id ? null : condominio.id);
    };

    const handleDelete = (e, id) => {
        e.stopPropagation(); // Avoid opening card details

        toast((t) => (
            <div className="flex flex-col gap-2 min-w-[200px]">
                <p className="font-medium text-slate-800 text-sm">Tem certeza que deseja excluir?</p>
                <div className="flex justify-end gap-2 mt-1">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="text-xs px-3 py-1.5 rounded-md text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await api.delete(`/condominios/${id}`);
                                setCondominios(prev => prev.filter(c => c.id !== id));
                                toast.success('Condomínio excluído com sucesso');
                            } catch (error) {
                                console.error("Erro ao excluir", error);
                                toast.error('Erro ao excluir condomínio');
                            }
                        }}
                        className="text-xs px-3 py-1.5 rounded-md text-white bg-red-500 hover:bg-red-600 transition-colors font-medium"
                    >
                        Excluir
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            position: 'top-center',
            style: {
                background: '#fff',
                color: '#333',
                fontFamily: 'sans-serif',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                padding: '16px',
                borderRadius: '12px',
            },
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Stats Calculations
    const stats = [
        { label: 'Total de Condomínios', value: condominios.length, icon: Building2 },
        { label: 'Monitoramento Ativo', value: condominios.reduce((acc, c) => acc + (c.reservatorios?.length || 0), 0), icon: Activity },
        { label: 'Alertas', value: 0, icon: AlertTriangle },
    ];

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Central de Monitoramento</h1>
                    <p className="text-slate-500 text-sm mt-1">Visão geral dos condomínios e níveis de água.</p>
                </div>
                <div>
                    <Button
                        onClick={() => navigate('/condominios/novo')}
                        icon={Plus}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5"
                    >
                        Novo Condomínio
                    </Button>
                </div>
            </div>

            {/* Metrics Overview - Compact & Flat */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
                            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-full text-slate-400">
                            <stat.icon size={20} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <Building2 size={18} className="mr-2 text-slate-400" />
                        Lista de Condomínios
                    </h2>
                </div>

                {condominios.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                        <div className="inline-flex p-3 bg-slate-50 rounded-full mb-3">
                            <Building2 className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="text-base font-medium text-slate-900">Nenhum imóvel encontrado</h3>
                        <div className="mt-4">
                            <Button onClick={() => navigate('/condominios/novo')} variant="outline" size="sm">
                                Cadastrar Imóvel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {condominios.map((condominio) => {
                            const hasReservoirs = condominio.reservatorios && condominio.reservatorios.length > 0;
                            const isExpanded = expandedCardId === condominio.id;

                            return (
                                <div
                                    key={condominio.id}
                                    onClick={(e) => handleCardClick(e, condominio)}
                                    className={clsx(
                                        "group bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden relative",
                                        isExpanded && "ring-2 ring-blue-400/50 shadow-lg"
                                    )}
                                >
                                    {/* Active Indicator */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    <div className="p-5 flex-1 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3 overflow-hidden flex-1">
                                                <div className="p-2 bg-slate-50 rounded-md text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shrink-0">
                                                    <Building2 size={20} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                                                            {condominio.nome}
                                                        </h3>
                                                        {hasReservoirs ? (
                                                            (() => {
                                                                // Check if ANY sensor is online
                                                                const sensors = condominio.reservatorios.flatMap(r => r.sensores || []);
                                                                const isAnyOnline = sensors.some(s => s.online);

                                                                return isAnyOnline ? (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                                                                        Monitorando
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100 shrink-0">
                                                                        Offline
                                                                    </span>
                                                                );
                                                            })()
                                                        ) : (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                                                                Sem Sensores
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-xs text-slate-500 mt-1 truncate">
                                                        <MapPin size={12} className="mr-1 text-slate-400" />
                                                        <span className="truncate">{condominio.endereco || 'Endereço não informado'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <button
                                                onClick={(e) => handleDelete(e, condominio.id)}
                                                className="p-1.5 ml-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                title="Excluir Imóvel"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                            {/* Actions Dropdown */}
                                            <div className="relative ml-1" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedCardId(expandedCardId === `menu-${condominio.id}` ? null : `menu-${condominio.id}`);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {expandedCardId === `menu-${condominio.id}` && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setExpandedCardId(null)}
                                                        ></div>
                                                        <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 animate-in fade-in zoom-in-95 duration-100">
                                                            <button
                                                                onClick={(e) => {
                                                                    setExpandedCardId(null);
                                                                    navigate(`/condominio/${condominio.id}`);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                                <Settings size={16} className="text-blue-500" />
                                                                Gerenciar Reservatórios
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    setExpandedCardId(null);
                                                                    navigate(`/condominios/editar/${condominio.id}`);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                                <Edit2 size={16} className="text-slate-500" />
                                                                Editar Imóvel
                                                            </button>
                                                            <div className="h-px bg-slate-100 my-1"></div>
                                                            <button
                                                                onClick={(e) => {
                                                                    setExpandedCardId(null);
                                                                    handleDelete(e, condominio.id);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                            >
                                                                <Trash2 size={16} />
                                                                Excluir
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mini Charts / Indicators (Part 2) */}
                                        {hasReservoirs && (
                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                {condominio.reservatorios.slice(0, 2).map(r => {
                                                    const sensor = r.sensores?.[0]; // Taking first sensor for preview
                                                    const level = sensor?.nivel || 0;
                                                    return (
                                                        <div key={r.id} className="bg-slate-50 rounded px-2 py-1.5 border border-slate-100 flex items-center justify-between">
                                                            <span className="text-[10px] font-medium text-slate-500 truncate max-w-[60px]" title={r.nome}>{r.nome}</span>
                                                            <div className="flex items-center space-x-1.5">
                                                                <div className="w-8 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={clsx("h-full rounded-full", level < 25 ? "bg-red-500" : "bg-blue-500")}
                                                                        style={{ width: `${level}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-700">{level}%</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {condominio.reservatorios.length > 2 && (
                                                    <div className="col-span-2 text-[10px] text-center text-slate-400">
                                                        +{condominio.reservatorios.length - 2} reservatórios
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Link / Quick Select */}
                                    <div className={clsx(
                                        "px-5 py-3 border-t  transition-colors",
                                        isExpanded ? "bg-blue-50/50 border-blue-200" : "bg-slate-50 border-slate-100 group-hover:bg-blue-50/10"
                                    )}>
                                        {isExpanded ? (
                                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                <p className="text-xs font-semibold text-blue-800 mb-2">Selecione o reservatório:</p>
                                                <div className="grid grid-cols-1 gap-1">
                                                    {condominio.reservatorios.map(r => (
                                                        <button
                                                            key={r.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Check sensors again for precise routing
                                                                if (r.sensores?.length === 1) {
                                                                    navigate(`/sensor/${r.sensores[0].id}`);
                                                                } else {
                                                                    // If weird state or multiple sensors, just go to standard reservoir view
                                                                    navigate(`/condominio/${condominio.id}`);
                                                                }
                                                            }}
                                                            className="flex items-center justify-between px-3 py-2 bg-white rounded border border-blue-100 hover:border-blue-300 hover:bg-blue-50 text-left transition-all"
                                                        >
                                                            <span className="text-xs font-medium text-slate-700">{r.nome}</span>
                                                            <ChevronRight size={12} className="text-blue-400" />
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/condominio/${condominio.id}`); }}
                                                        className="text-xs text-center text-blue-600 mt-1 hover:underline pt-1"
                                                    >
                                                        Ver todos os detalhes
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end">
                                                <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center">
                                                    {hasReservoirs ? (condominio.reservatorios.length === 1 ? 'Acessar Monitoramento' : `Ver ${condominio.reservatorios.length} Reservatórios`) : 'Gerenciar'}
                                                    <ChevronRight size={14} className="ml-1" />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CondominiosPage;
