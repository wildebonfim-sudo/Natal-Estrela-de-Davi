/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  History, 
  LogOut, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Upload,
  ChevronRight,
  UserPlus,
  ShieldCheck,
  Home,
  MapPin,
  Calendar,
  Clock,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { calculatePrice } from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

type User = {
  id: number;
  nome: string;
  email: string;
  tipo_usuario: 'admin' | 'participante';
  status: 'Pendente' | 'Aprovado';
  telefone?: string;
};

type Dependent = {
  id: number;
  name: string;
  age: number;
  type: 'adult' | 'teen' | 'exempt';
  days: number;
  price: number;
};

type Payment = {
  id: number;
  amount: number;
  date: string;
  status: string;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState<User | null>(null);
  const [adminPass, setAdminPass] = useState('');
  
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setAllUsers(data);
        const saved = localStorage.getItem('user');
        if (saved) {
          const u = JSON.parse(saved);
          const found = data.find((x: any) => x.id === u.id);
          if (found) {
            setUser(found);
            if (found.tipo_usuario === 'admin') {
              setIsAdminAuthenticated(localStorage.getItem('adminAuth') === 'true');
            }
          }
        }
        setLoading(false);
      });
  }, []);

  const handleSelectUser = (u: User) => {
    if (u.tipo_usuario === 'admin') {
      setShowAdminPass(u);
    } else {
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === 'Natal') {
      const u = showAdminPass!;
      setUser(u);
      setIsAdminAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('adminAuth', 'true');
      setShowAdminPass(null);
      setAdminPass('');
    } else {
      alert('Senha incorreta!');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdminAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('adminAuth');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>;

  if (!user) return (
    <>
      <UserSelector users={allUsers} onSelect={handleSelectUser} />
      <AnimatePresence>
        {showAdminPass && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="font-bold text-stone-800">Acesso Restrito</h3>
                <button onClick={() => setShowAdminPass(null)} className="text-stone-400 hover:text-stone-600">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleAdminAuth} className="p-6 space-y-4">
                <p className="text-sm text-stone-500">Digite a senha de administrador para continuar.</p>
                <input 
                  type="password" 
                  autoFocus
                  required 
                  placeholder="Senha"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={adminPass}
                  onChange={e => setAdminPass(e.target.value)}
                />
                <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                  Entrar no Painel
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <Home size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-stone-800 leading-none">Sítio Estrela de Davi</h1>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mt-1">Portal do Participante</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-sm font-medium text-stone-500">Logado como: {user.nome}</span>
              <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.tipo_usuario === 'participante' && <ParticipantDashboard user={user} />}
        {user.tipo_usuario === 'admin' && (isAdminAuthenticated ? <AdminDashboard /> : <div className="flex flex-col items-center justify-center h-64 text-stone-400"><ShieldCheck size={48} className="mb-4 opacity-20" /><p>Acesso não autorizado</p></div>)}
      </main>
    </div>
  );
}

function UserSelector({ users, onSelect }: { users: User[], onSelect: (u: User) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-stone-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-emerald-100">
            <Users size={32} />
          </div>
          <h2 className="text-2xl font-bold text-stone-800">Quem é você?</h2>
          <p className="text-stone-500 text-sm mt-1">Selecione seu perfil para acessar o portal</p>
        </div>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {users.map(u => (
            <button 
              key={u.id}
              onClick={() => onSelect(u)}
              className="w-full text-left p-4 rounded-xl border border-stone-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex justify-between items-center group"
            >
              <div>
                <p className="font-bold text-stone-800 group-hover:text-emerald-700">{u.nome}</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{u.tipo_usuario === 'admin' ? 'Administrador' : 'Líder de Família'}</p>
              </div>
              <ChevronRight size={16} className="text-stone-300 group-hover:text-emerald-500" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ParticipantDashboard({ user }: { user: User }) {
  const [family, setFamily] = useState<any[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditAge, setShowEditAge] = useState<{ id: number, nome: string, idade: number } | null>(null);
  const [newMember, setNewMember] = useState({ nome: '', idade: 18, tipo: 'Adulto', dias: 4 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    const [famRes, finRes, payRes] = await Promise.all([
      fetch(`/api/user/${user.id}/family`),
      fetch(`/api/user/${user.id}/finance`),
      fetch(`/api/user/${user.id}/payments`)
    ]);
    setFamily(await famRes.json());
    setFinance(await finRes.json());
    setPayments(await payRes.json());
  };

  useEffect(() => { fetchData(); }, [user.id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/user/${user.id}/add-member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember)
    });
    if (res.ok) {
      setShowAddMember(false);
      setNewMember({ nome: '', idade: 18, tipo: 'Adulto', dias: 4 });
      fetchData();
    }
  };

  const handleUpdateAge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditAge) return;
    const res = await fetch(`/api/participant/${showEditAge.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idade: showEditAge.idade })
    });
    if (res.ok) {
      setShowEditAge(null);
      fetchData();
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (confirm('Deseja realmente remover este participante?')) {
      const res = await fetch(`/api/participant/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingReceipt(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const prompt = `Analise este comprovante de pagamento (PIX ou transferência). 
        Extraia o VALOR (apenas números), a DATA do pagamento e o NOME do pagador se disponível.
        Responda estritamente em JSON com o formato: {"amount": number, "date": "YYYY-MM-DD", "name": "string"}.
        Se não conseguir identificar, retorne {"error": "Não foi possível ler o comprovante"}.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              { text: prompt },
              { inlineData: { data: base64, mimeType: file.type } }
            ]
          },
          config: {
            responseMimeType: "application/json"
          }
        });

        const result = JSON.parse(response.text);
        if (result.error) {
          alert(result.error);
          return;
        }

        const res = await fetch('/api/payments/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            amount: result.amount,
            date: result.date
          })
        });
        
        if (res.ok) {
          alert(`Pagamento de R$ ${result.amount} identificado e registrado!`);
          fetchData();
        } else {
          alert('Erro ao salvar pagamento no servidor');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao processar comprovante com IA');
      } finally {
        setProcessingReceipt(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!finance) return null;

  const progress = finance.valor_total > 0 ? (finance.valor_pago / finance.valor_total) * 100 : 0;

  const calculateInstallment = (balance: number) => {
    // Target: November 27, 2026
    // Current: February 24, 2026
    // Remaining months: March, April, May, June, July, August, September, October, November (9 months)
    const monthsRemaining = 9;
    return balance > 0 ? balance / monthsRemaining : 0;
  };

  const installment = calculateInstallment(finance.saldo);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Summary & Payments */}
      <div className="lg:col-span-2 space-y-8">
        {/* Event Info Card */}
        <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">Suzano – SP</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">Natal – Sítio Estrela de Davi</h2>
            <div className="flex flex-wrap gap-4 text-sm text-emerald-100/80">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>24/12 a 27/12</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>Entrada: 06:00 | Saída: 18:00</span>
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
        </div>

        {/* Payment Alert */}
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Lembrete de Pagamento</p>
            <p className="text-xs text-amber-700 mt-0.5">As mensalidades devem ser pagas impreterivelmente até o **dia 25 de cada mês** para garantir a organização do evento.</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Total Devido</p>
            <p className="text-2xl font-bold text-stone-800">R$ {finance.valor_total.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Total Pago</p>
            <p className="text-2xl font-bold text-emerald-600">R$ {finance.valor_pago.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Saldo Restante</p>
            <p className="text-2xl font-bold text-orange-600">R$ {finance.saldo.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Parcela Mensal</p>
            <p className="text-2xl font-bold text-emerald-700">R$ {installment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-emerald-500 mt-1 font-medium uppercase tracking-tighter">Até Nov/2026 (9x)</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-stone-800">Status Financeiro: <span className={`ml-2 ${finance.status === 'Quitado' ? 'text-emerald-600' : finance.status === 'Parcial' ? 'text-orange-500' : 'text-red-500'}`}>{finance.status}</span></h3>
            <span className="text-sm font-bold text-emerald-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
          {finance.saldo > 0 && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-orange-50 rounded-xl border border-orange-100">
              <AlertTriangle size={16} className="text-orange-500 mt-0.5" />
              <p className="text-xs text-orange-700 leading-relaxed font-medium">
                Atenção: 3 meses sem pagamento podem resultar em quebra de contrato. Pagantes prioritários garantem leitos.
              </p>
            </div>
          )}
        </div>

        {/* Family Management */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center">
            <h3 className="font-bold text-stone-800 flex items-center gap-2">
              <Users size={18} className="text-emerald-600" />
              Sua Família
            </h3>
            <button 
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} />
              Adicionar Membro
            </button>
          </div>
          
          <div className="divide-y divide-stone-50">
            {family.map(part => (
              <div key={part.id} className="p-4 flex justify-between items-center hover:bg-stone-50/50 transition-colors">
                <div>
                  <p className="font-bold text-stone-800">{part.nome}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 px-2 py-0.5 rounded">
                      {part.tipo} ({part.idade} anos)
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">
                      {part.dias} dias
                    </span>
                    {part.dias === 4 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck size={10} /> Prioridade de Leito
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-stone-800 text-sm">R$ {part.valor_total.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setShowEditAge({ id: part.id, nome: part.nome, idade: part.idade })}
                      className="p-2 text-stone-300 hover:text-emerald-500 transition-colors"
                      title="Editar Idade"
                    >
                      <History size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteMember(part.id)}
                      className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Actions & History */}
      <div className="space-y-8">
        {/* Upload Receipt Action */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-lg">
          <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-emerald-600" />
            Enviar Pagamento
          </h3>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
            Envie o comprovante e nossa IA validará o valor automaticamente.
          </p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*,application/pdf" 
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={processingReceipt}
            className="w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-stone-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group disabled:opacity-50"
          >
            {processingReceipt ? (
              <>
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Processando IA...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-stone-700">Clique para enviar</p>
                  <p className="text-[10px] text-stone-400 font-medium mt-1 uppercase tracking-wider">JPG, PNG ou PDF</p>
                </div>
              </>
            )}
          </button>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h3 className="font-bold text-stone-800 flex items-center gap-2">
              <History size={18} className="text-emerald-600" />
              Histórico
            </h3>
          </div>
          <div className="divide-y divide-stone-50">
            {payments.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-stone-400 text-xs">Nenhum pagamento registrado.</p>
              </div>
            ) : (
              payments.map(pay => (
                <div key={pay.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-stone-800 text-sm">R$ {pay.valor.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider mt-0.5">{new Date(pay.data_pagamento).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
                    <CheckCircle size={10} /> Validado
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="font-bold text-stone-800">Adicionar Membro à Família</h3>
                <button onClick={() => setShowAddMember(false)} className="text-stone-400 hover:text-stone-600">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Nome</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newMember.nome}
                    onChange={e => setNewMember({ ...newMember, nome: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Idade</label>
                    <input 
                      type="number" 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={newMember.idade}
                      onChange={e => {
                        const age = parseInt(e.target.value);
                        let type = 'Adulto';
                        if (age <= 9) type = 'Isento';
                        else if (age <= 17) type = 'Adolescente';
                        setNewMember({ ...newMember, idade: age, tipo: type });
                      }}
                    />
                    <p className="text-[9px] text-stone-400 mt-1 leading-tight">
                      * Se fizer 10 anos até 24/Dez: Meia<br/>
                      * Se fizer 18 anos até 24/Dez: Inteira
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Dias</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
                      value={newMember.dias}
                      onChange={e => setNewMember({ ...newMember, dias: parseInt(e.target.value) })}
                    >
                      <option value={1}>1 Dia</option>
                      <option value={2}>2 Dias</option>
                      <option value={3}>3 Dias</option>
                      <option value={4}>4 Dias</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-stone-500">Valor Estimado:</span>
                    <span className="text-lg font-bold text-stone-800">R$ {calculatePrice(newMember.tipo as any, newMember.dias)}</span>
                  </div>
                  <p className="text-[9px] text-amber-600 mt-2 font-medium">
                    * Atenção: Vagas excedentes (acima de 40) não possuem leito. Necessário levar colchão próprio.
                  </p>
                </div>
                <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all mt-4">
                  Confirmar Cadastro
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Age Modal */}
      <AnimatePresence>
        {showEditAge && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="font-bold text-stone-800">Editar Idade: {showEditAge.nome}</h3>
                <button onClick={() => setShowEditAge(null)} className="text-stone-400 hover:text-stone-600">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleUpdateAge} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Idade Atualizada</label>
                  <input 
                    type="number" 
                    required 
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={showEditAge.idade}
                    onChange={e => setShowEditAge({ ...showEditAge, idade: parseInt(e.target.value) })}
                  />
                  <p className="text-[10px] text-stone-400 mt-2 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <span className="font-bold text-stone-600 block mb-1">Regra de Cobrança:</span>
                    • Se fizer 10 anos antes de 24/Dez paga meia.<br/>
                    • Se fizer 18 anos antes de 24/Dez paga inteira.
                  </p>
                </div>
                <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all mt-4">
                  Salvar Alteração
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState<number | null>(null);
  const [showAddMember, setShowAddMember] = useState<number | null>(null);
  const [showEditAge, setShowEditAge] = useState<{ id: number, nome: string, idade: number } | null>(null);
  const [manualPayment, setManualPayment] = useState({ amount: 0, date: new Date().toISOString().split('T')[0] });
  const [newMember, setNewMember] = useState({ nome: '', idade: 18, tipo: 'Adulto', dias: 4 });

  const fetchData = async () => {
    const [statsRes, famRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/families')
    ]);
    setStats(await statsRes.json());
    setFamilies(await famRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddPayment) return;
    
    const res = await fetch('/api/payments/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: showAddPayment,
        amount: manualPayment.amount,
        date: manualPayment.date
      })
    });
    
    if (res.ok) {
      setShowAddPayment(null);
      setManualPayment({ amount: 0, date: new Date().toISOString().split('T')[0] });
      fetchData();
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddMember) return;

    const res = await fetch(`/api/user/${showAddMember}/add-member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember)
    });
    if (res.ok) {
      setShowAddMember(null);
      setNewMember({ nome: '', idade: 18, tipo: 'Adulto', dias: 4 });
      fetchData();
    }
  };

  const handleUpdateAge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditAge) return;
    const res = await fetch(`/api/participant/${showEditAge.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idade: showEditAge.idade })
    });
    if (res.ok) {
      setShowEditAge(null);
      fetchData();
    }
  };

  const calculateInstallment = (balance: number) => {
    const monthsRemaining = 9;
    return balance > 0 ? balance / monthsRemaining : 0;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Meta do Sítio</p>
            <span className="text-[10px] font-bold text-emerald-600">{((stats.totalCollected / 16000) * 100).toFixed(1)}%</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">R$ {stats.totalCollected.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] text-stone-400 mt-1">Meta: R$ 16.000</p>
          <div className="w-full h-1.5 bg-stone-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min((stats.totalCollected / 16000) * 100, 100)}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Total Pendente</p>
          <p className="text-2xl font-bold text-orange-600">R$ {stats.totalPending.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Participantes</p>
          <p className="text-2xl font-bold text-stone-800">{stats.vagasOcupadas}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Vagas</p>
            <span className="text-[10px] font-bold text-emerald-600">{stats.vagasOcupadas}/{stats.vagasTotais}</span>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${(stats.vagasOcupadas / stats.vagasTotais) * 100}%` }}></div>
          </div>
          <p className="text-[9px] text-stone-400 mt-2 leading-tight">
            * Vagas 41 a 55: Sem leito (levar colchão)
          </p>
        </div>
      </div>

      {/* Family Groups */}
      <div className="space-y-4">
        <h3 className="font-bold text-stone-800 px-1">Grupos Familiares</h3>
        {families.map(fam => (
          <div key={fam.id} className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-6 bg-stone-50/50 border-b border-stone-100 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h4 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm">
                    {fam.lider.charAt(0)}
                  </span>
                  Família {fam.lider}
                </h4>
                <p className="text-xs text-stone-400 mt-1">Líder: {fam.lider}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Parcela (9x)</p>
                  <p className="text-sm font-bold text-emerald-600">
                    R$ {calculateInstallment(fam.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Saldo</p>
                  <p className={`text-sm font-bold ${fam.saldo <= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    R$ {fam.saldo.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${fam.status === 'Quitado' ? 'bg-emerald-50 text-emerald-600' : fam.status === 'Parcial' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                    {fam.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowAddPayment(fam.id)}
                    className="p-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                    title="Lançar Pagamento Manual"
                  >
                    <DollarSign size={18} />
                  </button>
                  <button 
                    onClick={() => setShowAddMember(fam.id)}
                    className="p-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                    title="Adicionar Membro"
                  >
                    <UserPlus size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Members Grid */}
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Participantes</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fam.members.map((m: any) => (
                    <div key={m.id} className="p-3 rounded-2xl border border-stone-50 bg-stone-50/30 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-stone-800">{m.nome}</p>
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider">{m.tipo} • {m.dias} dias</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setShowEditAge({ id: m.id, nome: m.nome, idade: m.idade })}
                          className="p-1.5 text-stone-300 hover:text-emerald-500 transition-colors"
                          title="Editar Idade"
                        >
                          <History size={14} />
                        </button>
                        {m.dias === 4 && <ShieldCheck size={14} className="text-amber-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments History */}
              <div className="pt-4 border-t border-stone-50">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Histórico de Pagamentos</p>
                <div className="flex flex-wrap gap-2">
                  {fam.payments.length === 0 ? (
                    <p className="text-[10px] text-stone-300 italic ml-1">Nenhum pagamento registrado</p>
                  ) : (
                    fam.payments.map((p: any) => (
                      <div key={p.id} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700">R$ {p.valor.toLocaleString('pt-BR')}</span>
                        <span className="text-[10px] text-emerald-500 font-medium">{new Date(p.data_pagamento).toLocaleDateString('pt-BR')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Payment Modal */}
      <AnimatePresence>
        {showAddPayment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="font-bold text-stone-800">Lançar Pagamento Manual</h3>
                <button onClick={() => setShowAddPayment(null)} className="text-stone-400 hover:text-stone-600">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleManualPayment} className="p-6 space-y-4">
                <p className="text-xs text-stone-500 mb-2">Use valores negativos para estornos/reembolsos.</p>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={manualPayment.amount}
                    onChange={e => setManualPayment({ ...manualPayment, amount: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Data</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={manualPayment.date}
                    onChange={e => setManualPayment({ ...manualPayment, date: e.target.value })}
                  />
                </div>
                <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all mt-4">
                  Registrar Lançamento
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="font-bold text-stone-800">Adicionar Membro à Família</h3>
                <button onClick={() => setShowAddMember(null)} className="text-stone-400 hover:text-stone-600">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleAddMember} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Nome</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newMember.nome}
                    onChange={e => setNewMember({ ...newMember, nome: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Idade</label>
                    <input 
                      type="number" 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={newMember.idade}
                      onChange={e => {
                        const age = parseInt(e.target.value);
                        let type = 'Adulto';
                        if (age <= 9) type = 'Isento';
                        else if (age <= 17) type = 'Adolescente';
                        setNewMember({ ...newMember, idade: age, tipo: type });
                      }}
                    />
                    <p className="text-[9px] text-stone-400 mt-1 leading-tight">
                      * Se fizer 10 anos até 24/Dez: Meia<br/>
                      * Se fizer 18 anos até 24/Dez: Inteira
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Dias</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
                      value={newMember.dias}
                      onChange={e => setNewMember({ ...newMember, dias: parseInt(e.target.value) })}
                    >
                      <option value={1}>1 Dia</option>
                      <option value={2}>2 Dias</option>
                      <option value={3}>3 Dias</option>
                      <option value={4}>4 Dias</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-stone-500">Valor Estimado:</span>
                    <span className="text-lg font-bold text-stone-800">R$ {calculatePrice(newMember.tipo as any, newMember.dias)}</span>
                  </div>
                  <p className="text-[9px] text-amber-600 mt-2 font-medium">
                    * Atenção: Vagas excedentes (acima de 40) não possuem leito. Necessário levar colchão próprio.
                  </p>
                </div>
                <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all mt-4">
                  Confirmar Cadastro
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Age Modal */}
      <AnimatePresence>
        {showEditAge && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="font-bold text-stone-800">Editar Idade: {showEditAge.nome}</h3>
                <button onClick={() => setShowEditAge(null)} className="text-stone-400 hover:text-stone-600">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleUpdateAge} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Idade Atualizada</label>
                  <input 
                    type="number" 
                    required 
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={showEditAge.idade}
                    onChange={e => setShowEditAge({ ...showEditAge, idade: parseInt(e.target.value) })}
                  />
                  <p className="text-[10px] text-stone-400 mt-2 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <span className="font-bold text-stone-600 block mb-1">Regra de Cobrança:</span>
                    • Se fizer 10 anos antes de 24/Dez paga meia.<br/>
                    • Se fizer 18 anos antes de 24/Dez paga inteira.
                  </p>
                </div>
                <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all mt-4">
                  Salvar Alteração
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
