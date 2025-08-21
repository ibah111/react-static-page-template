import React from "react";
import { io, Socket } from "socket.io-client";

export interface SocketMessage {
  type: 'transcription_progress' | 'transcription_complete' | 'ai_response' | 'error' | 'client_connected' | 'room_joined';
  message?: string;
  progress?: number;
  result?: {
    filename?: string;
    text_length?: number;
    status?: string;
  };
  response?: string;
  error?: string;
}

export class TranscriptionSocket {
  private socket: Socket | null = null;
  // private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private url: string,
    private onMessage: (message: SocketMessage) => void,
    private onError?: (error: any) => void,
    private onClose?: () => void
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Создаем Socket.IO соединение
        this.socket = io(this.url, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.socket.on('connect', () => {
          console.log('Socket.IO соединение установлено');
          // this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('Socket.IO соединение разорвано');
          this.onClose?.();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO ошибка подключения:', error);
          this.onError?.(error);
          reject(error);
        });

        // Обработка событий от сервера
        this.socket.on('transcription_update', (data: SocketMessage) => {
          console.log('Получено обновление транскрибации:', data);
          this.onMessage(data);
        });

        this.socket.on('ai_update', (data: SocketMessage) => {
          console.log('Получен ответ ИИ:', data);
          this.onMessage(data);
        });

        this.socket.on('error', (data: SocketMessage) => {
          console.error('Получена ошибка:', data);
          this.onMessage(data);
        });

        this.socket.on('client_connected', (data: any) => {
          console.log('Подтверждение подключения:', data);
        });

        // Добавляем обработку подтверждения присоединения к комнате
        this.socket.on('room_joined', (data: any) => {
          console.log('Подтверждение присоединения к комнате:', data);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  joinRoom(room: string): void {
    console.log(`Попытка присоединиться к комнате: ${room}`);
    console.log('Socket.IO статус:', this.socket?.connected);

    if (this.socket && this.socket.connected) {
      this.socket.emit('join_room', room);
      console.log(`Присоединился к комнате: ${room}`);
    } else {
      console.error('Socket.IO не подключен');
      console.log('Socket объект:', this.socket);
      console.log('Статус подключения:', this.socket?.connected);
    }
  }

  leaveRoom(room: string): void {
    console.log(`Попытка покинуть комнату: ${room}`);
    console.log('Socket.IO статус:', this.socket?.connected);

    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_room', room);
      console.log(`Покинул комнату: ${room}`);
    } else {
      console.error('Socket.IO не подключен');
      console.log('Socket объект:', this.socket);
      console.log('Статус подключения:', this.socket?.connected);
    }
  }

  send(message: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message', message);
    } else {
      console.error('Socket.IO не подключен');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Хук для использования Socket.IO в компонентах
export const useTranscriptionSocket = (
  url: string,
  onMessage: (message: SocketMessage) => void,
  onError?: (error: any) => void,
  onClose?: () => void
) => {
  const [socket, setSocket] = React.useState<TranscriptionSocket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  // Мемоизируем функции обратного вызова
  const memoizedOnMessage = React.useCallback(onMessage, []);
  const memoizedOnError = React.useCallback(onError || (() => {}), []);
  const memoizedOnClose = React.useCallback(onClose || (() => {}), []);

  React.useEffect(() => {
    // Создаем экземпляр сокета только один раз
    const socketInstance = new TranscriptionSocket(
      url,
      (message) => {
        memoizedOnMessage(message);
        if (message.type === 'transcription_complete') {
          setIsConnected(false);
        }
      },
      (error) => {
        setIsConnected(false);
        memoizedOnError(error);
      },
      () => {
        setIsConnected(false);
        memoizedOnClose();
      }
    );

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [url, memoizedOnMessage, memoizedOnError, memoizedOnClose]);

  const connect = React.useCallback(async () => {
    if (socket) {
      try {
        await socket.connect();
        setIsConnected(true);
      } catch (error) {
        console.error('Ошибка подключения к Socket.IO:', error);
      }
    }
  }, [socket]);

  const disconnect = React.useCallback(() => {
    if (socket) {
      socket.disconnect();
      setIsConnected(false);
    }
  }, [socket]);

  const joinRoom = React.useCallback((room: string) => {
    if (socket) {
      socket.joinRoom(room);
    }
  }, [socket]);

  const leaveRoom = React.useCallback((room: string) => {
    if (socket) {
      socket.leaveRoom(room);
    }
  }, [socket]);

  const send = React.useCallback((message: any) => {
    if (socket) {
      socket.send(message);
    }
  }, [socket]);

  return {
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    send,
    isConnected,
    socket
  };
};
