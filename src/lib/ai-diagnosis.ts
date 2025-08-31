/**
 * AI Diagnosis utilities
 */

export interface DiagnosisResult {
  issue: string;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  estimatedTime: number; // in minutes
}

export interface ServiceIssue {
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high';
}

export async function diagnoseServiceIssue(issue: ServiceIssue): Promise<DiagnosisResult> {
  // Simulate AI diagnosis
  const recommendations = [
    'Verificar conexões elétricas',
    'Testar componentes principais',
    'Consultar manual técnico'
  ];

  return {
    issue: issue.description,
    severity: issue.urgency,
    recommendations,
    estimatedTime: issue.urgency === 'high' ? 30 : issue.urgency === 'medium' ? 60 : 120
  };
}

export function formatDiagnosis(diagnosis: DiagnosisResult): string {
  return `Problema: ${diagnosis.issue}\nSeveridade: ${diagnosis.severity}\nTempo estimado: ${diagnosis.estimatedTime} minutos`;
}