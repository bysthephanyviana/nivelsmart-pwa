import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ChevronLeft, Wifi, WifiOff, Settings, Bell, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const ReservatorioDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Polling Reference to clear interval on unmount
    const intervalRef = useRef(null);

    const fetchData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        else setRefreshing(true);

        try {
            // Using new Internal ID endpoint
            const response = await api.get(`/sensores/${id}`);
            // The API returns { ...sensor, data: { ...tuyaStatus } }
            // So we need to normalize it for the UI which expects flat structure
            const sensor = response.data;
            const uiData = {
                ...sensor,
                ...sensor.data, // Flatten Tuya data (nivel, online, etc)
                nome: sensor.nome
            };
            setData(uiData);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar dados do sensor.');
        } finally {
            if (!isBackground) setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Polling every 5 seconds
        intervalRef.current = setInterval(() => {
            fetchData(true);
        }, 5000);

        return () => clearInterval(intervalRef.current);
    }, [id]);

    if (loading && !data) return <div className="h-screen flex items-center justify-center p-8 text-gray-400">Carregando sensor...</div>;
    if (error && !data) return (
        <div className="p-8 text-center space-y-4">
            <p className="text-red-500">{error}</p>
            <button onClick={() => fetchData()} className="text-blue-600 underline">Tentar novamente</button>
        </div>
    );

    // Destructure clean data
    const { nivel, bomba, status, notificacao, online, ultima_atualizacao } = data;

    // Derived UI State
    const isCritical = status === 'CRITICO';
    const isLow = status === 'ATENCAO';
    const isFull = status === 'CHEIO';
    const isOffline = !online || status === 'OFFLINE';

    // Calculation for cylinder height animation
    // clamp between 5% and 100% for visual purposes
    const fillHeight = Math.min(Math.max(nivel, 5), 100);

    return (
        <div className="space-y-6">
            {/* Nav Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex items-center space-x-2">
                    <span className={clsx("flex h-3 w-3 rounded-full relative", online ? "bg-green-500" : "bg-red-500")}>
                        {online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                    </span>
                    <span className="text-sm font-medium text-gray-500">{online ? 'Online' : 'Offline'}</span>
                </div>
                <button onClick={() => fetchData(true)} className={clsx("p-2 text-gray-400 hover:text-blue-600 transition-colors", refreshing && "animate-spin")}>
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Main Gauge Widget */}
            <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col items-center overflow-hidden">
                {/* Visual Cylinder */}
                <div className="relative w-48 h-64 bg-gray-100 rounded-full border-4 border-gray-200 overflow-hidden shadow-inner">
                    {/* Water Level */}
                    <div
                        className={clsx(
                            "absolute bottom-0 w-full transition-all duration-1000 ease-in-out",
                            isCritical ? 'bg-gradient-to-t from-red-600 to-red-400' :
                                isLow ? 'bg-gradient-to-t from-yellow-500 to-yellow-300' :
                                    'bg-gradient-to-t from-blue-600 to-cyan-400'
                        )}
                        style={{ height: `${fillHeight}%` }}
                    >
                        {/* Wave animation overlay */}
                        <div className="w-full h-full opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAwIDEyMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMGwzMDAgMTAwIDMwMC0xMDAgMzAwIDEwMCAzMDAtMTAwVjEyMEgwWiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9Ii4xIi8+PC9zdmc+')] bg-repeat-x bg-[length:200%_auto] animate-[wave_4s_linear_infinite]" />
                    </div>

                    {/* Percentage Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-4xl font-black text-white drop-shadow-md z-10">{nivel}%</span>
                    </div>
                </div>

                {/* Info Text */}
                <div className="mt-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">{bomba ? 'Bomba Ligada' : 'Bomba Desligada'}</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Atualizado: {new Date(ultima_atualizacao).toLocaleTimeString()}
                    </p>
                </div>

                {/* Status Badge */}
                <div className={clsx(
                    "mt-4 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm",
                    isCritical || isOffline ? "bg-red-100 text-red-700" :
                        isLow ? "bg-yellow-100 text-yellow-700" :
                            "bg-green-100 text-green-700"
                )}>
                    {status}
                </div>
            </div>

            {/* Notifications / Alerts */}
            {notificacao && notificacao.ativo && (
                <div className={clsx(
                    "p-4 rounded-xl border-l-4 shadow-sm flex items-start space-x-3",
                    notificacao.tipo === 'ALERT_CRITICAL' ? "bg-red-50 border-red-500 text-red-800" :
                        notificacao.tipo === 'ALERT_LOW_LEVEL' ? "bg-orange-50 border-orange-500 text-orange-800" :
                            "bg-blue-50 border-blue-500 text-blue-800"
                )}>
                    <Bell className="shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-sm">{notificacao.titulo}</h4>
                        <p className="text-sm opacity-90">{notificacao.mensagem}</p>
                    </div>
                </div>
            )}

            {/* Additional Info Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Modo</p>
                    <p className="font-semibold text-gray-800 mt-1 capitalize">{data.modo_operacao || 'Automático'}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Sinal</p>
                    <div className="flex justify-center mt-1 text-gray-800">
                        {online ? <Wifi size={20} className="text-green-500" /> : <WifiOff size={20} className="text-red-500" />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservatorioDetail;
