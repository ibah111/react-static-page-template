import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Snackbar
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Download,
  PlayArrow,
  Stop
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { TranscriptionAPI, TranscriptionRequest } from '../../api/transcription';
import { SocketMessage, useTranscriptionSocket } from '../../utils/websocket';
import {
  showSnackbar,
  handleSnackbarClose,
  SnackbarState
} from '../../utils/snackbar';
import { socketServer } from '../../utils/server';

// Стилизованный компонент для drag-n-drop
const DropZone = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isDragOver'
})<{ isDragOver: boolean }>(({ theme, isDragOver }) => ({
  border: `2px dashed ${isDragOver ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: isDragOver ? theme.palette.action.hover : theme.palette.background.paper,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));



export default function TranscribePage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [summaryStatus, setSummaryStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFileReady, setIsFileReady] = useState(false);
  const [snackbarState, setSnackbarState] = useState<SnackbarState>({
    open: false,
    messageInfo: undefined,
  });

  const [transribedText, setTransribedText] = useState<string>("");
  const [resume, setResume] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const socket_url = socketServer()
  // WebSocket для получения обновлений
  const { connect, disconnect, joinRoom, leaveRoom, send, isConnected } = useTranscriptionSocket(
    socket_url, // Socket.IO сервер
    handleWebSocketMessage,
    handleWebSocketError,
    handleWebSocketClose
  );

  // send может использоваться для отправки сообщений серверу
  // например, для подтверждения получения сообщений или отправки команд

  // Загрузка доступных моделей при монтировании компонента
  useEffect(() => {
    loadAvailableModels();
  }, []);

  // Подключение к Socket.IO при монтировании компонента
  useEffect(() => {
    console.log('Подключаюсь к Socket.IO...');
    showSnackbar('Подключение к Socket.IO...', 'info', setSnackbarState);

    connect().then(() => {
      console.log('Socket.IO подключение успешно установлено');
      showSnackbar('Подключен к Socket.IO серверу', 'success', setSnackbarState);
    }).catch((error) => {
      console.error('Ошибка подключения к Socket.IO:', error);
      showSnackbar('Ошибка подключения к Socket.IO', 'error', setSnackbarState);
    });
    return () => {
      console.log('Отключаюсь от Socket.IO...');
      showSnackbar('Отключение от Socket.IO...', 'info', setSnackbarState);
      disconnect();
    };
  }, [connect, disconnect]);

  // Логирование изменений состояния
  useEffect(() => {
    console.log('=== ИЗМЕНЕНИЕ СОСТОЯНИЯ ===');
    console.log('Прогресс изменился на:', progress);
    console.log('Статус транскрибации изменился на:', transcriptionStatus);
    console.log('Статус резюме изменился на:', summaryStatus);
    console.log('Файл готов:', isFileReady);
    console.log('=====================================');
  }, [progress, transcriptionStatus, summaryStatus, isFileReady]);

  // Логирование состояния подключения
  useEffect(() => {
    console.log('Socket.IO статус подключения изменился:', isConnected);
    if (isConnected) {
      showSnackbar('Socket.IO соединение установлено', 'success', setSnackbarState);
    } else {
      showSnackbar('Socket.IO соединение разорвано', 'warning', setSnackbarState);
    }
  }, [isConnected]);

  // Обработка WebSocket сообщений
  function handleWebSocketMessage(message: SocketMessage) {
    console.log('=== ПОЛУЧЕНО SOCKET.IO СООБЩЕНИЕ ===');
    console.log('Тип сообщения:', message.type);
    console.log('Полное сообщение:', message);
    console.log('Текущий прогресс:', progress);
    console.log('Текущий статус транскрибации:', transcriptionStatus);
    console.log('Текущий статус резюме:', summaryStatus);
    console.log('Socket.IO подключен:', isConnected);
    console.log('=====================================');

    // Проверяем, что сообщение имеет правильную структуру
    if (!message.type) {
      console.warn('Получено сообщение без типа:', message);
      return;
    }

    // Отправляем подтверждение получения сообщения (для отладки)
    if (isConnected && send) {
      send({
        type: 'message_received',
        originalType: message.type,
        timestamp: Date.now()
      });
    }

    showSnackbar("get socket message: " + message.type, 'warning', setSnackbarState);
    switch (message.type) {
      case 'transcription_progress':
        console.log('Обрабатываю transcription_progress');
        if (message.progress !== undefined) {
          console.log('Устанавливаю прогресс:', message.progress);
          setProgress(message.progress);
        }
        if (message.message) {
          console.log('Устанавливаю статус транскрибации:', message.message);
          setTranscriptionStatus(message.message);
          showSnackbar(message.message, 'info', setSnackbarState);
        }
        break;
      case 'transcription_complete':
        console.log('Обрабатываю transcription_complete');
        setIsProcessing(false);
        setIsFileReady(true); // Файл готов к скачиванию
        setTranscriptionStatus('Транскрибация завершена');
        showSnackbar('Транскрибация завершена!', 'success', setSnackbarState);
        if (message.result) {
          // Обработка результата транскрибации
          console.log('Результат транскрибации:', message.result);
          if (message.result.filename) {
            console.log('Файл:', message.result.filename);
          }
          if (message.result.text_length) {
            console.log('Длина текста:', message.result.text_length, 'символов');
          }
        }
        break;
      case 'ai_response':
        console.log('Обрабатываю ai_response');
        if (message.response) {
          setSummaryStatus('Резюме готово');
          console.log('Ответ ИИ:', message.response);
          showSnackbar('Резюме готово!', 'success', setSnackbarState);
        }
        break;
      case 'error':
        console.log('Обрабатываю error');
        if (message.error) {
          setError(message.error);
          showSnackbar(`Ошибка: ${message.error}`, 'error', setSnackbarState);
        } else {
          setError('Произошла ошибка');
          showSnackbar('Произошла ошибка', 'error', setSnackbarState);
        }
        setIsProcessing(false);
        break;
      case 'client_connected':
        console.log('Подтверждение подключения к Socket.IO:', message);
        showSnackbar('Подтверждение подключения к серверу', 'info', setSnackbarState);
        break;
      case 'room_joined':
        console.log('Подтверждение присоединения к комнате:', message);
        showSnackbar('Подтверждение присоединения к комнате', 'success', setSnackbarState);
        break;
      default:
        console.log('Неизвестный тип сообщения:', message.type);
    }

    // Проверяем состояние после обработки
    setTimeout(() => {
      console.log('=== СОСТОЯНИЕ ПОСЛЕ ОБРАБОТКИ ===');
      console.log('Прогресс:', progress);
      console.log('Статус транскрибации:', transcriptionStatus);
      console.log('Статус резюме:', summaryStatus);
      console.log('=====================================');
    }, 100);
  }

  function handleWebSocketError(error: any) {
    console.error('Socket.IO ошибка:', error);
    setError('Ошибка соединения с сервером');
  }

  function handleWebSocketClose() {
    console.log('Socket.IO соединение закрыто');
    showSnackbar('Соединение с сервером разорвано', 'error', setSnackbarState);
  }

  // Загрузка доступных моделей AI
  const loadAvailableModels = async () => {
    try {
      const models = await TranscriptionAPI.getAvailableModels();
      setAvailableModels(models);
      if (models.length > 0) {
        setSelectedModel(models[0]);
      }
    } catch (error) {
      console.error('Ошибка загрузки моделей:', error);
    }
  };

  // Обработка drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  // Обработка выбора файла
  const handleFileSelect = (file: File) => {
    // Проверяем тип файла (аудио/видео)
    const validTypes = [
      'audio/*',
      'video/*',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'video/mp4',
      'video/avi',
      'video/mov'
    ];

    if (validTypes.some(type => file.type.match(type))) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Пожалуйста, выберите аудио или видео файл');
    }
  };

  // Обработка клика по кнопке выбора файла
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Обработка изменения файла через input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Удаление выбранного файла
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setIsFileReady(false);
    setProgress(0);
    setTranscriptionStatus('');
    setSummaryStatus('');
    setError(null);
  };

  // Запуск процесса транскрибации
  const handleStartProcessing = async () => {
    if (!selectedFile || !prompt.trim() || !selectedModel) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    showSnackbar('Начинаю обработку...', 'info', setSnackbarState);
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Отправляем файл на сервер
      const request: TranscriptionRequest = {
        file: selectedFile,
        prompt: prompt.trim(),
        model: selectedModel
      };

      const response = await TranscriptionAPI.transcribeAndResume(request).then((response) => {
        showSnackbar('Транскрибация завершена!', 'success', setSnackbarState);
        setTransribedText(response.transcribed_text || '');
        setResume(response.resume || '');
        return response;
      });

      console.log('=== ОТВЕТ ОТ API ===');
      console.log('Полный ответ:', response);
      console.log('ID транскрибации:', response.id);
      console.log('Статус:', response.status);
      console.log('Сообщение:', response.message);
      console.log('=====================');

      setTranscriptionId(response.id);

      // Проверяем, что у нас есть ID
      if (!response.id) {
        console.error('ОШИБКА: API не вернул ID транскрибации!');
        setError('Сервер не вернул ID транскрибации');
        setIsProcessing(false);
        return;
      }

      console.log('ID транскрибации получен:', response.id);

      // Присоединяемся к комнате для получения обновлений
      if (isConnected) {
        console.log(`Пытаюсь присоединиться к комнате: ${response.id}`);
        console.log('Текущий статус Socket.IO:', isConnected);

        joinRoom(response.id);
        console.log(`Присоединился к комнате: ${response.id}`);
        showSnackbar(`Присоединился к комнате: ${response.id}`, 'info', setSnackbarState);

        // Проверяем, что мы действительно в комнате
        setTimeout(() => {
          console.log('Проверяю статус подключения после присоединения к комнате:', isConnected);
          console.log('Текущий прогресс:', progress);
          console.log('Текущий статус транскрибации:', transcriptionStatus);
        }, 1000);
      } else {
        console.warn('Socket.IO не подключен, но продолжаем обработку');
        console.log('Текущий статус подключения:', isConnected);

        // Попробуем подключиться еще раз
        console.log('Пытаюсь подключиться к Socket.IO...');
        showSnackbar('Попытка подключения к Socket.IO...', 'warning', setSnackbarState);
        connect().then(() => {
          console.log('Подключился к Socket.IO, теперь присоединяюсь к комнате:', response.id);
          joinRoom(response.id);
          showSnackbar(`Присоединился к комнате: ${response.id}`, 'success', setSnackbarState);
        }).catch((error) => {
          console.error('Не удалось подключиться к Socket.IO:', error);
          showSnackbar('Не удалось подключиться к Socket.IO', 'error', setSnackbarState);
        });
      }

      setTranscriptionStatus('Файл загружен, начинаем обработку...');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обработке файла');
      setIsProcessing(false);
    }
  };

  // Остановка процесса
  const handleStopProcessing = async () => {
    showSnackbar('Остановка обработки...', 'error', setSnackbarState);
    if (transcriptionId) {
      try {
        // Покидаем комнату Socket.IO
        if (isConnected) {
          leaveRoom(transcriptionId);
          console.log(`Покинул комнату: ${transcriptionId}`);
        }

        await TranscriptionAPI.cancelTranscription(transcriptionId);
        setTranscriptionStatus('Обработка остановлена');
        setSummaryStatus('Обработка остановлена');
      } catch (err) {
        console.error('Ошибка при остановке:', err);
        showSnackbar('Ошибка при остановке', 'error', setSnackbarState);
      }
    }

    setIsProcessing(false);
    setProgress(0);
  };



  // Скачивание результата
  const handleDownloadResult = async () => {
    if (transcriptionId) {
      try {
        const blob = await TranscriptionAPI.downloadResult(transcriptionId);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transcription_result_${transcriptionId}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        setError('Ошибка при скачивании результата');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Транскрибация видео в текст
      </Typography>

      <Grid container spacing={3}>
        {/* Левая колонка - загрузка файла и настройки */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Загрузка файла
            </Typography>

            {/* Drag & Drop зона */}
            <DropZone
              isDragOver={isDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleFileButtonClick}
              sx={{ mb: 2 }}
            >
              <CloudUpload sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Перетащите файл сюда или нажмите для выбора
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Поддерживаются аудио и видео файлы
              </Typography>
            </DropZone>

            {/* Скрытый input для выбора файла */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            {/* Выбранный файл */}
            {selectedFile && (
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="subtitle1" noWrap>
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                    <IconButton onClick={handleRemoveFile} color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Поле для промпта */}
            <TextField
              fullWidth
              label="Промпт для AI"
              placeholder="Опишите, как должен быть обработан текст..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 3 }}
              helperText="Опишите, какую задачу должен выполнить AI (например: 'Создай краткое резюме', 'Выдели ключевые моменты')"
            />

            {/* Выбор модели AI */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Модель AI</InputLabel>
              <Select
                value={selectedModel}
                label="Модель AI"
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {availableModels.map((model) => (
                  <MenuItem key={model} value={model}>
                    <Typography variant="subtitle1">{model}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Кнопки управления */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!isProcessing ? (
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleStartProcessing}
                  disabled={!selectedFile || !prompt.trim() || !selectedModel}
                  fullWidth
                >
                  Начать обработку
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleStopProcessing}
                  fullWidth
                >
                  Остановить
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Правая колонка - прогресс и статус */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Статус обработки
            </Typography>

            {/* Прогресс бар */}
            {isProcessing && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Прогресс</Typography>
                  <Typography variant="body2">{Math.round(progress)}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            )}

            {/* Статус транскрибации */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Транскрибация:
              </Typography>
              <Chip
                label={transcriptionStatus || 'Ожидание...'}
                color={transcriptionStatus === 'Транскрибация завершена' ? 'success' : 'default'}
                variant="outlined"
              />
            </Box>

            {/* Статус резюме */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Резюме:
              </Typography>
              <Chip
                label={summaryStatus || 'Ожидание...'}
                color={summaryStatus === 'Резюме готово' ? 'success' : 'default'}
                variant="outlined"
              />
            </Box>

            {/* Скачивание результата */}
            {isFileReady && transcriptionId && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Результат готов:
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleDownloadResult}
                  fullWidth
                  color="success"
                  size="large"
                >
                  Скачать файл с транскриптом и резюме
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Файл содержит: транскрипт аудио + AI резюме
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Информация о процессе */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Информация
            </Typography>

            {/* ID транскрибации для отладки */}
            {transcriptionId && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ID транскрибации:
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {transcriptionId}
                </Typography>
              </Box>
            )}

            <Typography variant="body2" color="text.secondary" paragraph>
              После загрузки файла и настройки параметров, нажмите "Начать обработку".
              Процесс включает в себя:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                Обработка аудио/видео файла
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Транскрибация в текст
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Создание резюме с помощью выбранной AI модели
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Результат
                </Typography>
                {transribedText.length > 0 && <TextField
                  disabled={true}
                  fullWidth
                  value={transribedText}
                  multiline
                />}
              </Paper>
            </Grid>
          </Grid>
            <Grid item xs={12} md={12}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Резюме
              </Typography>
              {resume.length > 0 && <TextField
              disabled={true}
              fullWidth
                value={resume}
                multiline
              />}
              </Paper>
            </Grid>
        </Grid>
      </Grid>

      {/* Snackbar для уведомлений */}
      <Snackbar
        key={snackbarState.messageInfo?.key}
        open={snackbarState.open}
        autoHideDuration={4000}
        onClose={() => handleSnackbarClose(setSnackbarState)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          variant="filled"
          onClose={() => handleSnackbarClose(setSnackbarState)}
          severity={snackbarState.messageInfo?.severity}
          sx={{ width: '100%', maxHeight: '100px' }}
        >
          {snackbarState.messageInfo?.message}
        </Alert>
      </Snackbar>

      {/* Отображение ошибок */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
