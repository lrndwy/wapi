import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppAPIDocProps {
  accountId: string;
  apiKey: string;
}

export function WhatsAppAPIDoc({ accountId, apiKey }: WhatsAppAPIDocProps) {
  const [showKey, setShowKey] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Berhasil disalin!");
  };

  if (!apiKey) {
    return (
      <Card className="w-full mt-4">
        <CardContent>
          <p>Memuat API key...</p>
        </CardContent>
      </Card>
    );
  }

  const apiDocs = [
    {
      title: "Mengirim Pesan",
      method: "POST",
      endpoint: "/api/whatsapp/messages",
      description: "Mengirim pesan WhatsApp ke nomor tujuan",
      body: {
        to: "6281234567890",
        message: "Halo, ini pesan dari API"
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      curl: `curl -X POST 'http://localhost:3000/api/whatsapp/messages' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: ${showKey ? apiKey : "YOUR_API_KEY"}' \\
  -d '{
    "to": "6281234567890",
    "message": "Halo, ini pesan dari API"
  }'`
    },
    {
      title: "Membalas Pesan",
      method: "POST",
      endpoint: "/api/whatsapp/reply",
      description: "Membalas pesan WhatsApp yang masuk. MessageId harus didapatkan dari webhook atau event message yang diterima.",
      body: {
        messageId: "true_6285890392419@c.us_XXXXXXXXXXXXXX",
        message: "Ini adalah balasan otomatis"
      },
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      curl: `curl -X POST 'http://localhost:3000/api/whatsapp/reply' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: ${showKey ? apiKey : "YOUR_API_KEY"}' \\
  -d '{
    "messageId": "true_6285890392419@c.us_XXXXXXXXXXXXXX",
    "message": "Ini adalah balasan otomatis"
  }'`
    }
  ];

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle className="text-xl">Dokumentasi API</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <p className="font-semibold">API Key:</p>
            <code className="bg-muted p-1 rounded">
              {showKey ? apiKey : "********"}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? "Sembunyikan" : "Tampilkan"}
            </Button>
            {showKey && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(apiKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {apiDocs.map((doc, index) => (
            <div key={index} className="border-t pt-4">
              <h3 className="font-bold mb-2">{doc.title}</h3>
              <div className="space-y-2">
                <p><span className="font-semibold">Method:</span> {doc.method}</p>
                <p><span className="font-semibold">Endpoint:</span> {doc.endpoint}</p>
                <p>{doc.description}</p>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Headers:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(JSON.stringify(doc.headers, null, 2))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(doc.headers, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Request Body:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(JSON.stringify(doc.body, null, 2))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(doc.body, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Contoh CURL:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(doc.curl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap">
                    {doc.curl}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 