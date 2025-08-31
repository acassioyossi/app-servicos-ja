"use client";

import { useCallback } from 'react';
import { useSystemNotifications } from '@/contexts/notification-context';

/**
 * Hook para integrar notificações com os fluxos de IA
 */
export function useAINotifications() {
  const {
    notifyServiceUpdate,
    notifyPaymentSuccess,
    notifyError,
    notifyNewMessage,
  } = useSystemNotifications();

  // Notificações específicas para diagnóstico de serviços
  const notifyDiagnosisComplete = useCallback((issue: string, solution: string) => {
    notifyServiceUpdate(
      `Diagnóstico concluído para "${issue}". Solução sugerida: ${solution.substring(0, 100)}${solution.length > 100 ? '...' : ''}`
    );
  }, [notifyServiceUpdate]);

  const notifyDiagnosisError = useCallback((issue: string, error: string) => {
    notifyError(
      `Erro ao diagnosticar "${issue}": ${error}`
    );
  }, [notifyError]);

  // Notificações específicas para cálculo de preços
  const notifyPriceCalculated = useCallback((service: string, price: number) => {
    notifyServiceUpdate(
      `Preço calculado para "${service}": R$ ${price.toFixed(2)}`
    );
  }, [notifyServiceUpdate]);

  const notifyPriceCalculationError = useCallback((service: string, error: string) => {
    notifyError(
      `Erro ao calcular preço para "${service}": ${error}`
    );
  }, [notifyError]);

  // Notificações específicas para Wayne Cash
  const notifyWayneCashCalculated = useCallback((serviceValue: number, wayneCash: number) => {
    notifyServiceUpdate(
      `Wayne Cash calculado: R$ ${wayneCash.toFixed(2)} para serviço de R$ ${serviceValue.toFixed(2)}`
    );
  }, [notifyServiceUpdate]);

  const notifyWayneCashError = useCallback((error: string) => {
    notifyError(
      `Erro ao calcular Wayne Cash: ${error}`
    );
  }, [notifyError]);

  // Notificações para status de serviços
  const notifyServiceRequested = useCallback((serviceType: string, professionalType: string) => {
    notifyServiceUpdate(
      `Solicitação de ${serviceType} enviada. Procurando ${professionalType} disponível...`
    );
  }, [notifyServiceUpdate]);

  const notifyProfessionalFound = useCallback((professionalName: string, eta: string) => {
    notifyServiceUpdate(
      `${professionalName} aceitou seu serviço! Tempo estimado de chegada: ${eta}`
    );
  }, [notifyServiceUpdate]);

  const notifyServiceStarted = useCallback((professionalName: string) => {
    notifyServiceUpdate(
      `${professionalName} iniciou o serviço. Você pode acompanhar o progresso em tempo real.`
    );
  }, [notifyServiceUpdate]);

  const notifyServiceCompleted = useCallback((professionalName: string, amount: number) => {
    notifyServiceUpdate(
      `Serviço concluído por ${professionalName}! Valor total: R$ ${amount.toFixed(2)}`
    );
  }, [notifyServiceUpdate]);

  // Notificações para chat e mensagens
  const notifyNewChatMessage = useCallback((from: string, preview: string) => {
    notifyNewMessage(`${from}: ${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}`);
  }, [notifyNewMessage]);

  // Notificações para agendamentos
  const notifyServiceScheduled = useCallback((serviceType: string, date: string, time: string) => {
    notifyServiceUpdate(
      `${serviceType} agendado para ${date} às ${time}`
    );
  }, [notifyServiceUpdate]);

  const notifyScheduleReminder = useCallback((serviceType: string, timeUntil: string) => {
    notifyServiceUpdate(
      `Lembrete: ${serviceType} em ${timeUntil}`
    );
  }, [notifyServiceUpdate]);

  // Notificações para pagamentos
  const notifyPaymentProcessing = useCallback((amount: number) => {
    notifyServiceUpdate(
      `Processando pagamento de R$ ${amount.toFixed(2)}...`
    );
  }, [notifyServiceUpdate]);

  const notifyPaymentCompleted = useCallback((amount: number, wayneCashEarned?: number) => {
    const message = wayneCashEarned 
      ? `Pagamento de R$ ${amount.toFixed(2)} confirmado! Você ganhou R$ ${wayneCashEarned.toFixed(2)} em Wayne Cash.`
      : `Pagamento de R$ ${amount.toFixed(2)} confirmado!`;
    
    notifyPaymentSuccess(amount);
    if (wayneCashEarned) {
      notifyServiceUpdate(`Você ganhou R$ ${wayneCashEarned.toFixed(2)} em Wayne Cash!`);
    }
  }, [notifyPaymentSuccess, notifyServiceUpdate]);

  const notifyPaymentFailed = useCallback((amount: number, reason: string) => {
    notifyError(
      `Falha no pagamento de R$ ${amount.toFixed(2)}: ${reason}`
    );
  }, [notifyError]);

  // Notificações para localização e mapa
  const notifyLocationUpdate = useCallback((professionalName: string, distance: string) => {
    notifyServiceUpdate(
      `${professionalName} está a ${distance} de distância`
    );
  }, [notifyServiceUpdate]);

  const notifyArrival = useCallback((professionalName: string) => {
    notifyServiceUpdate(
      `${professionalName} chegou ao local!`
    );
  }, [notifyServiceUpdate]);

  return {
    // Diagnóstico de serviços
    notifyDiagnosisComplete,
    notifyDiagnosisError,
    
    // Cálculo de preços
    notifyPriceCalculated,
    notifyPriceCalculationError,
    
    // Wayne Cash
    notifyWayneCashCalculated,
    notifyWayneCashError,
    
    // Status de serviços
    notifyServiceRequested,
    notifyProfessionalFound,
    notifyServiceStarted,
    notifyServiceCompleted,
    
    // Chat e mensagens
    notifyNewChatMessage,
    
    // Agendamentos
    notifyServiceScheduled,
    notifyScheduleReminder,
    
    // Pagamentos
    notifyPaymentProcessing,
    notifyPaymentCompleted,
    notifyPaymentFailed,
    
    // Localização
    notifyLocationUpdate,
    notifyArrival,
  };
}