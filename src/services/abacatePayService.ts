/**
 * Abacate Pay — Serviço de integração via Firebase Cloud Function proxy.
 *
 * Todas as chamadas passam pela função `abacatePayProxy` (server-side),
 * evitando erros de CORS no navegador.
 *
 * Endpoints reais (chamados pela Cloud Function):
 *   POST /pixQrCode/create
 *   GET  /pixQrCode/check?id=
 *   POST /pixQrCode/simulate-payment?id=
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

// ──────────────────────────────────────────────
// TIPOS
// ──────────────────────────────────────────────

export type PixStatus = 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED'

export interface PixQRCode {
  id: string
  /** Valor em centavos */
  amount: number
  status: PixStatus
  devMode: boolean
  /** Código copia-e-cola PIX */
  brCode: string
  /** Imagem do QR Code em Base64 (data:image/png;base64,...) */
  brCodeBase64: string
  platformFee: number
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export interface CreatePixParams {
  /** Valor em reais (ex.: 49.90) — será convertido para centavos na Cloud Function */
  amount: number
  /** Tempo de expiração em segundos (padrão: 1800 = 30 min) */
  expiresIn?: number
  /** Mensagem exibida no pagamento (máx. 37 caracteres) */
  description?: string
  customerName?: string
  customerEmail?: string
  /** Formato: "(11) 9999-9999" */
  customerPhone?: string
  /** CPF no formato "123.456.789-09" */
  customerTaxId?: string
}

// Callable genérico para o proxy
const proxy = httpsCallable<
  { action: string; data: Record<string, unknown> },
  { data: unknown; error: unknown }
>(functions, 'abacatePayProxy')

// ──────────────────────────────────────────────
// CRIAR QRCODE PIX
// ──────────────────────────────────────────────

export async function createPixQRCode(params: CreatePixParams): Promise<PixQRCode> {
  const result = await proxy({
    action: 'createPixQRCode',
    data: {
      amount: Math.round(params.amount * 100), // reais → centavos
      expiresIn: params.expiresIn ?? 1800,
      description: params.description,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      customerTaxId: params.customerTaxId,
    },
  })
  return (result.data as { data: PixQRCode }).data
}

// ──────────────────────────────────────────────
// CHECAR STATUS
// ──────────────────────────────────────────────

export async function checkPixStatus(
  pixId: string
): Promise<{ status: PixStatus; expiresAt: string }> {
  const result = await proxy({
    action: 'checkPixStatus',
    data: { id: pixId },
  })
  return (result.data as { data: { status: PixStatus; expiresAt: string } }).data
}

// ──────────────────────────────────────────────
// SIMULAR PAGAMENTO (sandbox / devMode)
// ──────────────────────────────────────────────

export async function simulatePixPayment(pixId: string): Promise<PixQRCode> {
  const result = await proxy({
    action: 'simulatePixPayment',
    data: { id: pixId },
  })
  return (result.data as { data: PixQRCode }).data
}
