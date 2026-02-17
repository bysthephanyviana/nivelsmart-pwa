import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Save, Loader, Trash2, Cylinder, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';

const ReservatorioFormPage = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const condominioIdParam = searchParams.get('condominioId');
    const navigate = useNavigate();
    const location = useLocation();

    // State from navigation (Robust enough for now)
    const existingData = location.state?.reservatorio;
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        nome: existingData?.nome || '',
        capacidade_litros: existingData?.capacidade_litros || '',
        condominio_id: existingData?.condominio_id || condominioIdParam || ''
    });

    const [sensores, setSensores] = useState([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit && !existingData) {
            // Fetch from API if validation state is missing
            const fetchData = async () => {
                try {
                    setLoading(true);
                    const response = await api.get(`/reservatorios/detalhes/${id}`);
                    setFormData({
                        nome: response.data.nome,
                        capacidade_litros: response.data.capacidade_litros,
                        condominio_id: response.data.condominio_id
                    });
                } catch (error) {
                    console.error("Erro ao buscar reservatório", error);
                    toast.error("Erro ao carregar dados do reservatório.");
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }

        // Fetch sensors if editing
        if (isEdit) {
            api.get(`/sensores/reservatorio/${id}`)
                .then(res => setSensores(res.data))
                .catch(err => console.error("Erro ao buscar sensores", err));
        }
    }, [id, isEdit, existingData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare payload with correct types
            const payload = {
                nome: formData.nome,
                capacidade_litros: Number(formData.capacidade_litros)
            };

            let savePromise;

            if (isEdit) {
                // Update: Do not send condominio_id (Joi schema doesn't allow it)
                savePromise = api.put(`/reservatorios/${id}`, payload);
            } else {
                // Create: Must include condominio_id
                if (!formData.condominio_id) {
                    toast.error("Erro: Condomínio não identificado.");
                    setLoading(false);
                    return;
                }
                payload.condominio_id = Number(formData.condominio_id);
                savePromise = api.post('/reservatorios', payload);
            }

            await toast.promise(savePromise, {
                loading: 'Salvando...',
                success: 'Reservatório salvo!',
                error: (err) => {
                    // Show specific validation error if available
                    return err.response?.data?.message || 'Erro ao salvar.';
                }
            });

            // Navigate on success
            navigate(formData.condominio_id ? `/condominio/${formData.condominio_id}` : '/dashboard');

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        toast((t) => (
            <div className="flex flex-col gap-3 min-w-[250px]">
                <p className="font-medium text-gray-800">Excluir este reservatório?</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            confirmDelete();
                        }}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Excluir
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const confirmDelete = async () => {
        setLoading(true);

        toast.promise(api.delete(`/reservatorios/${id}`), {
            loading: 'Excluindo...',
            success: 'Reservatório excluído!',
            error: 'Erro ao excluir.',
        }).then(() => {
            navigate(formData.condominio_id ? `/condominio/${formData.condominio_id}` : '/dashboard');
        }).catch((err) => console.error(err));

        setLoading(false);
    };

    const handleDeleteSensor = async (sensorId) => {
        if (!window.confirm("Desvincular este sensor do reservatório?")) return;
        try {
            await api.delete(`/sensores/${sensorId}`);
            setSensores(sensores.filter(s => s.id !== sensorId));
            toast.success("Sensor desvinculado!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao desvincular sensor.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? 'Editar Reservatório' : 'Novo Reservatório'}
                </h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            <Cylinder size={16} className="mr-2 text-blue-500" />
                            Nome / Identificação
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Bloco A - Superior"
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.nome}
                            onChange={e => setFormData({ ...formData, nome: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            Capacidade (Litros)
                        </label>
                        <input
                            type="number"
                            required
                            placeholder="Ex: 10000"
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.capacidade_litros}
                            onChange={e => setFormData({ ...formData, capacidade_litros: e.target.value })}
                        />
                    </div>

                    {isEdit && (
                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                <Wifi size={20} className="mr-2 text-blue-500" />
                                Sensores Vinculados
                            </h3>

                            <div className="space-y-3">
                                {sensores.length > 0 ? (
                                    sensores.map(sensor => (
                                        <div key={sensor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div>
                                                <p className="font-bold text-gray-700">{sensor.nome}</p>
                                                <p className="text-xs font-mono text-gray-400">ID: {sensor.devId}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSensor(sensor.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Desvincular Sensor"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p>Nenhum sensor vinculado.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100 mt-6">
                        {isEdit && (
                            <button type="button" onClick={handleDelete} className="px-6 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium flex items-center gap-2">
                                <Trash2 size={20} /> Excluir
                            </button>
                        )}
                        <div className="flex-1"></div>
                        <button type="button" onClick={() => navigate(formData.condominio_id ? `/condominio/${formData.condominio_id}` : '/dashboard')} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg flex items-center gap-2">
                            {loading ? <Loader className="animate-spin" /> : <Save size={20} />}
                            <span>Salvar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default ReservatorioFormPage;
