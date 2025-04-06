// Utility function untuk mengecek batasan paket
export function checkPlanLimits(user: {
  planId: string,
  currentAccounts: number,
  currentMessages: number
}) {
  const planLimits = {
    free: {
      maxAccounts: 1,
      maxMessages: 50,
      hasWebhook: false,
      hasAdvancedApi: false
    },
    professional: {
      maxAccounts: 5, 
      maxMessages: 10000,
      hasWebhook: true,
      hasAdvancedApi: true
    },
    enterprise: {
      maxAccounts: 100,
      maxMessages: 1000000,
      hasWebhook: true,
      hasAdvancedApi: true
    }
  };

  const limits = planLimits[user.planId];
  
  return {
    canAddAccount: user.currentAccounts < limits.maxAccounts,
    canSendMessage: user.currentMessages < limits.maxMessages,
    hasWebhookAccess: limits.hasWebhook,
    hasAdvancedApi: limits.hasAdvancedApi
  };
} 