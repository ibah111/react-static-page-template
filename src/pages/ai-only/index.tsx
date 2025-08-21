import { useState, useEffect } from 'react';
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
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Send,
  ContentCopy,
  Download
} from '@mui/icons-material';
import { TranscriptionAPI, AIRequest, AIResponse } from '../../api/transcription';

export default function AIOnlyPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');

  // Загрузка доступных моделей при монтировании компонента
  useEffect(() => {
    loadAvailableModels();
  }, []);

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

  // Запуск AI обработки
  const handleStartProcessing = async () => {
    if (!prompt.trim() || !selectedModel || !inputText.trim()) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const request: AIRequest = {
        prompt: prompt.trim(),
        model: selectedModel
      };

      const response: AIResponse = await TranscriptionAPI.aiOnly(request);
      setResult(response.result);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при AI обработке');
    } finally {
      setIsProcessing(false);
    }
  };

  // Копирование результата в буфер обмена
  const handleCopyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result).then(() => {
        // Можно добавить уведомление об успешном копировании
        console.log('Результат скопирован в буфер обмена');
      }).catch(err => {
        console.error('Ошибка копирования:', err);
      });
    }
  };

  // Скачивание результата
  const handleDownloadResult = () => {
    if (result) {
      const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai_result_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  // Очистка формы
  const handleClear = () => {
    setPrompt('');
    setInputText('');
    setResult(null);
    setError(null);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        AI обработка текста
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
        Введите текст и промпт для AI обработки. Выберите модель AI для получения результата.
      </Typography>

      <Grid container spacing={3}>
        {/* Левая колонка - ввод данных */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Входные данные
            </Typography>

            {/* Поле для ввода текста */}
            <TextField
              fullWidth
              label="Текст для обработки"
              placeholder="Введите текст, который нужно обработать..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              multiline
              rows={6}
              sx={{ mb: 3 }}
              helperText="Введите текст, который нужно проанализировать или обработать"
            />

            {/* Поле для промпта */}
            <TextField
              fullWidth
              label="Промпт для AI"
              placeholder="Опишите, что должен сделать AI с текстом..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 3 }}
              helperText="Опишите задачу (например: 'Создай краткое резюме', 'Выдели ключевые моменты', 'Переведи на английский')"
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
              <Button
                variant="contained"
                startIcon={isProcessing ? <CircularProgress size={20} /> : <Send />}
                onClick={handleStartProcessing}
                disabled={!prompt.trim() || !selectedModel || !inputText.trim() || isProcessing}
                fullWidth
              >
                {isProcessing ? 'Обработка...' : 'Обработать текст'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                disabled={isProcessing}
              >
                Очистить
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Правая колонка - результат */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Результат обработки
            </Typography>

            {isProcessing ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  AI обрабатывает ваш запрос...
                </Typography>
              </Box>
            ) : result ? (
              <Box>
                {/* Информация о модели */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Модель:
                  </Typography>
                  <Chip label={selectedModel} color="primary" variant="outlined" />
                </Box>

                {/* Результат */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Результат:
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {result}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {/* Кнопки действий */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopy />}
                    onClick={handleCopyResult}
                    fullWidth
                  >
                    Копировать
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={handleDownloadResult}
                    fullWidth
                    color="success"
                  >
                    Скачать
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Результат появится здесь после обработки
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Информация о возможностях */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Возможности AI
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              AI может выполнить различные задачи с текстом:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                Создание кратких резюме
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Выделение ключевых моментов
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Перевод на другие языки
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Анализ тональности
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Генерация вопросов по тексту
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
