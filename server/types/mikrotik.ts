export interface LogEntry {
  id: string;
  topics: string;
  message: string;
  time: string;
  severity: 'info' | 'warning' | 'error' | 'critical' | 'debug';
}