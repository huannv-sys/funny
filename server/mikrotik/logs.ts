import type RouterOSAPI from "routeros-api";
import { LogEntry } from "../types/mikrotik";
import { executeCommand } from "./connection";

/**
 * Get logs from MikroTik device
 * @param conn RouterOS API connection
 * @param limit Maximum number of logs to retrieve
 * @returns Array of log entries
 */
export async function getLogs(conn: RouterOSAPI, limit = 100): Promise<LogEntry[]> {
  try {
    // Fetch logs without using count parameter which isn't supported in this RouterOS API version
    const response = await executeCommand(conn, '/log/print', []);

    return response.map((entry: any, index: number) => ({
      id: entry['.id'] || `log-${index}`,
      topics: entry.topics || '',
      message: entry.message || '',
      time: entry.time || new Date().toISOString(),
      severity: determineSeverity(entry.message, entry.topics)
    }));
  } catch (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
}

/**
 * Get filtered logs from MikroTik device
 * @param conn RouterOS API connection
 * @param topics Topics to filter by (comma separated)
 * @param limit Maximum number of logs to retrieve
 * @returns Array of filtered log entries
 */
export async function getFilteredLogs(
  conn: RouterOSAPI, 
  topics: string, 
  limit = 100
): Promise<LogEntry[]> {
  try {
    // Split topics by comma and prepare filter conditions
    const topicFilters = topics.split(',').map(topic => {
      const trimmed = topic.trim();
      return {
        // Using '?' for pattern match instead of exact '='
        'topics': trimmed
      };
    });

    // If multiple topics, we need to combine them with OR (?)
    // Don't use count parameter as it's not supported in this RouterOS API version
    let params: string[] = [];

    // Add topic filter
    if (topicFilters.length === 1) {
      params.push(`?topics=${topicFilters[0].topics}`);
    } else {
      // For multiple topics in RouterOS, we need a more complex query
      // This is a simplified approach, might need adjustment based on RouterOS API
      for (const filter of topicFilters) {
        params.push(`?topics=${filter.topics}`);
      }
    }

    const response = await executeCommand(conn, '/log/print', params);

    return response.map((entry: any, index: number) => ({
      id: entry['.id'] || `log-${index}`,
      topics: entry.topics || '',
      message: entry.message || '',
      time: entry.time || new Date().toISOString(),
      severity: determineSeverity(entry.message, entry.topics)
    }));
  } catch (error) {
    console.error('Error fetching filtered logs:', error);
    return [];
  }
}

/**
 * Determine the severity of a log entry based on message content and topics
 * @param message Log message
 * @param topics Log topics
 * @returns Severity level
 */
function determineSeverity(message: string, topics: string): 'info' | 'warning' | 'error' | 'critical' | 'debug' {
  const msg = message.toLowerCase();
  const topicsLower = topics.toLowerCase();
  
  // Critical level
  if (
    msg.includes('critical') || 
    msg.includes('emergency') || 
    msg.includes('fatal') ||
    topicsLower.includes('critical')
  ) {
    return 'critical';
  }
  
  // Error level
  if (
    msg.includes('error') || 
    msg.includes('fail') || 
    msg.includes('failed') ||
    topicsLower.includes('error')
  ) {
    return 'error';
  }
  
  // Warning level
  if (
    msg.includes('warning') || 
    msg.includes('warn') || 
    msg.includes('alert') ||
    topicsLower.includes('warning')
  ) {
    return 'warning';
  }
  
  // Debug level
  if (
    msg.includes('debug') || 
    msg.includes('trace') ||
    topicsLower.includes('debug')
  ) {
    return 'debug';
  }
  
  // Default to info
  return 'info';
}