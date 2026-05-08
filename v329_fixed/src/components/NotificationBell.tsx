import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';

export function NotificationBell() {
  const { user } = useAuth();
  const { data: notifications } = useNotifications(user?.id);
  const { data: unreadCount } = useUnreadCount(user?.id);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-white hover:bg-white/10">
          <Bell className="w-5 h-5 text-white" />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {(unreadCount ?? 0) > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => user && markAllAsRead.mutate(user.id)}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {(!notifications || notifications.length === 0) ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                    !n.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    if (!n.is_read) markAsRead.mutate(n.id);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        n.type === 'success'
                          ? 'bg-green-500'
                          : n.type === 'error'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
