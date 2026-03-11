"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, AlertTriangle, History, Code, Sparkles, LayoutTemplate, Plus, Trash, Pencil, CheckCircle2, XCircle, Clock, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { GroupSelector } from '@/components/group-selector';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

interface Broadcast {
    id: string;
    message: string;
    recipients: string;
    successCount: number;
    failCount: number;
    createdAt: string;
}

interface ScheduledMessage {
    id: string;
    message: string;
    recipients: string;
    scheduledAt: string;
    status: string;
    createdAt: string;
}

interface MessageTemplate {
    id: string;
    name: string;
    content: string;
}

export default function MessagesPage() {
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState<Broadcast[]>([]);
    const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduling, setScheduling] = useState(false);
    const [prompts, setPrompts] = useState<{ id: string, name: string }[]>([]);
    const [mensagensPromptId, setMensagensPromptId] = useState<string | null>(null);
    const [rewriting, setRewriting] = useState(false);
    const [showPromptSelect, setShowPromptSelect] = useState(false);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [newTemplateContent, setNewTemplateContent] = useState("");
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/messages');
            const data = await res.json();
            if (Array.isArray(data)) setHistory(data);
        } catch { console.error("Failed to load history"); }
    };
    const fetchPrompts = async () => {
        try {
            const res = await fetch('/api/prompts');
            const data = await res.json();
            if (Array.isArray(data)) {
                setPrompts(data);
                const msgPrompt = data.find(p => p.name.toLowerCase() === 'mensagens');
                if (msgPrompt) setMensagensPromptId(msgPrompt.id);
            }
        } catch { console.error("Failed to load prompts"); }
    };
    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/message-templates');
            const data = await res.json();
            if (Array.isArray(data)) setTemplates(data);
        } catch { console.error("Failed to load templates"); }
    };
    const fetchScheduledMessages = async () => {
        try {
            const res = await fetch('/api/messages/schedule');
            const data = await res.json();
            if (Array.isArray(data)) setScheduledMessages(data);
        } catch { console.error("Failed to load scheduled messages"); }
    };

    useEffect(() => { fetchHistory(); fetchPrompts(); fetchTemplates(); fetchScheduledMessages(); }, []);

    const handleSaveTemplate = async () => {
        if (!newTemplateName || !newTemplateContent) { toast.warning("Nome e conteúdo são obrigatórios."); return; }
        try {
            const url = editingTemplateId ? `/api/message-templates/${editingTemplateId}` : '/api/message-templates';
            const method = editingTemplateId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newTemplateName, content: newTemplateContent }) });
            if (res.ok) {
                toast.success(editingTemplateId ? "Modelo atualizado!" : "Modelo criado!");
                fetchTemplates(); setNewTemplateName(""); setNewTemplateContent(""); setEditingTemplateId(null);
            } else { toast.error("Erro ao salvar modelo."); }
        } catch { toast.error("Erro de conexão."); }
    };
    const handleDeleteTemplate = async (id: string) => {
        if (!confirm("Excluir este modelo?")) return;
        try {
            const res = await fetch(`/api/message-templates/${id}`, { method: 'DELETE' });
            if (res.ok) { toast.success("Modelo excluído."); fetchTemplates(); }
        } catch { toast.error("Erro ao excluir."); }
    };
    const handleSelectTemplate = (content: string) => { setMessage(content); setIsTemplatesOpen(false); toast.info("Modelo aplicado!"); };
    const startEditing = (t: MessageTemplate) => { setNewTemplateName(t.name); setNewTemplateContent(t.content); setEditingTemplateId(t.id); };

    const insertFormat = (format: string) => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const markers: Record<string, string> = { 'bold': '*', 'italic': '_', 'strike': '~', 'code': '```' };
        const marker = markers[format];
        if (!marker) return;
        const selectedText = text.substring(start, end);
        const newText = text.substring(0, start) + marker + selectedText + marker + text.substring(end);
        setMessage(newText);
        setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + marker.length, end + marker.length); }, 0);
    };

    const handleRewrite = async (promptId?: string) => {
        const idToUse = promptId || mensagensPromptId;
        if (!idToUse) { setShowPromptSelect(!showPromptSelect); return; }
        if (!message.trim()) { toast.warning("Digite uma mensagem primeiro."); return; }
        setRewriting(true);
        const toastId = toast.loading("Reescrevendo com IA...");
        try {
            const res = await fetch('/api/messages/rewrite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: message, promptId: idToUse }) });
            const data = await res.json();
            if (res.ok) { setMessage(data.rewritten); toast.success("Mensagem reescrita!", { id: toastId }); setShowPromptSelect(false); }
            else { toast.error(`Erro: ${data.error}`, { id: toastId }); }
        } catch { toast.error("Erro ao conectar com a IA.", { id: toastId }); } finally { setRewriting(false); }
    };

    const handleSend = async () => {
        if (selectedGroupIds.length === 0) { toast.warning("Selecione pelo menos um grupo."); return; }
        if (message.trim() === "") { toast.warning("Digite uma mensagem."); return; }
        if (!confirm(`Tem certeza que deseja enviar esta mensagem para ${selectedGroupIds.length} grupos?`)) return;
        setSending(true);
        const toastId = toast.loading("Enviando mensagens...");
        try {
            const res = await fetch('/api/messages/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groupIds: selectedGroupIds, message }) });
            const data = await res.json();
            if (res.ok) { toast.success(`Enviado! (${data.successCount} ok, ${data.failCount} erros)`, { id: toastId }); setMessage(""); fetchHistory(); }
            else { toast.error(`Erro: ${data.error}`, { id: toastId }); }
        } catch { toast.error("Erro de conexão.", { id: toastId }); } finally { setSending(false); }
    };

    const handleSchedule = async () => {
        if (selectedGroupIds.length === 0) { toast.warning("Selecione pelo menos um grupo."); return; }
        if (message.trim() === "") { toast.warning("Digite uma mensagem."); return; }
        if (!scheduledDate) { toast.warning("Selecione uma data e hora."); return; }

        const scheduleTime = new Date(scheduledDate).getTime();
        if (scheduleTime <= Date.now()) { toast.warning("A data de agendamento deve ser no futuro."); return; }

        if (!confirm(`Tem certeza que deseja agendar esta mensagem para ${selectedGroupIds.length} grupos?`)) return;
        setScheduling(true);
        const toastId = toast.loading("Agendando mensagem...");
        try {
            const res = await fetch('/api/messages/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipients: selectedGroupIds, message, scheduledAt: new Date(scheduledDate).toISOString() })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Mensagem agendada com sucesso!`, { id: toastId });
                setMessage("");
                setScheduledDate("");
                fetchScheduledMessages();
            }
            else { toast.error(`Erro: ${data.error}`, { id: toastId }); }
        } catch { toast.error("Erro de conexão.", { id: toastId }); } finally { setScheduling(false); }
    };

    const handleCancelSchedule = async (id: string) => {
        if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
        try {
            const res = await fetch(`/api/messages/schedule/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Agendamento cancelado.");
                fetchScheduledMessages();
            } else {
                toast.error("Erro ao cancelar agendamento.");
            }
        } catch { toast.error("Erro de conexão."); }
    };

    return (
        <div className="p-8 max-w-[1100px] mx-auto space-y-8">
            {/* Header */}
            <header>
                <h1 className="text-2xl font-semibold tracking-tight">Comunicados Gerais</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Envie mensagens de texto em massa para seus grupos.</p>
            </header>

            {/* Composer */}
            <div className="grid gap-5 md:grid-cols-2">
                <Card className="w-full md:w-80 shrink-0 h-80 md:h-[calc(100vh-140px)] flex flex-col border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Destinatários</CardTitle>
                        <CardDescription>Selecione os grupos de destino.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <GroupSelector selectedGroupIds={selectedGroupIds} onSelectionChange={setSelectedGroupIds} />
                    </CardContent>
                </Card>

                <Card className="flex flex-col border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Mensagem</CardTitle>
                        <CardDescription>Escreva o conteúdo do comunicado.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex gap-0.5">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 font-bold text-xs" onClick={() => insertFormat('bold')} title="Negrito">B</Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 italic font-serif text-xs" onClick={() => insertFormat('italic')} title="Itálico">I</Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 line-through text-xs" onClick={() => insertFormat('strike')} title="Tachado">S</Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertFormat('code')} title="Código"><Code className="h-3.5 w-3.5" /></Button>

                                <div className="w-px h-5 bg-border mx-1.5 self-center" />

                                <Dialog open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground" title="Modelos">
                                            <LayoutTemplate className="h-3.5 w-3.5" /> Modelos
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[700px]">
                                        <DialogHeader>
                                            <DialogTitle>Modelos de Mensagens</DialogTitle>
                                            <DialogDescription>Salve textos frequentes para reutilizar com um clique.</DialogDescription>
                                        </DialogHeader>
                                        <div className="flex gap-4 h-[400px]">
                                            <div className="w-1/3 border-r pr-4 space-y-2 overflow-y-auto">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="font-semibold text-sm">Salvos</h3>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingTemplateId(null); setNewTemplateName(""); setNewTemplateContent(""); }}><Plus className="h-4 w-4" /></Button>
                                                </div>
                                                {templates.map(t => (
                                                    <div key={t.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                                                        <span className="text-sm truncate flex-1" onClick={() => handleSelectTemplate(t.content)}>{t.name}</span>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); startEditing(t); }}><Pencil className="h-3 w-3" /></Button>
                                                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }}><Trash className="h-3 w-3" /></Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {templates.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum modelo.</p>}
                                            </div>
                                            <div className="flex-1 flex flex-col gap-4">
                                                <h3 className="font-semibold text-sm">{editingTemplateId ? "Editar Modelo" : "Novo Modelo"}</h3>
                                                <Input placeholder="Nome do Modelo (ex: Bom dia)" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} />
                                                <Textarea placeholder="Escreva o conteúdo da mensagem..." className="flex-1 resize-none font-sans" value={newTemplateContent} onChange={e => setNewTemplateContent(e.target.value)} />
                                                <div className="flex justify-end gap-2">
                                                    {editingTemplateId && <Button variant="ghost" onClick={() => { setEditingTemplateId(null); setNewTemplateName(""); setNewTemplateContent(""); }}>Cancelar</Button>}
                                                    <Button onClick={handleSaveTemplate} disabled={!newTemplateName || !newTemplateContent}>{editingTemplateId ? "Atualizar" : "Salvar Modelo"}</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* AI Rewrite */}
                            <div className="relative flex items-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={`h-7 gap-1.5 text-xs text-[#0d9488] border-[#0d9488]/20 bg-[#0d9488]/5 hover:bg-[#0d9488]/10 ${mensagensPromptId ? 'rounded-r-none border-r-0' : ''}`}
                                    onClick={() => handleRewrite(undefined)}
                                    disabled={rewriting}
                                >
                                    <Sparkles className="h-3 w-3" /> {mensagensPromptId ? "Reescrever" : "IA"}
                                </Button>
                                {mensagensPromptId && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-1.5 text-[#0d9488] border-[#0d9488]/20 bg-[#0d9488]/5 hover:bg-[#0d9488]/10 rounded-l-none border-l-0"
                                        onClick={() => setShowPromptSelect(!showPromptSelect)}
                                        disabled={rewriting}
                                    >
                                        <span className="text-[10px]">▼</span>
                                    </Button>
                                )}
                                {showPromptSelect && (
                                    <div className="absolute right-0 top-9 w-56 bg-card border rounded-lg shadow-lg z-20 p-1.5">
                                        <p className="text-[10px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">Prompt:</p>
                                        {prompts.length === 0 ? (
                                            <div className="text-xs text-center p-3 text-muted-foreground">
                                                Nenhum prompt criado.<br />
                                                <Link href="/settings" className="text-primary hover:underline">Ir para Configurações</Link>
                                            </div>
                                        ) : (
                                            prompts.map(p => (
                                                <Button key={p.id} variant="ghost" size="sm" className={`w-full justify-start h-auto py-1.5 px-2 text-xs rounded-md ${p.id === mensagensPromptId ? 'font-semibold bg-muted/50' : ''}`} onClick={() => handleRewrite(p.id)}>
                                                    {p.name} {p.id === mensagensPromptId && <Badge variant="secondary" className="ml-auto text-[9px] px-1 py-0">Padrão</Badge>}
                                                </Button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Textarea
                            placeholder="Digite sua mensagem aqui..."
                            className="min-h-[220px] resize-none text-sm"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />

                        <div className="flex flex-col gap-2 mt-4 pr-1">
                            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200/50 p-2.5 rounded-lg mb-2">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                <span>Esta ação enviará mensagens reais para os grupos selecionados.</span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-1">
                                <Label className="text-sm font-medium whitespace-nowrap">Agendar para:</Label>
                                <Input
                                    type="datetime-local"
                                    className="w-full sm:max-w-[220px] h-9"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                />
                                {scheduledDate && <Button variant="ghost" size="sm" onClick={() => setScheduledDate("")} className="text-xs h-8 w-fit text-muted-foreground hover:text-foreground">Limpar</Button>}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/20 p-4 flex flex-col sm:flex-row gap-3">
                        <Button className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" size="lg" onClick={handleSend} disabled={sending || scheduling || selectedGroupIds.length === 0 || message.trim() === ""}>
                            {sending ? "Enviando..." : <><Send className="mr-2 h-4 w-4" /> Enviar Agora</>}
                        </Button>
                        <Button className="w-full sm:flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white" size="lg" onClick={handleSchedule} disabled={scheduling || sending || !scheduledDate || selectedGroupIds.length === 0 || message.trim() === ""}>
                            {scheduling ? "Agendando..." : <><CalendarClock className="mr-2 h-4 w-4" /> Agendar Comunicado</>}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* History and Scheduled */}
            <div className="space-y-4">
                <Tabs defaultValue="history" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                        <TabsTrigger value="history" className="flex items-center gap-2">
                            <History className="h-4 w-4" /> Histórico
                        </TabsTrigger>
                        <TabsTrigger value="scheduled" className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4" /> Agendamentos
                            {scheduledMessages.length > 0 && (
                                <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-4 min-w-4 flex items-center justify-center rounded-full text-[10px]">
                                    {scheduledMessages.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="history" className="mt-4">
                        <div className="grid gap-3">
                            {history.length === 0 ? (
                                <Card className="bg-muted/20 border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <Send className="h-8 w-8 opacity-20 mb-2" />
                                        <p className="text-sm">Nenhum envio registrado.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                history.map((item) => {
                                    const isSuccess = item.failCount === 0;
                                    const isPartial = item.failCount > 0 && item.successCount > 0;
                                    let recipientNames = "Desconhecido";
                                    try { const parsed = JSON.parse(item.recipients); if (Array.isArray(parsed)) recipientNames = parsed.join(", "); } catch { recipientNames = item.recipients; }

                                    return (
                                        <Link key={item.id} href={`/messages/${item.id}`}>
                                            <Card className="hover:shadow-md transition-all cursor-pointer border-l-[3px] border-l-transparent hover:border-l-primary group">
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <div className="space-y-0.5 min-w-0 flex-1">
                                                        <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors">
                                                            {new Date(item.createdAt).toLocaleString('pt-BR')}
                                                        </CardTitle>
                                                        <p className="text-xs text-muted-foreground truncate">Para: <span className="font-medium text-foreground/80">{recipientNames}</span></p>
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`shrink-0 text-[11px] font-medium border-0 ${isSuccess ? 'bg-emerald-100 text-emerald-700' :
                                                            isPartial ? 'bg-amber-100 text-amber-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}
                                                    >
                                                        {isSuccess ? <CheckCircle2 className="h-3 w-3 mr-1" /> : isPartial ? <Clock className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                                        {isSuccess ? 'Sucesso' : isPartial ? 'Parcial' : 'Falha'}
                                                    </Badge>
                                                </CardHeader>
                                                <CardContent className="pb-2">
                                                    <div className="bg-muted/40 p-2.5 rounded-lg text-xs text-muted-foreground whitespace-pre-wrap line-clamp-2">{item.message}</div>
                                                </CardContent>
                                                <CardFooter className="text-[10px] text-muted-foreground flex justify-between pt-0 pb-3 px-6">
                                                    <span>ID: {item.id.substring(0, 8)}</span>
                                                    <span>{item.successCount} Enviados / {item.failCount} Erros</span>
                                                </CardFooter>
                                            </Card>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="scheduled" className="mt-4">
                        <div className="grid gap-3">
                            {scheduledMessages.length === 0 ? (
                                <Card className="bg-muted/20 border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <CalendarClock className="h-8 w-8 opacity-20 mb-2" />
                                        <p className="text-sm">Nenhum envio agendado.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                scheduledMessages.map((item) => {
                                    let recipientNames = "Desconhecido";
                                    try { const parsed = JSON.parse(item.recipients); if (Array.isArray(parsed)) recipientNames = `[${parsed.length} grupos selecionados]`; } catch { recipientNames = item.recipients; }

                                    return (
                                        <Card key={item.id} className={`border-l-[3px] ${(item as any).status === 'SENT' ? 'border-l-emerald-500' :
                                            (item as any).status === 'PARTIAL' ? 'border-l-amber-500' :
                                                (item as any).status === 'FAILED' ? 'border-l-red-500' :
                                                    'border-l-amber-500'
                                            }`}>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <div className="space-y-0.5 min-w-0 flex-1">
                                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                                        <Clock className={`h-3.5 w-3.5 ${(item as any).status === 'SENT' ? 'text-emerald-600' :
                                                            (item as any).status === 'PARTIAL' ? 'text-amber-600' :
                                                                (item as any).status === 'FAILED' ? 'text-red-600' :
                                                                    'text-amber-600'
                                                            }`} />
                                                        Agendado para: {new Date(item.scheduledAt).toLocaleString('pt-BR')}
                                                    </CardTitle>
                                                    <p className="text-xs text-muted-foreground truncate">Para: <span className="font-medium text-foreground/80">{recipientNames}</span></p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`text-[11px] font-medium border-0 ${(item as any).status === 'SENT' ? 'bg-emerald-100 text-emerald-700' :
                                                        (item as any).status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                                                            (item as any).status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-50 border border-amber-200 text-amber-600'
                                                        }`}>
                                                        {(item as any).status === 'SENT' ? 'Sucesso' :
                                                            (item as any).status === 'PARTIAL' ? 'Parcial' :
                                                                (item as any).status === 'FAILED' ? 'Falha' :
                                                                    'Pendente'}
                                                    </Badge>
                                                    {(item as any).status === 'PENDING' && (
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.preventDefault(); handleCancelSchedule(item.id); }} title="Cancelar Agendamento">
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pb-3">
                                                <div className="bg-muted/40 p-2.5 rounded-lg text-xs text-muted-foreground whitespace-pre-wrap line-clamp-2">{item.message}</div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
