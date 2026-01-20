"use client";

import {
  Bell,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  Trash2,
  BellOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotification } from "@/contexts/notification-context";
import { cn } from "@/lib/utils";

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return diffDay === 1 ? "há 1 dia" : `há ${diffDay} dias`;
  }
  if (diffHour > 0) {
    return diffHour === 1 ? "há 1 hora" : `há ${diffHour} horas`;
  }
  if (diffMin > 0) {
    return diffMin === 1 ? "há 1 minuto" : `há ${diffMin} minutos`;
  }
  return "agora mesmo";
}

const iconConfig = {
  success: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
};

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotification();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-foreground">Notificações</h3>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={markAllAsRead}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Marcar lidas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={clearNotifications}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Notification List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-muted p-4">
              <BellOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Tudo limpo por aqui
            </p>
            <p className="text-xs text-muted-foreground/70">
              Nenhuma notificação no momento
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[320px]">
            <div className="flex flex-col">
              {notifications.map((notification, index) => {
                const config = iconConfig[notification.type];
                const Icon = config.icon;

                return (
                  <div key={notification.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        !notification.read &&
                          "bg-blue-50/50 dark:bg-blue-900/10",
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          config.bg,
                        )}
                      >
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm leading-tight",
                              !notification.read
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground/80",
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </div>
                        {notification.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.description}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </button>
                    {index < notifications.length - 1 && (
                      <Separator className="mx-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
