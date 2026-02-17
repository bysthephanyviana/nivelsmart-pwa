import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Cylinder, ChevronRight, Droplet, Edit2, Plus, Signal, History } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import clsx from 'clsx';

const ReservatoriosPage = () => {
    const { id } = useParams(); // condominioId
    const [reservatorios, setReservatorios] = useState([]);
    const [sensorsMap, setSensorsMap] = useState({}); // Map reservatorio_id -> sensor
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch Reservoirs and Sensors (Note: ideally backend should filter sensors by condo)
                const [resRes, sensorsRes] = await Promise.all([
                    api.get(`/reservatorios/${id}`),
                    api.get('/sensores/meus-sensores')
                ]);

                setReservatorios(resRes.data);
                const allSensors = sensorsRes.data;

                // Map Sensors to Reservoirs
                const sensorsMapping = {};
                if (allSensors && allSensors.length > 0) {
                    allSensors.forEach(sensor => {
                        // Filter sensors relevant to these reservoirs (Frontend Side Filtering for now)
                        if (resRes.data.some(r => r.id === sensor.reservatorio_id)) {
                            if (!sensorsMapping[sensor.reservatorio_id]) {
                                sensorsMapping[sensor.reservatorio_id] = [];
                            }
                            const sensorObj = {
                                ...sensor,
                                ...(sensor.status_data || {})
                            };
                            sensorsMapping[sensor.reservatorio_id].push(sensorObj);
                        }
                    });
                }
                setSensorsMap(sensorsMapping);

            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                toast.error('Erro ao carregar dados. Verifique sua conexão.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const getStatusBadge = (level) => {
        if (level === undefined || level === null) return <Badge variant="neutral">Sem Dados</Badge>;
        if (level < 25) return <Badge variant="error" className="animate-pulse">Crítico {level}%</Badge>;
        if (level < 50) return <Badge variant="warning">Atenção {level}%</Badge>;
        return <Badge variant="success">Normal {level}%</Badge>;
    };

    // Quick Link Modal State
    const [linkingResId, setLinkingResId] = useState(null);
    const [quickSensor, setQuickSensor] = useState({ devId: '', nome: 'Sensor Nível' });

    const handleQuickLink = async () => {
        if (!quickSensor.devId) return toast.error('Informe o ID do Sensor (DevID)');

        try {
            await api.post('/sensores/vincular', {
                reservatorio_id: linkingResId,
                devId: quickSensor.devId,
                nome: quickSensor.nome
            });
            toast.success('Sensor vinculado com sucesso!');
            setLinkingResId(null);
            setQuickSensor({ devId: '', nome: 'Sensor Nível' });
            // Refresh
            navigate(0);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Erro ao vincular');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reservatórios</h1>
                    <p className="text-slate-500 mt-1">Monitore o nível de água e status dos sensores.</p>
                </div>
                <Button
                    onClick={() => navigate(`/reservatorios/novo?condominioId=${id}`)}
                    icon={Plus}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                    Novo Reservatório
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
                {reservatorios.map((res) => {
                    const resSensors = sensorsMap[res.id] || [];
                    const hasSensors = resSensors.length > 0;

                    return (
                        <Card key={res.id} className="flex flex-col h-full relative group overflow-hidden hover:ring-1 hover:ring-blue-200 transition-all duration-300">
                            {/* Decorative Top Border */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>

                            {/* Header */}
                            <div
                                className={clsx(
                                    "flex items-start justify-between mb-4",
                                    hasSensors && "cursor-pointer"
                                )}
                                onClick={() => {
                                    if (resSensors.length === 1) {
                                        navigate(`/sensor/${resSensors[0].id}`);
                                    }
                                }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                        <Cylinder size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{res.nome}</h3>
                                        <div className="flex items-center text-xs text-slate-500 font-medium">
                                            <Droplet size={12} className="mr-1 text-blue-400" />
                                            {res.capacidade_litros} Litros
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/reservatorios/editar/${res.id}?condominioId=${id}`, { state: { reservatorio: res } });
                                    }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </div>

                            {/* Divider with Label */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sensores Vinculados</span>
                                <div className="h-px bg-slate-100 flex-1"></div>
                            </div>

                            {/* Sensors List */}
                            <div className="space-y-2 flex-1">
                                {hasSensors ? (
                                    resSensors.map(sensor => (
                                        <div
                                            key={sensor.id}
                                            onClick={() => navigate(`/sensor/${sensor.id}`)}
                                            className="group/sensor flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-all"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`relative`}>
                                                    <Signal size={16} className={sensor.online ? "text-emerald-500" : "text-slate-400"} />
                                                    {sensor.online && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 group-hover/sensor:text-blue-700">
                                                    {sensor.nome || 'Sensor #' + sensor.id.toString().slice(-4)}
                                                </span>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                {getStatusBadge(sensor.nivel)}
                                                <ChevronRight size={16} className="text-slate-300 group-hover/sensor:text-blue-400" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                        <div className="inline-flex p-2 bg-slate-100 rounded-full mb-2">
                                            <Signal size={16} className="text-slate-400" />
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">Nenhum sensor vinculado</p>
                                        <button
                                            onClick={() => setLinkingResId(res.id)}
                                            className="text-xs text-blue-600 font-bold mt-2 hover:underline"
                                        >
                                            Vincular agora
                                        </button>
                                    </div>
                                )}
                            </div>

                        </Card>
                    );
                })}

                {reservatorios.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 col-span-full">
                        <Cylinder className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhum reservatório encontrado</h3>
                        <p className="mt-1 text-gray-500">Adicione o primeiro reservatório deste condomínio.</p>
                        <div className="mt-6">
                            <Button onClick={() => navigate(`/reservatorios/novo?condominioId=${id}`)} variant="secondary">
                                Adicionar Reservatório
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Link Modal */}
            {linkingResId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4 transform scale-100">
                        <h3 className="text-lg font-bold text-slate-900">Vincular Sensor</h3>
                        <p className="text-sm text-slate-500">Digite o código do dispositivo Tuya (DevID) para vincular a este reservatório.</p>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase">DevID (Código)</label>
                                <input
                                    value={quickSensor.devId}
                                    onChange={e => setQuickSensor({ ...quickSensor, devId: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-sm"
                                    placeholder="Ex: bf81..."
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase">Nome do Sensor</label>
                                <input
                                    value={quickSensor.nome}
                                    onChange={e => setQuickSensor({ ...quickSensor, nome: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                    placeholder="Ex: Sensor Nível"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" size="sm" onClick={() => setLinkingResId(null)}>Cancelar</Button>
                            <Button className="bg-blue-600 text-white" size="sm" onClick={handleQuickLink}>Vincular</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservatoriosPage;
