import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Save, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const CondominioFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nome: '',
        endereco: ''
    });

    useEffect(() => {
        if (isEditing) {
            fetchCondominio();
        }
    }, [id]);

    const fetchCondominio = async () => {
        try {
            const response = await api.get(`/condominios/${id}`);
            setFormData({
                nome: response.data.nome,
                endereco: response.data.endereco || ''
            });
        } catch (error) {
            console.error('Erro ao buscar imóvel:', error);
            toast.error('Erro ao carregar dados do imóvel.');
            navigate('/condominios');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditing) {
                await api.put(`/condominios/${id}`, formData);
                toast.success('Imóvel atualizado com sucesso!');
            } else {
                await api.post('/condominios', formData);
                toast.success('Imóvel cadastrado com sucesso!');
            }
            navigate('/dashboard');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar imóvel. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("ATENÇÃO: Excluir este condomínio apagará todos os reservatórios e sensores vinculados. Continuar?")) return;

        setLoading(true);
        try {
            await api.delete(`/condominios/${id}`);
            toast.success("Condomínio excluído permanentemente.");
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error("Erro ao excluir condomínio.");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-2">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-slate-900">
                    {isEditing ? 'Editar Imóvel' : 'Novo Imóvel'}
                </h1>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid gap-1.5">
                            <label className="text-sm font-semibold text-slate-700">Nome do Condomínio</label>
                            <input
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="Ex: Residencial Jardins"
                                required
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <label className="text-sm font-semibold text-slate-700">Endereço Completo</label>
                            <textarea
                                name="endereco"
                                value={formData.endereco}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 min-h-[100px] resize-y"
                                placeholder="Rua, Número, Bairro, Cidade - UF"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        {isEditing ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Trash2 size={18} />
                                Excluir Imóvel
                            </button>
                        ) : <div></div>}

                        <div className="flex items-center space-x-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate('/dashboard')}
                                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                icon={loading ? Loader2 : Save}
                                className={loading ? "opacity-80 bg-blue-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"}
                            >
                                {loading ? 'Salvando...' : (isEditing ? 'Atualizar Imóvel' : 'Criar Imóvel')}
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>
        </div >
    );
};

export default CondominioFormPage;
