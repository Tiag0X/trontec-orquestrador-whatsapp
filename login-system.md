# Implementação de Sistema de Login e Perfis

## Goal
Implementar autenticação baseada em JWT com JWT/Edge, criar perfis de usuário (Admin, User) e restringir o acesso a áreas do Orquestrador (Configurações) apenas para administradores.

## Tasks
- [x] Task 1: Adicionar o model `User` no `prisma/schema.prisma` com `email`, `passwordHash` e `role` (Admin/User) → Verify: Comando `npx prisma db push` executa com sucesso.
- [x] Task 2: Criar script de seed (`scripts/seed-admin.ts`) para injetar o primeiro usuário Admin no banco → Verify: Usuário existe após rodar o script.
- [x] Task 3: Instalar as bibliotecas de criptografia e JWT (`jose`, `bcryptjs`) → Verify: As dependências aparecem no `package.json`.
- [x] Task 4: Criar funções de validação de senha e geração de token JWT usando a biblioteca `jose` (para suportar o Edge Runtime do Next.js) → Verify: Funções compilam e rodam nos testes manuais.
- [x] Task 5: Adaptar ou criar a rota `/api/auth/login` para checar no banco, verificar o hash e injetar o cookie HTTP-only seguro → Verify: Rota responde `200 OK` e envia o cookie em requisições corretas.
- [x] Task 6: Atualizar o arquivo `middleware.ts` para abrir, verificar a role no JWT e proteger rotas sensíveis como `/settings` → Verify: Redirecionamento 401/403 ocorre corretamente para perfis não autorizados ou sem logar.
- [x] Task 7: Atualizar a página `app/login/page.tsx` para usar a nova API de autenticação com dados reais → Verify: Login funciona no navegador.
- [x] Task 8: Atualizar componentes visuais (ex: `app-sidebar.tsx`) para ocultar ou desabilitar links bloqueados (Orquestrador) se o usuário logado não for Admin → Verify: Links bloqueados não aparecem em visualizações de User.

## Done When
- [x] Um usuário pode fazer login usando email e senha validados no banco de dados SQLite.
- [x] Perfis estão implementados via Role-Based Access Control (RBAC).
- [x] Áreas sensíveis (Orquestrador / Settings) rejeitam acessos de perfis sem permissão tanto na interface do usuário (UI) quanto via rotas de API/Middleware.
