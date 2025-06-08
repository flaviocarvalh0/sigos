export interface ToastData {
  id?: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  delay?: number;
  timestamp?: Date;

  timeoutId?: any;
  intervalId?: any;
  startedAt?: number;
  remaining?: number;
  paused?: boolean;
  progress?: number;
}
