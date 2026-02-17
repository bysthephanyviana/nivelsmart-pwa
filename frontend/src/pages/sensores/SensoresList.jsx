import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Wifi, Plus, Edit2, Signal, Trash2 } from 'lucide-react';

const SensoresList = () => {
    const [sensores, setSensores] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSensores();
    }, []);

    const fetchSensores = async () => {
        try {
            const response = await api.get('/sensores/meus-sensores');
            setSensores(response.data);
        } catch (error) {
            console.error('Erro ao buscar sensores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir este sensor?")) return;
        try {
            await api.delete(`/sensores/${id}`);
            setSensores(sensores.filter(s => s.id !== id));
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir sensor.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando dispositivos...</div>;

    return (
        <div className="space-y-6 pb-24 relative">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Meus Dispositivos</h2>
                    <p className="text-gray-500">Gerencie seus sensores Tuya.</p>
                </div>
                {/* Reusing existing AddSensorPage but navigating via route */}
                <button
                    onClick={() => navigate('/sensores/novo')}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 px-4"
                >
                    <span className="font-bold text-xl">+</span>
                    <span className="hidden sm:inline font-medium">Vincular Novo</span>
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {sensores.map((sensor) => (
                    <div key={sensor.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group">
                        <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-2xl ${sensor.online ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Wifi size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{sensor.nome}</h3>
                                <div className="text-xs text-gray-400 font-mono mt-0.5 max-w-[150px] truncate" title={sensor.devId}>
                                    ID: {sensor.devId}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${sensor.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    <span className="text-xs text-gray-500">{sensor.online ? 'Online' : 'Offline'}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(`/sensores/editar/${sensor.id}`, { state: { sensor } })}
                            className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <Edit2 size={20} />
                        </button>

                        <button
                            onClick={() => handleDelete(sensor.id)}
                            className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir Sensor"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}

                {sensores.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        <Signal size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Nenhum sensor vinculado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SensoresList;
