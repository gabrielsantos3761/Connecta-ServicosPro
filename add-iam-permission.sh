#!/bin/bash
# Script para adicionar permissão IAM ao Compute Engine Service Account
# Execute este script no Cloud Shell do Google Cloud Console

# Projeto Firebase
PROJECT_ID="connecta-servicospro"

# Service Account do Compute Engine
SERVICE_ACCOUNT="479400117544-compute@developer.gserviceaccount.com"

# Role necessária para criar custom tokens
ROLE="roles/iam.serviceAccountTokenCreator"

echo "🔧 Adicionando permissão IAM..."
echo "Projeto: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT"
echo "Role: $ROLE"
echo ""

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="$ROLE"

echo ""
echo "✅ Permissão adicionada com sucesso!"
echo ""
echo "Aguarde 1-2 minutos para a permissão propagar e tente fazer login novamente."
