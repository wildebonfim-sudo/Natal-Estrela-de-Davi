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
  DollarSign,
  Download,
  Bell,
  Search,
  Share2
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
                <Calendar size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-stone-800 leading-none">Natal 2026</h1>
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
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4 relative overflow-hidden">
      {/* Background Image/Preview - Matching the user's pool photo style */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2000" 
          alt="Sítio Preview" 
          className="w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-50/10 via-stone-50/40 to-stone-50"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-emerald-100">
            <Calendar size={40} />
          </div>
          <h2 className="text-2xl font-black text-stone-800 tracking-tight">Natal 2026</h2>
          <p className="text-stone-500 text-sm mt-1">Selecione seu perfil para acessar o portal</p>
        </div>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {users.map(u => (
            <button 
              key={u.id}
              onClick={() => onSelect(u)}
              className="w-full text-left p-4 rounded-xl border border-stone-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex justify-between items-center group min-w-0"
            >
              <div className="min-w-0 flex-1 mr-2">
                <p className="font-bold text-stone-800 group-hover:text-emerald-700 truncate">{u.nome}</p>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold truncate">{u.tipo_usuario === 'admin' ? 'Administrador' : 'Líder de Família'}</p>
              </div>
              <ChevronRight size={16} className="text-stone-300 group-hover:text-emerald-500 shrink-0" />
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
  const [showReceipt, setShowReceipt] = useState<string | null>(null);
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
      body: JSON.stringify({ idade: showEditAge.idade, nome: showEditAge.nome })
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
            date: result.date,
            receiptData: base64
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
        <div className="bg-emerald-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <MapPin size={14} className="text-emerald-400" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-200">Suzano – SP</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">Natal – Sítio Estrela de Davi</h2>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-emerald-100/80">
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
          <div className="absolute -right-10 -bottom-10 w-32 h-32 sm:w-48 sm:h-48 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-100 shadow-sm">
            <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 sm:mb-2">Total Devido</p>
            <p className="text-lg sm:text-2xl font-bold text-stone-800">R$ {finance.valor_total.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-100 shadow-sm">
            <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 sm:mb-2">Total Pago</p>
            <p className="text-lg sm:text-2xl font-bold text-emerald-600">R$ {finance.valor_pago.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-100 shadow-sm">
            <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 sm:mb-2">Saldo Restante</p>
            <p className="text-lg sm:text-2xl font-bold text-orange-600">R$ {finance.saldo.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-emerald-50 p-4 sm:p-6 rounded-2xl border border-emerald-100 shadow-sm col-span-2 lg:col-span-1">
            <p className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 sm:mb-2">Parcela Mensal</p>
            <p className="text-lg sm:text-2xl font-bold text-emerald-700">R$ {installment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[8px] sm:text-[10px] text-emerald-500 mt-1 font-medium uppercase tracking-tighter">Até Nov/2026 (9x)</p>
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
              <div key={part.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-stone-50/50 transition-colors">
                <div className="w-full sm:w-auto">
                  <p className="font-bold text-stone-800">{part.nome}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 px-2 py-0.5 rounded">
                      {part.tipo} ({part.idade} anos)
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">
                      {part.dias} dias
                    </span>
                    {part.dias === 4 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck size={10} /> Prioridade
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-50">
                  <div className="text-left sm:text-right">
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
              payments.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => p.arquivo_comprovante && setShowReceipt(p.arquivo_comprovante)}
                  className={`p-4 flex justify-between items-center ${p.arquivo_comprovante ? 'cursor-pointer hover:bg-stone-50' : ''}`}
                >
                  <div>
                    <p className="font-bold text-stone-800 text-sm">R$ {p.valor.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider mt-0.5">
                      {p.data_pagamento.split('-').reverse().join('/')}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${p.status_validacao === 'rejeitado' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {p.status_validacao === 'rejeitado' ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
                    {p.status_validacao === 'rejeitado' ? 'Rejeitado' : 'Validado'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Receipt View Modal */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-stone-100 flex justify-between items-center">
                <h3 className="font-bold text-stone-800">Comprovante de Pagamento</h3>
                <button onClick={() => setShowReceipt(null)} className="p-2 text-stone-400 hover:text-stone-600">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <div className="p-6 flex flex-col items-center gap-4">
                <div className="w-full max-h-[60vh] overflow-auto rounded-xl border border-stone-100">
                  <img 
                    src={`data:image/png;base64,${showReceipt}`} 
                    alt="Comprovante" 
                    className="w-full h-auto"
                  />
                </div>
                <a 
                  href={`data:image/png;base64,${showReceipt}`} 
                  download="comprovante.png"
                  className="bg-stone-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-900 transition-colors"
                >
                  <Download size={18} />
                  Baixar Comprovante
                </a>
              </div>
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
                <h3 className="font-bold text-stone-800">Editar Participante: {showEditAge.nome}</h3>
                <button onClick={() => setShowEditAge(null)} className="text-stone-400 hover:text-stone-600">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleUpdateAge} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Nome</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none mb-4"
                    value={showEditAge.nome}
                    onChange={e => setShowEditAge({ ...showEditAge, nome: e.target.value })}
                  />
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Idade Atualizada</label>
                  <input 
                    type="number" 
                    required 
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState<number | null>(null);
  const [showAddMember, setShowAddMember] = useState<number | null>(null);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [showEditAge, setShowEditAge] = useState<{ id: number, nome: string, idade: number } | null>(null);
  const [showReceipt, setShowReceipt] = useState<{ id: number, data: string, amount: number } | null>(null);
  const [manualPayment, setManualPayment] = useState({ amount: 0, date: new Date().toISOString().split('T')[0] });
  const [newMember, setNewMember] = useState({ nome: '', idade: 18, tipo: 'Adulto', dias: 4 });
  const [newFamilyName, setNewFamilyName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const fetchData = async () => {
    const [statsRes, famRes, notifRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/families'),
      fetch('/api/admin/notifications')
    ]);
    setStats(await statsRes.json());
    setFamilies(await famRes.json());
    setNotifications(await notifRes.json());
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

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/create-family', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: newFamilyName })
    });
    if (res.ok) {
      setShowAddFamily(false);
      setNewFamilyName('');
      fetchData();
    }
  };

  const handleUpdateAge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditAge) return;
    const res = await fetch(`/api/participant/${showEditAge.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idade: showEditAge.idade, nome: showEditAge.nome })
    });
    if (res.ok) {
      setShowEditAge(null);
      fetchData();
    }
  };

  const handleRejectPayment = async (id: number) => {
    if (confirm('Deseja realmente rejeitar este pagamento? O valor será subtraído do saldo pago.')) {
      const res = await fetch(`/api/payments/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        setShowReceipt(null);
        fetchData();
      }
    }
  };

  const handleDeletePayment = async (id: number) => {
    if (confirm('Deseja realmente EXCLUIR DEFINITIVAMENTE este pagamento? Esta ação não pode ser desfeita.')) {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setShowReceipt(null);
        fetchData();
      }
    }
  };

  const handleDeleteParticipant = async (id: number) => {
    if (confirm('Deseja realmente remover este participante?')) {
      const res = await fetch(`/api/participant/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    }
  };

  const handleDeleteFamily = async (id: number) => {
    if (confirm('Deseja realmente EXCLUIR TODA ESTA FAMÍLIA? Todos os participantes e pagamentos serão removidos permanentemente.')) {
      const res = await fetch(`/api/user/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    }
  };

  const handleMarkSeen = async (id: number) => {
    await fetch(`/api/payments/${id}/mark-seen`, { method: 'POST' });
    fetchData();
  };

  const calculateInstallment = (balance: number) => {
    const monthsRemaining = 9;
    return balance > 0 ? balance / monthsRemaining : 0;
  };

  const copyFamilySummary = (fam: any) => {
    const summary = `*Resumo Natal 2026 - Família ${fam.lider}*\n\n` +
      `Participantes: ${fam.members.length}\n` +
      `Total Devido: R$ ${fam.valor_total.toLocaleString('pt-BR')}\n` +
      `Total Pago: R$ ${fam.valor_pago.toLocaleString('pt-BR')}\n` +
      `Saldo Restante: R$ ${fam.saldo.toLocaleString('pt-BR')}\n` +
      `Status: ${fam.status}\n\n` +
      `Próxima Parcela Sugerida: R$ ${calculateInstallment(fam.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    navigator.clipboard.writeText(summary);
    alert('Resumo copiado para a área de transferência!');
  };

  const filteredFamilies = families.filter(fam => {
    const matchesSearch = fam.lider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || fam.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ['Familia', 'Participante', 'Tipo', 'Idade', 'Dias', 'Valor Total'];
    const rows = families.flatMap(fam => 
      fam.members.map((m: any) => [
        fam.lider,
        m.nome,
        m.tipo,
        m.idade,
        m.dias,
        m.valor_total
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'participantes_natal_2026.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      {/* Persistence Warning for Admin */}
      {!process.env.TURSO_DATABASE_URL && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="text-red-500" size={20} />
          <div>
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Aviso de Persistência</p>
            <p className="text-[10px] text-red-600 font-medium">Os dados atuais são temporários e serão perdidos se o site ficar inativo. Configure o Turso para salvar permanentemente.</p>
          </div>
        </div>
      )}

      {/* Notifications Bar */}
      {notifications.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">{notifications.length} Novos Pagamentos para Revisar</p>
              <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wider">Verifique os comprovantes no histórico das famílias</p>
            </div>
          </div>
          <button 
            onClick={() => notifications.forEach(n => handleMarkSeen(n.id))}
            className="text-xs font-bold text-amber-700 hover:underline w-full sm:w-auto text-left sm:text-right"
          >
            Marcar todos como vistos
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider">Meta do Sítio</p>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600">{((stats.totalCollected / 16000) * 100).toFixed(1)}%</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">R$ {stats.totalCollected.toLocaleString('pt-BR')}</p>
          <p className="text-[9px] sm:text-[10px] text-stone-400 mt-1">Meta: R$ 16.000</p>
          <div className="w-full h-1.5 bg-stone-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min((stats.totalCollected / 16000) * 100, 100)}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-100 shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Falta para a Meta</p>
          <p className="text-xl sm:text-2xl font-bold text-orange-600">R$ {stats.totalPending.toLocaleString('pt-BR')}</p>
          <p className="text-[9px] sm:text-[10px] text-stone-400 mt-1">Restante para os R$ 16k</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-100 shadow-sm">
          <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Dívida das Famílias</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600">R$ {stats.totalToReceiveFromFamilies.toLocaleString('pt-BR')}</p>
          <p className="text-[9px] sm:text-[10px] text-stone-400 mt-1">Soma de todos os saldos</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] sm:text-xs font-bold text-stone-400 uppercase tracking-wider">Vagas e Famílias</p>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600">{stats.vagasOcupadas}/{stats.vagasTotais}</span>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${(stats.vagasOcupadas / stats.vagasTotais) * 100}%` }}></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-[8px] sm:text-[9px] text-stone-400 leading-tight">
              * Vagas 41 a 55: Sem leito
            </p>
            <p className="text-[9px] font-bold text-stone-600">{stats.familiasTotal} Famílias</p>
          </div>
        </div>
      </div>

      {/* Family Groups */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
          <h3 className="font-bold text-stone-800">Grupos Familiares</h3>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
              <input 
                type="text" 
                placeholder="Buscar família..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="Todos">Todos Status</option>
              <option value="Quitado">Quitado</option>
              <option value="Parcial">Parcial</option>
              <option value="Pendente">Pendente</option>
            </select>
            <button 
              onClick={() => setShowAddFamily(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all"
            >
              <Plus size={14} />
              Nova Família
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-xl transition-all"
            >
              <Download size={14} />
              Exportar CSV
            </button>
          </div>
        </div>
        
        {filteredFamilies.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-stone-200 text-center">
            <p className="text-stone-400 text-sm italic">Nenhuma família encontrada com esses filtros.</p>
          </div>
        ) : (
          filteredFamilies.map(fam => (
          <div key={fam.id} className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 bg-stone-50/50 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="w-full sm:w-auto">
                <h4 className="text-base sm:text-lg font-bold text-stone-800 flex items-center gap-2">
                  <span className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm shrink-0">
                    {fam.lider.charAt(0)}
                  </span>
                  <span className="truncate">Família {fam.lider}</span>
                </h4>
                <p className="text-[10px] sm:text-xs text-stone-400 mt-1">Líder: {fam.lider}</p>
              </div>
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
                <div className="grid grid-cols-3 sm:flex sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                  <div className="text-left sm:text-right">
                    <p className="text-[8px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest">Parcela</p>
                    <p className="text-xs sm:text-sm font-bold text-emerald-600">
                      R$ {calculateInstallment(fam.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[8px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest">Saldo</p>
                    <p className={`text-xs sm:text-sm font-bold ${fam.saldo <= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      R$ {fam.saldo.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[8px] sm:text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</p>
                    <span className={`inline-block text-[8px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${fam.status === 'Quitado' ? 'bg-emerald-50 text-emerald-600' : fam.status === 'Parcial' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                      {fam.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <button 
                    onClick={() => copyFamilySummary(fam)}
                    className="flex-1 sm:flex-none p-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm flex justify-center"
                    title="Copiar Resumo para WhatsApp"
                  >
                    <Share2 size={18} />
                  </button>
                  <button 
                    onClick={() => setShowAddPayment(fam.id)}
                    className="flex-1 sm:flex-none p-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm flex justify-center"
                    title="Lançar Pagamento Manual"
                  >
                    <DollarSign size={18} />
                  </button>
                  <button 
                    onClick={() => setShowAddMember(fam.id)}
                    className="flex-1 sm:flex-none p-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm flex justify-center"
                    title="Adicionar Membro"
                  >
                    <UserPlus size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteFamily(fam.id)}
                    className="flex-1 sm:flex-none p-2 bg-white border border-stone-200 rounded-xl text-stone-600 hover:border-red-500 hover:text-red-600 transition-all shadow-sm flex justify-center"
                    title="Excluir Família"
                  >
                    <Trash2 size={18} />
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
                          title="Editar Dados"
                        >
                          <History size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteParticipant(m.id)}
                          className="p-1.5 text-stone-300 hover:text-red-500 transition-colors"
                          title="Remover Participante"
                        >
                          <Trash2 size={14} />
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
                      <div 
                        key={p.id} 
                        onClick={() => {
                          if (p.visto_por_admin === 0) handleMarkSeen(p.id);
                          setShowReceipt({ id: p.id, data: p.arquivo_comprovante, amount: p.valor });
                        }}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${p.status_validacao === 'rejeitado' ? 'bg-red-50 border border-red-100' : p.visto_por_admin === 0 ? 'bg-amber-50 border border-amber-200 ring-2 ring-amber-100' : 'bg-emerald-50 border border-emerald-100 hover:bg-emerald-100'}`}
                      >
                        <span className={`text-xs font-bold ${p.status_validacao === 'rejeitado' ? 'text-red-700' : 'text-emerald-700'}`}>R$ {p.valor.toLocaleString('pt-BR')}</span>
                        <span className={`text-[10px] font-medium ${p.status_validacao === 'rejeitado' ? 'text-red-500' : 'text-emerald-500'}`}>{p.data_pagamento.split('-').reverse().join('/')}</span>
                        {p.arquivo_comprovante && <Upload size={10} className="text-stone-400" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )))}
      </div>

      {/* Receipt View Modal */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-stone-100 flex justify-between items-center">
                <h3 className="font-bold text-stone-800">Comprovante: R$ {showReceipt.amount.toLocaleString('pt-BR')}</h3>
                <button onClick={() => setShowReceipt(null)} className="p-2 text-stone-400 hover:text-stone-600">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <div className="p-6 flex flex-col items-center gap-4">
                {showReceipt.data ? (
                  <>
                    <div className="w-full max-h-[60vh] overflow-auto rounded-xl border border-stone-100">
                      <img 
                        src={`data:image/png;base64,${showReceipt.data}`} 
                        alt="Comprovante" 
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 w-full">
                      <a 
                        href={`data:image/png;base64,${showReceipt.data}`} 
                        download="comprovante.png"
                        className="flex-1 min-w-[120px] bg-stone-800 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-900 transition-colors"
                      >
                        <Download size={18} />
                        Baixar
                      </a>
                      <button 
                        onClick={() => handleRejectPayment(showReceipt.id)}
                        className="flex-1 min-w-[120px] bg-red-50 text-red-600 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={18} />
                        Rejeitar
                      </button>
                      <button 
                        onClick={() => handleDeletePayment(showReceipt.id)}
                        className="flex-1 min-w-[120px] bg-red-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                      >
                        <Trash2 size={18} />
                        Excluir
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full">
                    <div className="p-12 text-center text-stone-400 italic bg-stone-50 rounded-xl border border-stone-100 mb-4">
                      Este pagamento foi lançado manualmente e não possui comprovante de imagem.
                    </div>
                    <button 
                      onClick={() => handleDeletePayment(showReceipt.id)}
                      className="w-full bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                      Excluir Pagamento Definitivamente
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

      {/* Add Family Modal */}
      <AnimatePresence>
        {showAddFamily && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="font-bold text-stone-800">Criar Nova Família</h3>
                <button onClick={() => setShowAddFamily(false)} className="text-stone-400 hover:text-stone-600">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleCreateFamily} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Nome do Líder da Família</label>
                  <input 
                    type="text" 
                    required 
                    autoFocus
                    placeholder="Ex: Família Souza ou Nome do Líder"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newFamilyName}
                    onChange={e => setNewFamilyName(e.target.value)}
                  />
                  <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">
                    Isso criará um novo perfil de acesso. Depois você poderá adicionar os membros e pagamentos dentro desta família.
                  </p>
                </div>
                <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all mt-4">
                  Criar Família
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
                <h3 className="font-bold text-stone-800">Editar Participante: {showEditAge.nome}</h3>
                <button onClick={() => setShowEditAge(null)} className="text-stone-400 hover:text-stone-600">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleUpdateAge} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Nome</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none mb-4"
                    value={showEditAge.nome}
                    onChange={e => setShowEditAge({ ...showEditAge, nome: e.target.value })}
                  />
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1 ml-1">Idade Atualizada</label>
                  <input 
                    type="number" 
                    required 
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
