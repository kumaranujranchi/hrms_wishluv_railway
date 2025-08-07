import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  actionType?: 'leave_approval' | 'expense_approval';
  actionId?: string;
  createdAt: string;
}

interface NotificationSystemProps {
  userId: string;
}

export default function NotificationSystem({ userId }: NotificationSystemProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const approveActionMutation = useMutation({
    mutationFn: async ({ actionType, actionId }: { actionType: string; actionId: string }) => {
      const endpoint = actionType === 'leave_approval' 
        ? `/api/leaves/${actionId}/approve`
        : `/api/expenses/${actionId}/approve`;
      
      return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ status: 'approved' }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Approved",
        description: `${variables.actionType === 'leave_approval' ? 'Leave request' : 'Expense claim'} has been approved.`,
      });
    },
  });

  const rejectActionMutation = useMutation({
    mutationFn: async ({ actionType, actionId }: { actionType: string; actionId: string }) => {
      const endpoint = actionType === 'leave_approval' 
        ? `/api/leaves/${actionId}/reject`
        : `/api/expenses/${actionId}/reject`;
      
      return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ status: 'rejected' }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Rejected",
        description: `${variables.actionType === 'leave_approval' ? 'Leave request' : 'Expense claim'} has been rejected.`,
      });
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const handleApprove = (notification: Notification) => {
    if (notification.actionType && notification.actionId) {
      approveActionMutation.mutate({
        actionType: notification.actionType,
        actionId: notification.actionId,
      });
    }
  };

  const handleReject = (notification: Notification) => {
    if (notification.actionType && notification.actionId) {
      rejectActionMutation.mutate({
        actionType: notification.actionType,
        actionId: notification.actionId,
      });
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  // Auto-show notifications for new unread items
  useEffect(() => {
    if (unreadCount > 0) {
      const latestNotification = notifications.find(n => !n.read);
      if (latestNotification) {
        toast({
          title: latestNotification.title,
          description: latestNotification.message,
          variant: latestNotification.type === 'error' ? 'destructive' : 'default',
        });
      }
    }
  }, [notifications, unreadCount, toast]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Notifications</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-neutral-500">
                  No notifications
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-neutral-50 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-neutral-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-neutral-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                          
                          {/* Action buttons for approvals */}
                          {notification.actionType && notification.actionId && (
                            <div className="flex space-x-2 mt-3">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(notification)}
                                disabled={approveActionMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(notification)}
                                disabled={rejectActionMutation.isPending}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}