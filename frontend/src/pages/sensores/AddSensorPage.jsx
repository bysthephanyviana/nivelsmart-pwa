import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Save, Building, Cylinder, Cpu } from 'lucide-react';

const AddSensorPage = () => {
    const navigate = useNavigate();

    // Data States
    const [condominios, setCondominios] = useState([]);
    const [reservatorios, setReservatorios] = useState([]);

    // Form States
    const [selectedCondo, setSelectedCondo] = useState('');
    const [selectedRes, setSelectedRes] = useState('');
    const [nome, setNome] = useState('');
    const [devId, setDevId] = useState('');

    // UI States
    const [loading, setLoading] = useState(false);
    const [fetchingRes, setFetchingRes] = useState(false);

    // 1. Fetch Condominios on Mount
    useEffect(() => {
        const fetchCondominios = async () => {
            try {
                const res = await api.get('/condominios'); // Assuming this lists all for admin/user
                setCondominios(res.data);
            } catch (error) {
                console.error("Erro ao buscar condomínios", error);
                alert("Erro ao carregar lista de condomínios.");
            }
        };
        fetchCondominios();
    }, []);

    // 2. Fetch Reservatorios when Condo changes
    useEffect(() => {
        if (!selectedCondo) {
            setReservatorios([]);
            return;
        }

        const fetchReservatorios = async () => {
            setFetchingRes(true);
            try {
                const res = await api.get(`/reservatorios/${selectedCondo}`);
                setReservatorios(res.data);
            } catch (error) {
                console.error("Erro ao buscar reservatórios", error);
            } finally {
                setFetchingRes(false);
            }
        };

        fetchReservatorios();
    }, [selectedCondo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRes || !devId || !nome) return;

        setLoading(true);
        try {
            await api.post('/sensores/vincular', {
                reservatorio_id: selectedRes,
                devId,
                nome
            });
            alert('Sensor vinculado com sucesso!');
            navigate('/dashboard'); // Return to dashboard
        } catch (error) {
            console.error(error);
            const messages = error.response?.data?.errors || [error.response?.data?.message || 'Erro ao vincular sensor.'];
            alert(messages.join('\n'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Cpu className="mr-2 text-blue-600" />
                Vincular Novo Sensor
            </h2>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">

                {/* Condominio Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center">
                        <Building size={16} className="mr-1" /> Condomínio
                    </label>
                    <select
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                        value={selectedCondo}
                        onChange={(e) => {
                            setSelectedCondo(e.target.value);
                            setSelectedRes(''); // Reset res
                        }}
                        required
                    >
                        <option value="">Selecione um Condomínio...</option>
                        {condominios.map(c => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                    </select>
                </div>

                {/* Reservatorio Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center">
                        <Cylinder size={16} className="mr-1" /> Reservatório
                    </label>
                    <select
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none bg-white disabled:bg-gray-50"
                        value={selectedRes}
                        onChange={(e) => setSelectedRes(e.target.value)}
                        required
                        disabled={!selectedCondo}
                    >
                        <option value="">
                            {fetchingRes ? 'Carregando...' : 'Selecione um Reservatório...'}
                        </option>
                        {reservatorios.map(r => (
                            <option key={r.id} value={r.id}>{r.nome}</option>
                        ))}
                    </select>
                </div>

                {/* Nome */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nome do Sensor</label>
                    <input
                        type="text"
                        placeholder="Ex: Sensor Principal"
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        required
                    />
                </div>

                {/* Device ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Device ID (Tuya)</label>
                    <input
                        type="text"
                        placeholder="Cole o ID aqui..."
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none font-mono text-sm"
                        value={devId}
                        onChange={e => setDevId(e.target.value)}
                        required
                    />
                    <p className="text-xs text-gray-400 mt-1">O ID pode ser encontrado no App Tuya ou na Plataforma IoT.</p>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center"
                >
                    {loading ? 'Salvando...' : (
                        <>
                            <Save size={20} className="mr-2" />
                            Vincular Sensor
                        </>
                    )}
                </button>

            </form>
        </div>
    );
};

export default AddSensorPage;
