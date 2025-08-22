import { axios_instance } from "../utils/axios_instance";

export interface TranscriptionRequest {
  file: File;
  prompt: string;
  model: string;
}

export interface TranscriptionResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  message?: string;
  filename?: string;
  resume?: string;
  transcribed_text?: string;
}

export interface TranscriptionResult {
  id: string;
  transcription: string;
  summary: string;
  downloadUrl: string;
}

export interface AIRequest {
  prompt: string;
  model: string;
}

export interface AIResponse {
  result: string;
  model: string;
}

export class TranscriptionAPI {
  private static readonly BASE_URL = '/api';

  /**
   * Полная транскрибация с резюме
   */
  static async transcribeAndResume(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('prompt', request.prompt);
    formData.append('selected_model', request.model);

    try {
      const response = await axios_instance.post<TranscriptionResponse>(
        `${this.BASE_URL}/transcribe-and-resume`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      throw new Error('Не удалось загрузить файл на сервер');
    }
  }

  /**
   * Простая транскрибация без AI
   */
  static async transcribeOnly(file: File): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios_instance.post<TranscriptionResponse>(
        `${this.BASE_URL}/transcribe`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Ошибка транскрибации:', error);
      throw new Error('Не удалось выполнить транскрибацию');
    }
  }

  /**
   * Только AI обработка текста
   */
  static async aiOnly(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await axios_instance.post<AIResponse>(
        `${this.BASE_URL}/ai`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Ошибка AI обработки:', error);
      throw new Error('Не удалось выполнить AI обработку');
    }
  }

  /**
   * Получение статуса транскрибации
   */
  static async getStatus(id: string): Promise<TranscriptionResponse> {
    try {
      const response = await axios_instance.get<TranscriptionResponse>(
        `${this.BASE_URL}/status/${id}`
      );

      return response.data;
    } catch (error) {
      console.error('Ошибка получения статуса:', error);
      throw new Error('Не удалось получить статус транскрибации');
    }
  }

  /**
   * Получение результата транскрибации
   */
  static async getResult(id: string): Promise<TranscriptionResult> {
    try {
      const response = await axios_instance.get<TranscriptionResult>(
        `${this.BASE_URL}/result/${id}`
      );

      return response.data;
    } catch (error) {
      console.error('Ошибка получения результата:', error);
      throw new Error('Не удалось получить результат транскрибации');
    }
  }

  /**
   * Скачивание результата
   */
  static async downloadResult(id: string): Promise<Blob> {
    try {
      const response = await axios_instance.get(
        `${this.BASE_URL}/download/${id}`,
        {
          responseType: 'blob',
        }
      );

      return response.data;
    } catch (error) {
      console.error('Ошибка скачивания результата:', error);
      throw new Error('Не удалось скачать результат');
    }
  }

  /**
   * Отмена транскрибации
   */
  static async cancelTranscription(id: string): Promise<void> {
    try {
      await axios_instance.post(`${this.BASE_URL}/cancel/${id}`);
    } catch (error) {
      console.error('Ошибка отмены транскрибации:', error);
      throw new Error('Не удалось отменить транскрибацию');
    }
  }

  /**
   * Получение списка доступных моделей AI
   */
  static async getAvailableModels(): Promise<string[]> {
    try {
      const response = await axios_instance.get<string[]>(`${this.BASE_URL}/list-models`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения моделей:', error);
      // Возвращаем дефолтные модели в случае ошибки
      return [];
    }
  }
}
