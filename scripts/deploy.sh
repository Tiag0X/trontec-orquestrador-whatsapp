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
echo "📦 [1/6] Protegendo o Banco de Dados (Backup e Isolamento)..."
if [ -f "prisma/dev.db" ]; then
    cp prisma/dev.db prisma/dev_safe_backup_$(date +%F_%H-%M-%S).db
    mv prisma/dev.db prisma/dev.db.bak
fi
if [ -f "prisma/prisma/dev.db" ]; then
    cp prisma/prisma/dev.db prisma/dev_safe_backup_$(date +%F_%H-%M-%S).db
    mv prisma/prisma/dev.db prisma/prisma/dev.db.bak
fi

echo ""
echo "📥 [2/6] Baixando atualizações do GitHub e limpando rastros..."
git stash || true
git reset --hard HEAD || true
git pull origin master

echo ""
echo "🔧 [3/6] Restaurando Banco de Dados e removendo do Git..."
if [ -f "prisma/dev.db.bak" ]; then
    mv prisma/dev.db.bak prisma/dev.db
fi
if [ -f "prisma/prisma/dev.db.bak" ]; then
    mv prisma/prisma/dev.db.bak prisma/prisma/dev.db
fi
git rm --cached prisma/dev.db 2>/dev/null || true
git rm --cached prisma/prisma/dev.db 2>/dev/null || true

echo ""
echo "npm [4/6] Instalando dependências e Gerando cliente Prisma..."
npm install
npx prisma generate

echo ""
echo "🗄️ [5/6] Aplicando Estrutura no Banco de Dados..."
npx prisma db push --accept-data-loss

echo ""
echo "🏗️ [6/6] Compilando a aplicação (Build) e Reiniciando Servidor..."
npm run build
pm2 restart all

echo ""
echo "================================================="
echo "✅ DEPLOY CONCLUIDO COM SUCESSO!"
echo "================================================="
pm2 status
