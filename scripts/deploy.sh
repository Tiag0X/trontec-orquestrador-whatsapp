#!/bin/bash
set -e

echo "================================================="
echo "🚀 Iniciando Deploy - Trontec WhatsApp"
echo "================================================="

DIR="/root/trontec-whatsapp"
if [ ! -d "$DIR" ]; then
    echo "Erro: O diretório do projeto ($DIR) não foi encontrado no servidor."
    exit 1
fi

cd $DIR

echo ""
echo "📦 [1/6] Criando backup de segurança do banco de dados..."
# Garantir que exista um dev.db antes de copiar, para não parar o script atoa
if [ -f "prisma/dev.db" ]; then
    cp prisma/dev.db prisma/dev_safe_backup_$(date +%F_%H-%M-%S).db
    echo "   -> Backup do dev.db criado com sucesso."
elif [ -f "prisma/prisma/dev.db" ]; then
    cp prisma/prisma/dev.db prisma/dev_safe_backup_$(date +%F_%H-%M-%S).db
    echo "   -> Backup do prisma/dev.db criado com sucesso."
else
    echo "   -> Nenhum banco dev.db encontrado para backup."
fi

echo ""
echo "📥 [2/6] Baixando atualizações do GitHub..."
git stash || true
git checkout master || true
git pull origin master

echo ""
echo "🔧 [3/6] Removendo tracking do banco (se houver)..."
git rm --cached prisma/dev.db 2>/dev/null || true
git rm --cached prisma/prisma/dev.db 2>/dev/null || true

echo ""
echo "npm [4/6] Instalando dependências e Gerando cliente Prisma..."
npm install
npx prisma generate

echo ""
echo "🗄️ [5/6] Aplicando Migrations no Banco de Dados..."
npx prisma migrate deploy

echo ""
echo "🏗️ [6/6] Compilando a aplicação (Build) e Reiniciando Servidor..."
npm run build
pm2 restart all

echo ""
echo "================================================="
echo "✅ DEPLOY CONCLUIDO COM SUCESSO!"
echo "================================================="
pm2 status
