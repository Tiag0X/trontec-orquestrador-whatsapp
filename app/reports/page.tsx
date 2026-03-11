'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Play, RefreshCw, FileText, CalendarDays, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { GroupSelector } from '@/components/group-selector';

interface Report {
    id: string;
    dateRef: string;
    summary: string;
    status: string;
    createdAt: string;
    group?: {
        name: string;
    };
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    // Form State
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);


    const [searchTerm, setSearchTerm] = useState('');

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/reports');
            const data = await res.json();
            if (Array.isArray(data)) setReports(data);
        } catch { toast.error("Erro ao carregar relatórios."); } finally { setLoading(false); }
    };

    useEffect(() => { fetchReports(); }, []);
    useEffect(() => { 
        if (isGenerateOpen) {
            const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const todayStr = format(new Date());
            setStartDate(todayStr);
            setEndDate(todayStr);
        }
    }, [isGenerateOpen]);

    const setPresetDate = (type: 'today' | 'yesterday' | '48h') => {
        const end = new Date();
        const start = new Date();
        if (type === 'yesterday') { start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); }
        else if (type === '48h') { start.setDate(start.getDate() - 2); }
        
        const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setStartDate(format(start));
        setEndDate(format(end));
    };

    const handleGenerate = async () => {
        if (selectedGroupIds.length === 0) return toast.warning("Selecione pelo menos um grupo.");
        setProcessing(true);
        setStatusMessage("Inicializando...");
        try {
            const res = await fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    groupIds: selectedGroupIds,
                    agentType: 'LANGCHAIN'
                })
            });
            const data = await res.json();
            if (data.status === 'SUCCESS' || data.status === 'SENT' || data.status === 'COMPLETED' || data.status === 'EMPTY') {
                toast.success("Processamento concluído!");
                fetchReports();
                setIsGenerateOpen(false);
            } else {
                toast.warning("Finalizado com avisos: " + (data.reason || "Verifique os logs"));
            }
        } catch { toast.error("Erro fatal ao processar."); }
        finally { setProcessing(false); setStatusMessage(""); }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'SENT': return { label: 'Enviado', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
            case 'GENERATED': return { label: 'Gerado', icon: Clock, className: 'bg-amber-50 text-amber-600 border-amber-100' };
            case 'EMPTY': return { label: 'Vazio', icon: FileText, className: 'bg-slate-50 text-slate-500 border-slate-100' };
            default: return { label: 'Falha', icon: XCircle, className: 'bg-rose-50 text-rose-600 border-rose-100' };
        }
    };

    const filteredReports = reports.filter(r =>
        r.group?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.dateRef.includes(searchTerm) ||
        r.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1240px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header com Design Storytelling */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        Central de Relatórios
                        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest text-primary border-primary/20 bg-primary/5">
                            AI-Powered
                        </Badge>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
                        Análise comportamental e resumos executivos baseados em inteligência artificial avançada.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Input
                            placeholder="Buscar relatórios..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white/50 backdrop-blur-sm border-slate-200 focus:ring-primary/20"
                        />
                        <RefreshCw className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
                    </div>

                    <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                        <DialogTrigger asChild>
                            <Button disabled={processing} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-primary/20 gap-2 h-10 px-5 transition-all hover:scale-[1.02] active:scale-95">
                                {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                <span className="hidden sm:inline">Gerar Novo</span>
                                <span className="sm:hidden text-xs">Gerar</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] border-slate-200/60 backdrop-blur-xl bg-white/95">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Processar Inteligência</DialogTitle>
                                <DialogDescription>Escolha o período e os grupos para a análise da IA.</DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold text-slate-700">Período de Análise</Label>
                                        <div className="flex gap-1">
                                            {['today', 'yesterday', '48h'].map((preset) => (
                                                <Button
                                                    key={preset}
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setPresetDate(preset as 'today' | 'yesterday' | '48h')}
                                                    className="text-[10px] uppercase font-bold tracking-tight h-6 px-2 hover:bg-primary/10 text-primary"
                                                >
                                                    {preset === 'today' ? 'Hoje' : preset === 'yesterday' ? 'Ontem' : '48h'}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.1em] ml-1">Data Início</span>
                                            <div className="relative group">
                                                <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="pl-9 bg-slate-50/50 border-slate-200 focus:bg-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.1em] ml-1">Data Fim</span>
                                            <div className="relative group">
                                                <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="pl-9 bg-slate-50/50 border-slate-200 focus:bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700">Grupos Alvo</Label>
                                    <div className="p-1 rounded-xl bg-slate-50/50 border border-slate-200">
                                        <GroupSelector selectedGroupIds={selectedGroupIds} onSelectionChange={setSelectedGroupIds} />
                                    </div>
                                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                        <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                        <p className="text-[10px] text-amber-800 leading-tight">
                                            <strong>Aviso:</strong> O processamento pode levar alguns segundos dependendo da quantidade de mensagens no período.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="pt-2 border-t mt-2">
                                <div className="flex w-full justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
                                        <span className="text-xs font-medium text-primary animate-pulse min-h-[1.25rem]">{processing ? statusMessage : "Pronto"}</span>
                                    </div>
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={processing}
                                        className="bg-[#7C3AED] hover:bg-[#6D28D9] min-w-[120px] shadow-lg shadow-primary/20"
                                    >
                                        {processing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                                        {processing ? "Gerando..." : "Iniciar Análise"}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Reports Grid com Liquid Glass Style */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-[200px] rounded-2xl bg-white border border-slate-200 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent -translate-x-full animate-shimmer" />
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between">
                                    <div className="h-5 w-32 bg-slate-100 rounded-md" />
                                    <div className="h-5 w-16 bg-slate-100 rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-slate-50 rounded" />
                                    <div className="h-3 w-[90%] bg-slate-50 rounded" />
                                    <div className="h-3 w-[80%] bg-slate-50 rounded" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredReports.length === 0 ? (
                    <div className="col-span-full py-20 bg-white/30 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-indigo-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Nenhum relatório encontrado</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-xs">
                            Ajuste seus filtros ou inicie um novo processamento para gerar relatórios pela IA.
                        </p>
                        <Button
                            variant="link"
                            onClick={() => setSearchTerm('')}
                            className="mt-4 text-primary font-bold"
                        >
                            Limpar busca
                        </Button>
                    </div>
                ) : (
                    filteredReports.map((report) => {
                        const statusConfig = getStatusConfig(report.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                            <Link key={report.id} href={`/reports/${report.id}`}>
                                <Card className="group relative bg-white hover:bg-slate-50/50 border border-slate-200/60 hover:border-primary/30 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5 cursor-pointer overflow-hidden flex flex-col h-full active:scale-[0.99]">
                                    {/* Glass Accent */}
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-primary transition-colors" />

                                    <CardHeader className="p-6 pb-0">
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1 pr-2">
                                                <Badge variant="outline" className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400 border-slate-200">
                                                    OSINT Analysis
                                                </Badge>
                                                <CardTitle className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors truncate mb-1">
                                                    {report.group?.name || 'Grupo Desconhecido'}
                                                </CardTitle>
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                                    <CalendarDays className="w-3 h-3 text-primary/60" />
                                                    {report.dateRef}
                                                </div>
                                            </div>
                                            <div className={`p-2 rounded-xl border ${statusConfig.className} transition-all`}>
                                                <StatusIcon className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-6 pt-4 flex-1">
                                        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                                            {report.summary || "Sem resumo disponível para este relatório."}
                                        </p>
                                    </CardContent>

                                    <CardFooter className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Gerado em</span>
                                            <span className="text-[10px] font-medium text-slate-600">
                                                {new Date(report.createdAt).toLocaleDateString('pt-BR')} às {new Date(report.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all shadow-sm">
                                            <Play className="h-3 w-3 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        );
                    })
                )}
            </div>

            {/* Pagination / Load More (Visual only for now) */}
            {filteredReports.length > 12 && (
                <div className="flex justify-center pt-8">
                    <Button variant="outline" className="rounded-full px-8 hover:bg-slate-50">
                        Carregar Mais Relatórios
                    </Button>
                </div>
            )}
        </div>
    );
}
