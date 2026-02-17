import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Save, Wifi, Trash2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const SensorFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // State from navigation
    const existingData = location.state?.sensor;
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        nome: existingData?.nome || '',
        devId: existingData?.devId || ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit && !existingData) {
            // Fallback fetch if direct link access (optional for now as discussed)
            api.get(`/sensores/${id}`).then(res => {
                setFormData({ nome: res.data.nome, devId: res.data.devId });
            }).catch(() => {
                toast.error('Erro ao carregar sensor');
                navigate('/sensores');
            });
        }
    }, [id, existingData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const savePromise = isEdit
            ? api.put(`/sensores/${id}`, formData)
            : api.post('/sensores', formData);

        toast.promise(savePromise, {
            loading: 'Salvando sensor...',
            success: 'Sensor salvo com sucesso!',
            error: 'Erro ao salvar sensor.',
        }).then(() => {
            navigate('/sensores');
        }).catch((err) => console.error(err));

        setLoading(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Excluir este sensor? Isso irá parar o monitoramento.')) return;
        setLoading(true);

        toast.promise(api.delete(`/sensores/${id}`), {
            loading: 'Excluindo...',
            success: 'Sensor excluído.',
            error: 'Erro ao excluir.',
        }).then(() => {
            navigate('/sensores');
        }).catch((err) => console.error(err));

        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    {isEdit ? 'Editar Sensor' : 'Novo Sensor'}
                </h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            <Wifi size={16} className="mr-2 text-blue-500" />
                            Nome do Dispositivo
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.nome}
                            onChange={e => setFormData({ ...formData, nome: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            ID Tuya (DevID)
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                            value={formData.devId}
                            onChange={e => setFormData({ ...formData, devId: e.target.value })}
                        />
                        <p className="text-xs text-gray-400">Cuidado ao alterar o ID, isso pode perder a conexão com a Tuya.</p>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100 mt-6">
                        {isEdit && (
                            <button type="button" onClick={handleDelete} className="px-6 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium flex items-center gap-2">
                                <Trash2 size={20} /> Excluir
                            </button>
                        )}
                        <div className="flex-1"></div>
                        <button type="button" onClick={() => navigate('/sensores')} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancelar</button>
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
export default SensorFormPage;
