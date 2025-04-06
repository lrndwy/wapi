import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserPlanInfoProps {
  plan: {
    name: string;
    price: string;
    period: string;
  };
  usage: {
    whatsappAccounts: {
      current: number;
      max: number;
    };
    messages: {
      current: number;
      max: number;
    };
  };
  features: {
    canAddMoreAccounts: boolean;
    canSendMessages: boolean;
    hasWebhookAccess: boolean;
    hasAdvancedApi: boolean;
  };
}

export function UserPlanInfo({ plan, usage, features }: UserPlanInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Paket</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
            <p className="text-gray-600">
              {plan.price}{plan.period && <span>{plan.period}</span>}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Penggunaan WhatsApp</h4>
              <div className="flex items-center justify-between mb-2">
                <span>Akun WhatsApp</span>
                <span className={usage.whatsappAccounts.current >= usage.whatsappAccounts.max ? "text-red-600" : "text-green-600"}>
                  {usage.whatsappAccounts.current} / {usage.whatsappAccounts.max}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    usage.whatsappAccounts.current >= usage.whatsappAccounts.max 
                      ? "bg-red-600" 
                      : "bg-green-600"
                  }`}
                  style={{ 
                    width: `${Math.min(
                      (usage.whatsappAccounts.current / usage.whatsappAccounts.max) * 100, 
                      100
                    )}%` 
                  }}
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Penggunaan Pesan Bulanan</h4>
              <div className="flex items-center justify-between mb-2">
                <span>Pesan Terkirim</span>
                <span className={usage.messages.current >= usage.messages.max ? "text-red-600" : "text-green-600"}>
                  {usage.messages.current} / {usage.messages.max}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    usage.messages.current >= usage.messages.max 
                      ? "bg-red-600" 
                      : "bg-green-600"
                  }`}
                  style={{ 
                    width: `${Math.min(
                      (usage.messages.current / usage.messages.max) * 100, 
                      100
                    )}%` 
                  }}
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Fitur Tersedia</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className={`mr-2 ${features.canAddMoreAccounts ? "text-green-600" : "text-red-600"}`}>
                    {features.canAddMoreAccounts ? "✓" : "✕"}
                  </span>
                  Dapat menambah akun WhatsApp
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${features.canSendMessages ? "text-green-600" : "text-red-600"}`}>
                    {features.canSendMessages ? "✓" : "✕"}
                  </span>
                  Dapat mengirim pesan
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${features.hasWebhookAccess ? "text-green-600" : "text-red-600"}`}>
                    {features.hasWebhookAccess ? "✓" : "✕"}
                  </span>
                  Akses Webhook
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${features.hasAdvancedApi ? "text-green-600" : "text-red-600"}`}>
                    {features.hasAdvancedApi ? "✓" : "✕"}
                  </span>
                  API Lanjutan
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}