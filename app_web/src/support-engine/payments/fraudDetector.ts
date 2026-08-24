/**
 * FIJAS IA SUPPORT ENGINE — ADVANCED FRAUD & DUPLICATE DETECTOR
 * Detección de duplicados por hash SHA-256, número de operación y scoring de riesgo
 */
import crypto from 'crypto';

export interface FraudEvaluation {
  fraudScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  imageHash: string;
  isDuplicateImage: boolean;
  isDuplicateOperation: boolean;
}

const processedImageHashes = new Set<string>();
const processedOperationNumbers = new Set<string>();

export function calculateImageHash(bufferOrBase64: Buffer | string): string {
  const buf = typeof bufferOrBase64 === 'string' ? Buffer.from(bufferOrBase64, 'base64') : bufferOrBase64;
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function evaluatePaymentFraud(
  imageHash: string,
  operationNumber?: string,
  detectedAmount?: number,
  expectedAmount?: number,
  userMembershipActive = false
): FraudEvaluation {
  let fraudScore = 0;
  const reasons: string[] = [];

  let isDuplicateImage = false;
  let isDuplicateOperation = false;

  // 1. Duplicate Image Check
  if (imageHash && processedImageHashes.has(imageHash)) {
    fraudScore += 70;
    isDuplicateImage = true;
    reasons.push('⚠️ Imagen de comprobante previamente enviada al sistema (Hash SHA-256 idéntico).');
  }

  // 2. Duplicate Operation Number Check
  if (operationNumber && operationNumber.length >= 6) {
    const cleanOp = operationNumber.trim();
    if (processedOperationNumbers.has(cleanOp)) {
      fraudScore += 65;
      isDuplicateOperation = true;
      reasons.push(`⚠️ Número de operación [${cleanOp}] ya registrado en otro pago previo.`);
    }
  }

  // 3. Amount mismatch check
  if (detectedAmount && expectedAmount) {
    if (detectedAmount < expectedAmount * 0.8) {
      fraudScore += 35;
      reasons.push(`⚠️ Monto transferido (S/ ${detectedAmount}) es inferior al precio del plan (S/ ${expectedAmount}).`);
    }
  }

  // 4. User already has active membership
  if (userMembershipActive) {
    fraudScore += 15;
    reasons.push('ℹ️ El usuario ya cuenta con una membresía VIP activa (posible extensión anticipada).');
  }

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (fraudScore >= 60) riskLevel = 'HIGH';
  else if (fraudScore >= 30) riskLevel = 'MEDIUM';

  return {
    fraudScore: Math.min(100, fraudScore),
    riskLevel,
    reasons,
    imageHash,
    isDuplicateImage,
    isDuplicateOperation
  };
}

export function registerValidatedPayment(imageHash: string, operationNumber?: string) {
  if (imageHash) processedImageHashes.add(imageHash);
  if (operationNumber && operationNumber.trim().length >= 6) {
    processedOperationNumbers.add(operationNumber.trim());
  }
}
