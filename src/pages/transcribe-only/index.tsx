import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
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
import { TranscriptionAPI } from '../../api/transcription';

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

export default function TranscribeOnlyPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [resultFile, setResultFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setError(null);
  };

  // Запуск процесса транскрибации
  const handleStartProcessing = async () => {
    if (!selectedFile) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Отправляем файл на сервер для простой транскрибации
      const response = await TranscriptionAPI.transcribeOnly(selectedFile);
      setTranscriptionId(response.id);

      setTranscriptionStatus('Файл загружен, начинаем транскрибацию...');

      // Имитация процесса (замените на реальную логику с WebSocket)
      simulateProcessing();

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
        setTranscriptionStatus('Транскрибация остановлена');
      } catch (err) {
        console.error('Ошибка при остановке:', err);
      }
    }

    setIsProcessing(false);
    setProgress(0);
  };

  // Имитация процесса (замените на реальную логику с WebSocket)
  const simulateProcessing = () => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 20;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setIsProcessing(false);
        setResultFile('transcription.txt');
        setTranscriptionStatus('Транскрибация завершена');
      }

      setProgress(currentProgress);

      if (currentProgress < 50) {
        setTranscriptionStatus('Обработка аудио...');
      } else if (currentProgress < 100) {
        setTranscriptionStatus('Транскрибация...');
      }
    }, 400);
  };

  // Скачивание результата
  const handleDownloadResult = async () => {
    if (transcriptionId) {
      try {
        const blob = await TranscriptionAPI.downloadResult(transcriptionId);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transcription_${transcriptionId}.txt`;
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
        Простая транскрибация
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
        Загрузите аудио или видео файл для получения текстовой транскрипции без AI обработки.
      </Typography>

      <Grid container spacing={3}>
        {/* Левая колонка - загрузка файла */}
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

            {/* Кнопки управления */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!isProcessing ? (
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleStartProcessing}
                  disabled={!selectedFile}
                  fullWidth
                >
                  Начать транскрибацию
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
              Статус транскрибации
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
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Статус:
              </Typography>
              <Chip
                label={transcriptionStatus || 'Ожидание...'}
                color={transcriptionStatus === 'Транскрибация завершена' ? 'success' : 'default'}
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
                Скачать транскрипцию
              </Button>
            )}
          </Paper>

          {/* Информация о процессе */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Информация
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Простая транскрибация включает в себя:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                Обработка аудио/видео файла
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Преобразование речи в текст
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Сохранение результата в текстовом файле
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
