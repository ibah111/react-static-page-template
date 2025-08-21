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
  Chip
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

// Стилизованный компонент для drag-n-drop
const DropZone = styled(Paper)<{ $isDragOver: boolean }>(({ theme, $isDragOver }) => ({
  border: `2px dashed ${$isDragOver ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: $isDragOver ? theme.palette.action.hover : theme.palette.background.paper,
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
  const [resultFile, setResultFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebSocket для получения обновлений
  const { connect, disconnect, send, isConnected } = useTranscriptionSocket(
    'http://127.0.0.1:8000', // Socket.IO сервер
    handleWebSocketMessage,
    handleWebSocketError,
    handleWebSocketClose
  );

  // Загрузка доступных моделей при монтировании компонента
  useEffect(() => {
    loadAvailableModels();
  }, []);

  // Обработка WebSocket сообщений
  function handleWebSocketMessage(message: SocketMessage) {
    switch (message.type) {
      case 'transcription_progress':
        if (message.progress !== undefined) {
          setProgress(message.progress);
        }
        if (message.message) {
          setTranscriptionStatus(message.message);
        }
        break;
      case 'transcription_complete':
        setIsProcessing(false);
        setResultFile('result.txt');
        setTranscriptionStatus('Транскрибация завершена');
        if (message.result) {
          // Обработка результата транскрибации
          console.log('Результат транскрибации:', message.result);
        }
        break;
      case 'ai_response':
        if (message.response) {
          setSummaryStatus('Резюме готово');
          console.log('Ответ ИИ:', message.response);
        }
        break;
      case 'error':
        if (message.error) {
          setError(message.error);
        } else {
          setError('Произошла ошибка');
        }
        setIsProcessing(false);
        break;
    }
  }

  function handleWebSocketError(error: any) {
    console.error('Socket.IO ошибка:', error);
    setError('Ошибка соединения с сервером');
  }

  function handleWebSocketClose() {
    console.log('Socket.IO соединение закрыто');
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
    setResultFile(null);
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

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Подключаемся к WebSocket
      await connect();

            // Отправляем файл на сервер
      const request: TranscriptionRequest = {
        file: selectedFile,
        prompt: prompt.trim(),
        model: selectedModel
      };

      const response = await TranscriptionAPI.transcribeAndResume(request);
      setTranscriptionId(response.id);

      // Отправляем сообщение в WebSocket для начала отслеживания
      if (isConnected) {
        send({ type: 'start_tracking', transcriptionId: response.id });
      }

      setTranscriptionStatus('Файл загружен, начинаем обработку...');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обработке файла');
      setIsProcessing(false);
    }
  };

  // Остановка процесса
  const handleStopProcessing = async () => {
    if (transcriptionId) {
      try {
        await TranscriptionAPI.cancelTranscription(transcriptionId);
        setTranscriptionStatus('Обработка остановлена');
        setSummaryStatus('Обработка остановлена');
      } catch (err) {
        console.error('Ошибка при остановке:', err);
      }
    }

    setIsProcessing(false);
    setProgress(0);
    disconnect();
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
              $isDragOver={isDragOver}
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
            {resultFile && (
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownloadResult}
                fullWidth
                color="success"
              >
                Скачать результат
              </Button>
            )}
          </Paper>

          {/* Информация о процессе */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Информация
            </Typography>
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
      </Grid>

      {/* Отображение ошибок */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
