import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Message } from '@/data/db';
import { getRelativeTime } from '@/utils/time';

interface MessageCardProps {
  message: Message;
}

export function MessageCard({ message }: MessageCardProps) {
  return (
    <Card className="card-glass border-0 animate-slide-up">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-foreground truncate">{message.Sender}</p>
              <Badge variant="outline" className="text-xs">
                {message.VictimId}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {message.Body}
            </p>
            <p className="text-xs text-muted-foreground">
              {getRelativeTime(message.Time)}
            </p>
          </div>
          <Badge 
            variant={message.SmsType === 'INBOX' ? 'default' : 'secondary'}
            className="text-xs shrink-0"
          >
            {message.SmsType}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}