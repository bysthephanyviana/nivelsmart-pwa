import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Building2, Cylinder, Wifi, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const WizardCondominio = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Stats
    const [condominio, setCondominio] = useState({ nome: '', endereco: '' });
    const [reservatorios, setReservatorios] = useState([
        { id: 1, nome: 'Reservatório Principal', capacidade: '', tipo: 'Principal', sensor: { devId: '', nome: 'Sensor 1', isManual: false } }
    ]);
    const [availableSensors, setAvailableSensors] = useState([]);
    const [isLoadingSensors, setIsLoadingSensors] = useState(false);

    // Handlers
    const handleCondominioChange = (e) => {
        setCondominio({ ...condominio, [e.target.name]: e.target.value });
    };

    const handleReservatorioChange = (id, field, value) => {
        setReservatorios(reservatorios.map(res =>
            res.id === id ? { ...res, [field]: value } : res
        ));
    };

    const handleSensorChange = (resId, field, value) => {
        setReservatorios(reservatorios.map(res =>
            res.id === resId ? { ...res, sensor: { ...res.sensor, [field]: value } } : res
        ));
    };

    const addReservatorio = () => {
        const nextId = reservatorios.length + 1;
        setReservatorios([...reservatorios, {
            id: nextId,
            nome: `Reservatório ${nextId}`,
            capacidade: '',
            tipo: 'Secundário',
            sensor: { devId: '', nome: `Sensor ${nextId}`, isManual: false }
        }]);
    };

    const removeReservatorio = (id) => {
        if (reservatorios.length > 1) {
            setReservatorios(reservatorios.filter(r => r.id !== id));
        } else {
            toast.error('É necessário pelo menos um reservatório.');
        }
    };

    const fetchTuyaSensors = async () => {
        setIsLoadingSensors(true);
        try {
            const response = await api.get('/sensores/disponiveis');
            setAvailableSensors(response.data);

            // Debug info
            console.log('Sensores encontrados:', response.data);
            if (response.data.length === 0) {
                toast('Nenhum sensor novo encontrado na Tuya.', { icon: '⚠️' });
            }
        } catch (error) {
            console.error('Erro ao buscar sensores Tuya:', error);
            toast.error('Não foi possível listar os sensores da Tuya. Insira manualmente.');
        } finally {
            setIsLoadingSensors(false);
        }
    };

    const validateStep = () => {
        if (step === 1) {
            if (!condominio.nome) return toast.error('Nome do condomínio é obrigatório');
            setStep(2);
        } else if (step === 2) {
            const invalid = reservatorios.find(r => !r.nome || !r.capacidade);
            if (invalid) return toast.error('Preencha nome e capacidade de todos os reservatórios');
            fetchTuyaSensors(); // Fetch available sensors
            setStep(3);
        } else if (step === 3) {
            // Optional: validate sensors (though devId is crucial for functionality)
            const missingSensor = reservatorios.find(r => !r.sensor.devId);
            if (missingSensor) {
                toast((t) => (
                    <div>
                        <p>O reservatório <b>{missingSensor.nome}</b> está sem sensor.</p>
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => toast.dismiss(t.id)} className="text-xs bg-gray-200 px-2 py-1 rounded">Corrigir</button>
                            <button onClick={() => { toast.dismiss(t.id); setStep(4); }} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Continuar mesmo assim</button>
                        </div>
                    </div>
                ));
                return;
            }
            setStep(4);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                ...condominio,
                reservatorios: reservatorios.map(r => ({
                    nome: r.nome,
                    capacidade: r.capacidade,
                    sensor: r.sensor.devId && r.sensor.devId !== 'manual' ? { devId: r.sensor.devId, nome: r.sensor.nome } : null
                }))
            };

            await api.post('/condominios/wizard', payload);
            toast.success('Condomínio cadastrado com sucesso!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Erro no Wizard:', error);
            toast.error(error.response?.data?.message || 'Erro ao realizar cadastro.');
        } finally {
            setLoading(false);
        }
    };

    // Render Steps
    return (
        <div className="max-w-3xl mx-auto py-6">
            {/* Stepper Header */}
            <div className="flex items-center justify-between mb-8 px-4">
                {[
                    { n: 1, label: 'Condomínio', icon: Building2 },
                    { n: 2, label: 'Reservatórios', icon: Cylinder },
                    { n: 3, label: 'Sensores', icon: Wifi },
                    { n: 4, label: 'Resumo', icon: CheckCircle2 }
                ].map((s) => (
                    <div key={s.n} className={`flex flex-col items-center flex-1 ${step >= s.n ? 'text-blue-600' : 'text-slate-300'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-colors ${step >= s.n ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                            <s.icon size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide">{s.label}</span>
                    </div>
                ))}
            </div>

            <Card className="p-6">
                {/* Step 1: Condominio */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Dados do Imóvel</h2>
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Condomínio / Imóvel</label>
                                <input name="nome" value={condominio.nome} onChange={handleCondominioChange} className="w-full input-field border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Ex: Edifício Solar" autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                                <textarea name="endereco" value={condominio.endereco} onChange={handleCondominioChange} className="w-full input-field border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-24" placeholder="Rua, Número, Bairro..." />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Reservatorios */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Reservatórios de Água</h2>
                            <Button size="sm" variant="outline" onClick={addReservatorio} icon={Plus}>Adicionar Outro</Button>
                        </div>

                        <div className="space-y-4">
                            {reservatorios.map((res, idx) => (
                                <div key={res.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group">
                                    <div className="absolute -left-3 -top-3 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                        {idx + 1}
                                    </div>
                                    {reservatorios.length > 1 && (
                                        <button onClick={() => removeReservatorio(res.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Nome / Identificação</label>
                                            <input value={res.nome} onChange={(e) => handleReservatorioChange(res.id, 'nome', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" placeholder="Ex: Torre A" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Capacidade (Litros)</label>
                                            <input type="number" value={res.capacidade} onChange={(e) => handleReservatorioChange(res.id, 'capacidade', e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" placeholder="Ex: 10000" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Sensores */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Vincular Sensores (Tuya)</h2>
                        <p className="text-sm text-slate-500 mb-4">Selecione o dispositivo inteligente instalado no reservatório.</p>

                        <div className="space-y-4">
                            {reservatorios.map((res, idx) => (
                                <div key={res.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                        <Cylinder size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800">{res.nome}</h3>
                                        <p className="text-xs text-slate-500">{res.capacidade} Litros</p>
                                    </div>
                                    <div className="w-1/2">
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                                            Sensor Tuya {isLoadingSensors && <span className="text-blue-500 font-normal normal-case animate-pulse">(Buscando...)</span>}
                                        </label>

                                        {availableSensors.length > 0 ? (
                                            <select
                                                value={res.sensor.isManual ? 'manual' : res.sensor.devId}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === 'manual') {
                                                        handleSensorChange(res.id, 'isManual', true);
                                                        handleSensorChange(res.id, 'devId', '');
                                                    } else {
                                                        handleSensorChange(res.id, 'isManual', false);
                                                        handleSensorChange(res.id, 'devId', value);
                                                        const selectedDevice = availableSensors.find(s => s.id === value);
                                                        if (selectedDevice) {
                                                            handleSensorChange(res.id, 'nome', selectedDevice.name || `Sensor ${idx + 1}`);
                                                        }
                                                    }
                                                }}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            >
                                                <option value="">Selecione um sensor...</option>
                                                {availableSensors.map(sensor => (
                                                    <option
                                                        key={sensor.id}
                                                        value={sensor.id}
                                                        disabled={sensor.is_registered}
                                                        className={sensor.is_registered ? 'text-gray-400 bg-gray-50' : 'font-medium'}
                                                    >
                                                        {sensor.name} {sensor.is_registered ? '(Já vinculado)' : ''}
                                                    </option>
                                                ))}
                                                <option value="manual">-- Inserir Manualmente --</option>
                                            </select>
                                        ) : (
                                            <div className="text-xs text-slate-500 mb-1">
                                                {isLoadingSensors ? 'Carregando lista...' : 'Nenhum sensor encontrado.'}
                                            </div>
                                        )}

                                        {(res.sensor.isManual || availableSensors.length === 0) && (
                                            <input
                                                autoFocus={res.sensor.isManual}
                                                value={res.sensor.devId}
                                                onChange={(e) => handleSensorChange(res.id, 'devId', e.target.value)}
                                                className="w-full mt-2 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-mono placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                placeholder="Digite o ID do sensor Tuya (ex: bf81...)"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 4: Summary */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Tudo Pronto!</h2>
                        <p className="text-slate-600 max-w-md mx-auto">
                            Confira os dados abaixo antes de finalizar o cadastro do condomínio <b>{condominio.nome}</b>.
                        </p>

                        <div className="bg-slate-50 p-6 rounded-2xl text-left max-w-lg mx-auto border border-slate-200">
                            <ul className="space-y-3">
                                <li className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="text-slate-500 text-sm">Reservatórios</span>
                                    <span className="font-bold text-slate-800">{reservatorios.length} Unidades</span>
                                </li>
                                <li className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="text-slate-500 text-sm">Sensores Vinculados</span>
                                    <span className="font-bold text-slate-800">{reservatorios.filter(r => r.sensor.devId && r.sensor.devId !== 'manual').length} Dispositivos</span>
                                </li>
                                <li className="flex justify-between pt-2">
                                    <span className="text-slate-500 text-sm">Capacidade Total</span>
                                    <span className="font-bold text-blue-600">{reservatorios.reduce((acc, r) => acc + Number(r.capacidade), 0).toLocaleString()} Litros</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Footer Controls */}
                <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                    {step > 1 ? (
                        <Button variant="secondary" onClick={() => setStep(step - 1)} icon={ArrowLeft}>Voltar</Button>
                    ) : (
                        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Cancelar</Button>
                    )}

                    {step < 4 ? (
                        <Button onClick={validateStep} className="bg-blue-600 hover:bg-blue-700 text-white" icon={ArrowRight} iconPos="right">
                            Próximo
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200" icon={CheckCircle2}>
                            {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default WizardCondominio;
