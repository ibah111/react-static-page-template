import React from "react";

export interface WebSocketMessage {
  type: 'progress' | 'transcription_status' | 'summary_status' | 'error' | 'complete';
  data: any;
}

export class TranscriptionWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private url: string,
    private onMessage: (message: WebSocketMessage) => void,
    private onError?: (error: Event) => void,
    private onClose?: () => void
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket соединение установлено');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.onMessage(message);
          } catch (error) {
            console.error('Ошибка парсинга WebSocket сообщения:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket ошибка:', error);
          this.onError?.(error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket соединение закрыто');
          this.onClose?.();

          // Попытка переподключения
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

            setTimeout(() => {
              this.connect().catch(console.error);
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket не подключен');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Хук для использования WebSocket в компонентах
export const useTranscriptionWebSocket = (
  url: string,
  onMessage: (message: WebSocketMessage) => void,
  onError?: (error: Event) => void,
  onClose?: () => void
) => {
  const [ws, setWs] = React.useState<TranscriptionWebSocket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    const websocket = new TranscriptionWebSocket(
      url,
      (message) => {
        onMessage(message);
        if (message.type === 'complete') {
          setIsConnected(false);
        }
      },
      (error) => {
        setIsConnected(false);
        onError?.(error);
      },
      () => {
        setIsConnected(false);
        onClose?.();
      }
    );

    setWs(websocket);

    return () => {
      websocket.disconnect();
    };
  }, [url, onMessage, onError, onClose]);

  const connect = React.useCallback(async () => {
    if (ws) {
      try {
        await ws.connect();
        setIsConnected(true);
      } catch (error) {
        console.error('Ошибка подключения к WebSocket:', error);
      }
    }
  }, [ws]);

  const disconnect = React.useCallback(() => {
    if (ws) {
      ws.disconnect();
      setIsConnected(false);
    }
  }, [ws]);

  const send = React.useCallback((message: any) => {
    if (ws) {
      ws.send(message);
    }
  }, [ws]);

  return {
    connect,
    disconnect,
    send,
    isConnected,
    ws
  };
};
