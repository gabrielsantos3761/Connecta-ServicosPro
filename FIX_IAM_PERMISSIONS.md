# Corrigir Permissões IAM para Custom Tokens

## Problema
A Cloud Function `createSession` está falhando com erro:
```
Permission 'iam.serviceAccounts.signBlob' denied
```

Isso acontece porque o Firebase Admin SDK precisa da permissão `Service Account Token Creator` para gerar custom tokens.

## Solução 1: Via Firebase Console (Recomendado)

1. Acesse: https://console.cloud.google.com/iam-admin/iam?project=connecta-servicospro

2. Encontre o service account:
   ```
   479400117544-compute@developer.gserviceaccount.com
   ```

3. Clique em "Edit" (lápis) ao lado do service account

4. Clique em "ADD ANOTHER ROLE"

5. Busque e selecione: **Service Account Token Creator**

6. Clique em "SAVE"

## Solução 2: Via gcloud CLI

Execute este comando no terminal (requer gcloud CLI instalado):

```bash
gcloud iam service-accounts add-iam-policy-binding \
  479400117544-compute@developer.gserviceaccount.com \
  --member="serviceAccount:479400117544-compute@developer.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project=connecta-servicospro
```

## Solução 3: Via Firebase Console (Alternativa)

1. Acesse: https://console.firebase.google.com/project/connecta-servicospro/settings/serviceaccounts/adminsdk

2. Clique em "Manage service account permissions"

3. Isso abrirá o Google Cloud Console IAM

4. Siga os passos da Solução 1

## Verificação

Após adicionar a permissão:

1. Aguarde 1-2 minutos para a permissão propagar
2. Tente fazer login novamente
3. A função `createSession` deve funcionar corretamente

## Notas de Segurança

- Esta permissão é necessária e segura para criar custom tokens
- A permissão é restrita ao próprio service account (não expõe APIs externas)
- Esta é uma prática padrão recomendada pelo Firebase para custom tokens
