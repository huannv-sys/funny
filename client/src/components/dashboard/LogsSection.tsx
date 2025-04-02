import { useState, useEffect } from 'react';
import { useLogsContext } from '@/hooks/useLogsData';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Search, MessageSquare, Clock } from 'lucide-react';

export default function LogsSection() {
  const { logs, loading, error, getLogs, filterLogs } = useLogsContext();
  const [topicFilter, setTopicFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredLogs, setFilteredLogs] = useState(logs);

  // Filter logs based on search term and topic filter
  useEffect(() => {
    let result = logs;
    
    // Apply topic filter
    if (topicFilter) {
      result = result.filter(log => log.topics.includes(topicFilter));
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        log => log.message.toLowerCase().includes(term) || 
               log.topics.toLowerCase().includes(term)
      );
    }
    
    setFilteredLogs(result);
  }, [logs, topicFilter, searchTerm]);

  // Initial load of logs
  useEffect(() => {
    getLogs();
  }, [getLogs]);

  // Handler for topic filter change
  const handleTopicFilterChange = (value: string) => {
    setTopicFilter(value);
    if (value && value !== "all-topics") {
      filterLogs(value);
    } else {
      getLogs();
    }
  };

  // Get unique topics from logs for the filter dropdown
  const getUniqueTopics = () => {
    const allTopics = new Set<string>();
    logs.forEach(log => {
      log.topics.split(',').forEach(topic => {
        allTopics.add(topic.trim());
      });
    });
    return Array.from(allTopics).sort();
  };

  // Get badge color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 hover:bg-red-600';
      case 'error':
        return 'bg-red-400 hover:bg-red-500';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'debug':
        return 'bg-slate-500 hover:bg-slate-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Lỗi</AlertTitle>
        <AlertDescription>
          Không thể tải nhật ký hệ thống: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Nhật ký hệ thống</CardTitle>
          <CardDescription>
            Các sự kiện và thông báo từ thiết bị
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              className="pl-8 max-w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select 
            value={topicFilter} 
            onValueChange={handleTopicFilterChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo chủ đề" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-topics">Tất cả chủ đề</SelectItem>
              {getUniqueTopics().map(topic => (
                <SelectItem key={topic} value={topic || "topic-placeholder"}>
                  {topic || "Unknown Topic"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => getLogs()}
            disabled={loading}
          >
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Không có nhật ký nào</p>
                <p className="text-sm text-muted-foreground">
                  Không tìm thấy nhật ký nào phù hợp với bộ lọc hiện tại
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] rounded-md border p-4">
                {filteredLogs.map((log, index) => (
                  <div key={log.id || index}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity.toUpperCase()}
                        </Badge>
                        <div className="text-sm font-medium">
                          {log.topics.split(',').map((topic) => (
                            <Badge key={topic} variant="outline" className="mr-1">
                              {topic.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {log.time}
                      </div>
                    </div>
                    <p className="text-sm ml-1 mb-3">{log.message}</p>
                    {index < filteredLogs.length - 1 && <Separator className="mb-3" />}
                  </div>
                ))}
              </ScrollArea>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}