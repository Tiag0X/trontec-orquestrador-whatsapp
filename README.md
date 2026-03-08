# Trontec WhatsApp Orchestrator

> **Plataforma Inteligente de Gestão de Comunicações via WhatsApp**
>
> Integra a **Evolution API** com a **OpenAI** para automatizar o monitoramento de grupos, gerar resumos executivos, orquestrar envios em massa e agendar disparos futuros com mensagens aprimoradas por IA.

---

## Funcionalidades Principais

- **Resumos Executivos com IA**: Processa automaticamente as mensagens diárias dos grupos em relatórios executivos concisos e acionáveis.
- **Broadcast Inteligente**: Envia mensagens para múltiplos grupos simultaneamente com refinamento de conteúdo via IA.
- **Agendamento de Comunicados**: Agende disparos para uma data e hora futuras. Um worker (Cron) independente processará o envio automaticamente.
- **Enriquecimento de Contatos**: Sincroniza e enriquece perfis de contatos automaticamente com dados de negócios e fotos de perfil.
- **Biblioteca de Prompts**: Gerenciamento centralizado de personas de IA e modelos de mensagens.
- **Agendador Automático (Worker)**: Processo independente em background para geração recorrente de relatórios e tarefas de sincronização.
- **Dashboard de Monitoramento**: Status em tempo real das APIs, workers e saúde do sistema.
- **Interface Responsiva**: Layout otimizado para Desktop e Mobile com navegação adaptativa (Sidebar e Menu Hambúrguer).

---

## Stack Tecnológica

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/) |
| **Estilização** | [Tailwind CSS 4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/) |
| **Backend** | [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) |
| **Banco de Dados** | [Prisma ORM](https://www.prisma.io/), [SQLite](https://sqlite.org/) |
| **Integrações** | [Evolution API](https://evolution-api.com/), [OpenAI SDK](https://github.com/openai/openai-node), [LangChain](https://www.langchain.com/) |
| **Automação** | [Node-Cron](https://github.com/node-cron/node-cron), [PM2](https://pm2.io/) |

---

## Pré-requisitos

Antes de iniciar, certifique-se de ter os seguintes componentes instalados e acessíveis:

| Componente | Versão | Obrigatório | Observação |
|------------|--------|-------------|------------|
| **Node.js** | 20.x LTS ou superior | Sim | Verifique com `node -v`. |
| **npm** | 10.x ou superior | Sim | Incluído com o Node.js. |
| **Git** | Qualquer versão | Sim | Para clonar o repositório. |
| **Evolution API** | Instância ativa | Sim | Você precisa da URL e do Token de API. |
| **OpenAI API Key** | GPT-4o / GPT-4o-mini | Sim | Chave `sk-...` para geração de relatórios e reescrita IA. |

---

## Instalação

### Opção A: Instalação Manual (Windows, macOS, Linux)

#### 1. Clonar o Repositório

```bash
git clone https://github.com/Tiag0X/trontec-whatsapp.git
cd trontec-whatsapp
```

#### 2. Instalar Dependências

```bash
npm install
```

#### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# ============================================
# OBRIGATÓRIAS
# ============================================

# Senha de acesso à interface web e API
APP_PASSWORD=sua_senha_segura_aqui

# Caminho do banco de dados SQLite (não alterar)
DATABASE_URL="file:./prisma/dev.db"

# ============================================
# OPCIONAIS (podem ser configuradas via UI)
# ============================================

# Evolution API - Conexão com WhatsApp
# EVOLUTION_API_URL=https://sua-instancia.evolution.api
# EVOLUTION_API_TOKEN=seu_token_aqui

# OpenAI - Inteligência Artificial
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

> **Nota**: As chaves `EVOLUTION_API_URL`, `EVOLUTION_API_TOKEN` e `OPENAI_API_KEY` também podem ser configuradas pela interface web em **Configurações** (`/settings`). Se informadas no `.env`, elas serão usadas como valores padrão na primeira execução.

#### 4. Inicializar o Banco de Dados

```bash
npx prisma generate
npx prisma db push
```

Esse comando cria o arquivo SQLite (`prisma/dev.db`) e aplica o schema completo (Grupos, Contatos, Relatórios, Agendamentos, etc).

#### 5. Iniciar em Modo Desenvolvimento

```bash
npm run dev:all
```

Esse comando inicia simultaneamente:
- **Interface Web**: [http://localhost:3000](http://localhost:3000)
- **Worker de Background**: Agendador (Cron) para relatórios automáticos e disparos programados.

---

### Opção B: Instalação Automatizada (Linux - Ubuntu/Debian)

O script `install.sh` automatiza todo o processo: instala Git, Node.js 20, dependências, configura o `.env`, cria o banco de dados e gera o build de produção.

```bash
chmod +x install.sh
./install.sh
```

O script executa as seguintes etapas:
1. Verifica se a porta 3000 está ocupada.
2. Instala `git` e `Node.js 20` se necessário.
3. Clona o repositório (ou usa o diretório atual).
4. Executa `npm install`.
5. Cria o arquivo `.env` com valores padrão.
6. Executa `npx prisma generate` e `npx prisma db push`.
7. Gera o build de produção (`npm run build`).

Após a instalação, inicie o servidor:

```bash
npm start
```

---

## Referência Completa de Variáveis de Ambiente

| Variável | Tipo | Obrigatória | Padrão | Descrição |
|----------|------|-------------|--------|-----------|
| `APP_PASSWORD` | string | Sim | `admin` | Senha mestra para acesso à interface e API. |
| `DATABASE_URL` | string | Sim | `file:./prisma/dev.db` | URL de conexão do banco de dados SQLite (Prisma). |
| `EVOLUTION_API_URL` | string | Não* | — | URL base da instância da Evolution API. |
| `EVOLUTION_API_TOKEN` | string | Não* | — | Token de autenticação da Evolution API. |
| `OPENAI_API_KEY` | string | Não* | — | Chave de API da OpenAI (GPT-4o/GPT-4o-mini). |
| `PORT` | number | Não | `3000` | Porta do servidor Next.js (para deploy customizado). |

> *Estas variáveis podem ser configuradas **alternativamente** pela interface web em `/settings`.

---

## Deploy em Produção (VPS/Servidor Linux)

### Passo 1: Build de Produção

Após a instalação e configuração do `.env`:

```bash
npm run build
```

### Passo 2: Iniciar com PM2 (Recomendado)

O **PM2** é um gerenciador de processos que mantém a aplicação rodando 24/7, com reinício automático em caso de falhas.

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar a aplicação web (Next.js)
pm2 start "npm start" --name trontec-app

# Iniciar o worker de background (Agendador/Cron)
pm2 start "npm run worker" --name trontec-worker

# Configurar para reiniciar automaticamente com o sistema
pm2 startup
pm2 save
```

### Monitoramento com PM2

```bash
# Ver status de todos os processos
pm2 status

# Ver logs em tempo real
pm2 logs

# Ver logs de um processo específico
pm2 logs trontec-app
pm2 logs trontec-worker

# Reiniciar um processo
pm2 restart trontec-app

# Parar todos os processos
pm2 stop all
```

### Atualização de Sistema em Produção

Quando uma nova versão do Orchestrator for disponibilizada no repositório, você pode atualizar de duas formas:

**Opção Rápida (Script Automatizado):**
```bash
chmod +x update.sh
./update.sh
```

O script `update.sh` executa automaticamente: parada do PM2, backup do banco, `git pull`, `npm install`, migrações Prisma, build de produção e reinício dos processos.

**Opção Manual — Passo a passo:**

Siga este procedimento para atualizar **sem perder dados ou configurações**:

#### 1. Acessar o servidor e entrar no diretório do projeto

```bash
cd /caminho/para/trontec-whatsapp
```

#### 2. Parar os processos ativos

```bash
pm2 stop trontec-app trontec-worker
```

#### 3. Fazer backup do banco de dados (recomendado)

```bash
cp prisma/dev.db prisma/dev.db.backup
```

#### 4. Puxar as atualizações do repositório

```bash
git pull origin master
```

> Se houver conflitos no `.env` ou em arquivos locais, resolva-os manualmente antes de prosseguir.

#### 5. Instalar/atualizar dependências

```bash
npm install
```

#### 6. Aplicar migrações do banco de dados

```bash
npx prisma generate
npx prisma db push
```

> O comando `db push` aplica novas tabelas e colunas do schema sem apagar dados existentes. Caso o Prisma solicite confirmação de perda de dados, avalie cuidadosamente antes de aceitar.

#### 7. Gerar novo build de produção

```bash
npm run build
```

#### 8. Reiniciar os processos

```bash
pm2 restart trontec-app trontec-worker
```

#### 9. Verificar se tudo subiu corretamente

```bash
pm2 status
pm2 logs --lines 20
```

#### Resumo Rápido (Copiar e Colar)

Para facilitar, aqui estão todos os comandos em sequência:

```bash
cd /caminho/para/trontec-whatsapp
pm2 stop trontec-app trontec-worker
cp prisma/dev.db prisma/dev.db.backup
git pull origin master
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart trontec-app trontec-worker
pm2 status
```

---

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia apenas o servidor Next.js em modo desenvolvimento. |
| `npm run dev:all` | Inicia o servidor + worker de background (desenvolvimento). |
| `npm run build` | Gera o build de produção otimizado do Next.js. |
| `npm start` | Inicia o servidor Next.js em modo produção. |
| `npm run worker` | Inicia o worker de background (Cron) isoladamente. |
| `npm run lint` | Executa o linter (ESLint) no projeto. |

---

## Visão Geral da API

O sistema expõe endpoints REST para automação e integração externa. Todas as rotas requerem o header `password` com o valor de `APP_PASSWORD`.

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/process` | `POST` | Dispara geração manual de relatórios. |
| `/api/reports` | `GET` | Lista todos os relatórios gerados. |
| `/api/reports/{id}` | `GET` | Obtém detalhes de um relatório. |
| `/api/messages/send` | `POST` | Envia mensagens broadcast para grupos. |
| `/api/messages/schedule` | `POST` | Agenda um disparo futuro. |
| `/api/messages/schedule` | `GET` | Lista agendamentos (pendentes, enviados, falhos). |
| `/api/messages/schedule/{id}` | `DELETE` | Cancela um agendamento pendente. |
| `/api/messages/rewrite` | `POST` | Reescreve texto usando IA (LLM). |
| `/api/contacts/sync` | `POST` | Sincroniza contatos da Evolution API. |
| `/api/contacts/enrich` | `POST` | Enriquece perfis de contatos com IA. |
| `/api/groups` | `GET` | Lista grupos do banco local. |
| `/api/groups/remote` | `GET` | Busca grupos diretamente da Evolution API. |
| `/api/stats/dashboard` | `GET` | Obtém estatísticas do dashboard. |
| `/api/settings` | `POST` | Atualiza configurações do sistema. |

> Para documentação técnica detalhada (payloads, tipos, exemplos de request/response), consulte **[API.md](./API.md)**.

---

## Troubleshooting (Solução de Problemas)

### O servidor não inicia

```bash
# Verifique se a porta 3000 está livre
# Linux:
lsof -i :3000
# Windows (PowerShell):
netstat -ano | findstr :3000
```

### Erro "DATABASE_URL not set"

Certifique-se de que o arquivo `.env` existe na raiz do projeto e contém:
```env
DATABASE_URL="file:./prisma/dev.db"
```

### Erro do Prisma: "Table does not exist"

Execute os comandos de inicialização do banco:
```bash
npx prisma generate
npx prisma db push
```

### Worker não processa agendamentos

Verifique se o processo worker está rodando:
```bash
# Desenvolvimento
npm run dev:all  # Inicia ambos automaticamente

# Produção (PM2)
pm2 status       # Verifique se 'trontec-worker' está 'online'
pm2 logs trontec-worker  # Verifique os logs do worker
```

### Evolution API não conecta

1. Verifique se a URL e o Token estão corretos em **Configurações** (`/settings`).
2. Certifique-se de que a instância da Evolution API está online e acessível a partir do servidor onde o Orchestrator está rodando.
3. Teste a conectividade manualmente:
```bash
curl -H "apikey: SEU_TOKEN" https://SUA_URL/instance/fetchInstances
```

---

## Segurança

- **Autenticação**: Todas as rotas sensíveis (UI e API) são protegidas por `APP_PASSWORD`.
- **Variáveis Sensíveis**: Chaves de API (OpenAI e Evolution) podem ser armazenadas no banco de dados via interface ou no `.env`.
- **Isolamento do Worker**: O agendador roda em processo separado, garantindo que falhas no worker não afetam a interface principal.
- **Banco Local**: O SQLite armazena dados localmente no servidor. Não há conexão com bancos externos.

---

## Licença

Distribuído sob a **Licença MIT**. Desenvolvido por **Trontec**.

---

> Construído com dedicação e IA para a próxima geração de gestão de WhatsApp.
