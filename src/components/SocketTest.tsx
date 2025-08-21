import React, { useState, useCallback } from 'react';
import { useTranscriptionSocket } from '../utils/websocket';
import { socketServer } from '../utils/server';
import { Button, Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';

interface Message {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
}

export const SocketTest: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [room, _setRoom] = useState<string>('test-room');

  const handleMessage = useCallback((socketMessage: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: socketMessage.type,
      content: JSON.stringify(socketMessage),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('Socket.IO ошибка:', error);
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'error',
      content: `Ошибка: ${error.message || error}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const { connect, disconnect, joinRoom, leaveRoom, isConnected } = useTranscriptionSocket(
    socketServer(),
    handleMessage,
    handleError
  );

  const handleConnect = useCallback(async () => {
    try {
      await connect();
      if (isConnected) {
        joinRoom(room);
      }
    } catch (error) {
      console.error('Ошибка подключения:', error);
    }
  }, [connect, isConnected, joinRoom, room]);

  const handleDisconnect = useCallback(() => {
    leaveRoom(room);
    disconnect();
  }, [leaveRoom, disconnect, room]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Socket.IO Тест
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConnect}
            disabled={isConnected}
          >
            Подключиться
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={handleDisconnect}
            disabled={!isConnected}
          >
            Отключиться
          </Button>

          <Button
            variant="outlined"
            onClick={clearMessages}
          >
            Очистить сообщения
          </Button>
        </Box>

        <Typography variant="body1">
          Статус: {isConnected ? 'Подключен' : 'Отключен'}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Комната: {room}
        </Typography>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Сообщения ({messages.length})
        </Typography>

        {messages.length === 0 ? (
          <Typography color="text.secondary">
            Сообщения появятся здесь после подключения
          </Typography>
        ) : (
          <List>
            {messages.map((message) => (
              <ListItem key={message.id} divider>
                <ListItemText
                  primary={`${message.type} - ${message.timestamp.toLocaleTimeString()}`}
                  secondary={message.content}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};
