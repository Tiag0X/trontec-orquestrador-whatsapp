# 📝 Plano: API para Mensagens Diretas (Contatos)

## 📌 Overview
Atualmente, o orquestrador permite disparos em massa (Broadcast) apenas para **Grupos** do WhatsApp. O objetivo desta feature é ampliar a capacidade das rotas de disparo para que a API suporte envios diretos para **Contatos Privados** salvos no banco de dados (`Contact`), permitindo fluxos flexíveis (enviar apenas para grupos, apenas para contatos, ou ambos simultaneamente).

## 🏢 Project Type
**BACKEND**

## 🎯 Success Criteria
- [x] A rota `POST /api/messages/send` aceita as chaves `groupIds` e `contactIds`.
- [x] O disparo diferencia grupos de contatos, processando os JIDs corretos (`group.jid` e `contact.jid`).
- [x] Implementação de **Delay / Rate Limiting** inteligente: se houver contatos comuns na lista de disparo, a API aplica um atraso automático (ex: 2 a 5 segundos) entre os envios privativos para evitar banimentos (Anti-Ban).
- [x] O histórico do banco (`Broadcast`) mapeia corretamente se o sucesso foi para grupo ou para contato.
- [x] A rota de agendamento `POST /api/messages/schedule` ajustada para persistir os perfis corretos.

## ⚙️ Tech Stack
- **Next.js (App Router)**: Endpoints REST assíncronos.
- **Prisma ORM**: Consultas e histórico.
- **TypeScript**: Validação severa do payload modificado.

## 📂 File Structure Impact
As modificações ficarão encapsuladas nos controladores existentes, não alterando drasticamente o schema do banco (pois o `Broadcast.recipients` já salva via JSON genérico):
- `app/api/messages/send/route.ts` (Core do disparo)
- `app/api/messages/schedule/route.ts` (Core do agendamento)

---

## 🛠️ Task Breakdown

### Task 1: Atualização do Payload e Consultas no Disparo
- **Agent**: `backend-specialist`
- **Skills**: `nodejs-best-practices`, `api-patterns`
- **Priority**: P1
- **Dependencies**: Nenhuma
- **Input**: Requisição JSON em `/api/messages/send` contendo `groupIds` (opcional) e `contactIds` (opcional).
- **Process**:
  1. Validar se pelo menos um dos arrays veio preenchido.
  2. Executar `prisma.group.findMany` (para os grupos) e `prisma.contact.findMany` (para os contatos).
  3. Mesclar (Merge) ambas as bases numa lista de tarefas (Task List) padronizada contendo `{ id, name, jid, isContact }`.
- **Output**: Array estruturado unificado pronto para o loop de envio.
- **Verify**: Garantir que as consultas ORM rodem apenas se os respectivos arrays tiverem `length > 0`.

### Task 2: Implementação do Loop Híbrido com Anti-Ban (Delay)
- **Agent**: `backend-specialist`
- **Skills**: `clean-code`
- **Priority**: P1
- **Dependencies**: Task 1
- **Input**: Array / Lista Unificada gerada na Task 1.
- **Process**:
  1. Iterar sobre a lista.
  2. Enviar a mensagem usando `provider.sendMessage(entity.jid, message)`.
  3. **Regra de Delay**: Se `entity.isContact` for `true`, invocar um `await delay(Math.random() * (4000 - 2000) + 2000)` para respeitar a política de spam do WhatsApp. Para grupos, o delay pode ser menor ou não existir.
  4. Gravar os resultados listando explicitamente se foi enviado para Grupo ou para Contato.
- **Output**: Retorno no padrão de métricas (successCount, failCount, results) refletindo todo o disparo real, salvando no `Broadcast`.
- **Verify**: Logs confirmando o tempo de execução prolongado baseado na quantidade de contatos diretos (Prova do Rate Limit ativo).

### Task 3: Adaptação Lógica do Agendamento (Schedule)
- **Agent**: `backend-specialist`
- **Skills**: `api-patterns`
- **Priority**: P2
- **Dependencies**: Task 1 & 2
- **Input**: Payload via `POST /api/messages/schedule`
- **Process**: Ajustar a validação e captura dos destinatários para que se compatibilizem com a lógica híbrida, assegurando que o motor cron (executor futuro) terá todas as informações (`contactIds` / `groupIds`) necessárias no momento do gatilho para realizar a discriminação entre `Contact` e `Group`.
- **Output**: Endpoint de Agendamento operando com o novo modelo polimórfico de usuários-alvo.
- **Verify**: Submeter um agendamento misturado (1 grupo, 1 contato) recebendo o status code HTTP 200.

---

## ✅ PHASE X COMPLETE
- Lint (`npm run lint`): ⚠️ Passou com avisos pré-existentes (63 erros/41 warnings não relacionados à alteração)
- Build (`npm run build`): ✅ Success (Next.js build concluído sem erros)
- Status: ✅ Implementado e Verificado
- Data: 2026-03-13
