/**
 * Notification Bell Component - simple pagination with < > buttons
 */
import { h } from 'preact';
import { useState, useEffect, useRef, useMemo, useCallback } from 'preact/hooks';
import { apiClient, Notification as RawNotification } from '../../services/api';
import { errorHandler } from '../../services/errorHandler';
import { useToast } from '../../contexts/ToastContext';
import 'ojs/ojbutton';
import 'ojs/ojpopup';
import 'ojs/ojlistview';
import ArrayDataProvider = require('ojs/ojarraydataprovider');

interface Notification {
  id: number | string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const popupRef = useRef<any>(null);
  const { showSuccess } = useToast();

  const normalize = (item: RawNotification): Notification => {
    const isReadRaw = (item as any).isRead ?? (item as any).read ?? (item as any).is_read ?? (item as any).read_flag;
    const createdRaw = (item as any).createdAt ?? (item as any).created_at ?? (item as any).timestamp ?? (item as any).created;
    const isRead = !!(
      isReadRaw === true ||
      isReadRaw === 'true' ||
      isReadRaw === 1 ||
      isReadRaw === '1' ||
      isReadRaw === 'yes' ||
      isReadRaw === 'Y'
    );
    const createdAt = typeof createdRaw === 'string' ? createdRaw : (createdRaw ? new Date(createdRaw).toISOString() : new Date().toISOString());
    return {
      id: (item as any).id ?? (item as any).notificationId ?? (item as any).uuid,
      message: (item as any).message ?? (item as any).body ?? 'No message',
      isRead,
      createdAt,
    };
  };

  const dataProvider = useMemo(() => {
    return new ArrayDataProvider<Notification, any>(notifications, { keyAttributes: 'id' as any });
  }, [notifications]);

  const loadNotifications = async (page: number = 0) => {
    if (loading) return;
    if (page < 0 || page >= totalPages) return;
    
    try {
      setLoading(true);
      const response = await apiClient.getNotifications(page, 10);
      const fetched: Notification[] = (response.content ?? []).map((i: RawNotification) => normalize(i));

      setNotifications(fetched);
      setUnreadCount(fetched.filter(n => !n.isRead).length);
      setTotalPages(response.totalPages ?? 1);
      setTotalElements(response.totalElements ?? fetched.length);
      setCurrentPage(page);
    } catch (err) {
      errorHandler.handleApiError(err, 'loading notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number | string) => {
    try {
      setNotifications(prev => {
        const updated = prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
        setUnreadCount(updated.filter(n => !n.isRead).length);
        return updated;
      });

      await apiClient.markNotificationAsRead(Number(notificationId));
      showSuccess('Notification marked as read');
    } catch (err) {
      errorHandler.handleApiError(err, 'marking notification as read');
      loadNotifications(0);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      if ((apiClient as any).markAllNotificationsAsRead) {
        await (apiClient as any).markAllNotificationsAsRead();
      } else {
        await Promise.all(unreadIds.map((id: any) => apiClient.markNotificationAsRead(id)));
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showSuccess('All notifications marked as read');
    } catch (err) {
      errorHandler.handleApiError(err, 'marking all notifications as read');
      loadNotifications(0);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(prev => {
      const next = !prev;
      if (next) loadNotifications(0); // refresh from server when opening
      return next;
    });
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      loadNotifications(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      loadNotifications(currentPage + 1);
    }
  };

  useEffect(() => {
    if (popupRef.current) {
      if (isOpen) popupRef.current.open('#notification-bell');
      else popupRef.current.close();
    }
  }, [isOpen]);


  useEffect(() => {
    loadNotifications(0);
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };
  const formatDate = (d: string) => new Date(d).toLocaleString();

  const listItemRenderer = useCallback((context: any) => {
    const item: Notification = context?.data;
    if (!item) return null;
    return (
      <li
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderBottom: '1px solid #eef2f6',
          backgroundColor: item.isRead ? '#fff' : '#fbfbfd',
          borderRadius: 4,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
          <div
            style={{
              fontWeight: item.isRead ? 500 : 700,
              fontSize: 14,
              marginBottom: 6,
              color: '#111827',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            } as any}
            title={item.message}
          >
            {item.message}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#6b7280' }}>
            <span>{formatTimeAgo(item.createdAt)}</span>
            <span>({formatDate(item.createdAt)})</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: item.isRead ? '#6b7280' : '#b91c1c', fontWeight: 700 }}>
            {item.isRead ? 'Read' : 'Unread'}
          </span>

          {!item.isRead && (
            <oj-button
              style={{
                background: 'transparent',
                color: '#0f172a',
                border: '1px solid #e6e9ef',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer',
                boxShadow: 'none',
                flexShrink: 0
              }}
              onojAction={() => handleMarkAsRead(item.id)}
              aria-label="Mark as read"
            >
              Mark as Read
            </oj-button>
          )}
        </div>
      </li>
    );
  }, [handleMarkAsRead]);

  const popupInnerHeight = 420; // px, adjust as needed

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <oj-button id="notification-bell" style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }} onojAction={toggleDropdown} aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}>
        <span class="oj-ux-ico-bell-ring" style={{ fontSize: 22, color: '#111827' }} />
        {unreadCount > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: 11, minWidth: 16, textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>{unreadCount}</span>}
      </oj-button>

      <oj-popup
        ref={popupRef}
        id="notification-popup"
        style={{
          backgroundColor: '#fff',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(2,6,23,0.12)',
          minWidth: 320,
          maxWidth: 420,
          // Make popup a flex column; hide overflow so inner scroll is sole scrollbar
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        position={{ my: { horizontal: 'end', vertical: 'top' }, at: { horizontal: 'end', vertical: 'bottom' }, collision: 'flip' }}
        modality="modeless"
      >
        {/* content wrapper: fixed inner height (adjust popupInnerHeight variable) */}
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', width: '100%', height: `${popupInnerHeight}px`, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>Notifications</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <oj-button style={{ background: 'transparent', color: '#0f172a', border: 'none', padding: '4px 8px', fontSize: 13 }} onojAction={handleMarkAllAsRead}>
                  Mark All as Read
                </oj-button>
              )}
              <oj-button style={{ background: 'transparent', border: 'none', color: '#6b7280' }} onojAction={() => setIsOpen(false)} aria-label="Close">
                <span class="oj-ux-ico-close" />
              </oj-button>
            </div>
          </div>

          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            <span>{totalElements} total</span>
            {unreadCount > 0 && <span style={{ color: '#ef4444' }}> · {unreadCount} unread</span>}
          </div>

          {/* LIST: simple list without infinite scroll */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }}><div style={{ fontSize: 22 }}>⏳</div><span style={{ color: '#6b7280' }}>Loading notifications...</span></div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }}><span class="oj-ux-ico-bell-slash" style={{ fontSize: 40, color: '#cbd5e1' }} /><p style={{ color: '#6b7280' }}>No notifications</p></div>
            ) : (
              <oj-list-view data={dataProvider} aria-label="Notifications List" style={{ display: 'block', height: '100%' }}>
                <template slot="itemTemplate" render={listItemRenderer}></template>
              </oj-list-view>
            )}

            {loading && notifications.length > 0 && <div style={{ textAlign: 'center', padding: 12 }}><div style={{ fontSize: 16 }}>⏳</div><span style={{ color: '#6b7280' }}>Loading...</span></div>}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '8px 0', 
              borderTop: '1px solid #eef2f6',
              marginTop: 8
            }}>
              <oj-button
                style={{
                  background: 'transparent',
                  color: currentPage > 0 ? '#0f172a' : '#cbd5e1',
                  border: '1px solid #e6e9ef',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: currentPage > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: 'none',
                  opacity: currentPage > 0 ? 1 : 0.5
                }}
                onojAction={goToPreviousPage}
                disabled={currentPage === 0}
                aria-label="Previous page"
              >
                <span class="oj-ux-ico-chevron-left" style={{ fontSize: 14 }} />
              </oj-button>

              <span style={{ fontSize: 13, color: '#6b7280' }}>
                Page {currentPage + 1} of {totalPages}
              </span>

              <oj-button
                style={{
                  background: 'transparent',
                  color: currentPage < totalPages - 1 ? '#0f172a' : '#cbd5e1',
                  border: '1px solid #e6e9ef',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: currentPage < totalPages - 1 ? 'pointer' : 'not-allowed',
                  boxShadow: 'none',
                  opacity: currentPage < totalPages - 1 ? 1 : 0.5
                }}
                onojAction={goToNextPage}
                disabled={currentPage === totalPages - 1}
                aria-label="Next page"
              >
                <span class="oj-ux-ico-chevron-right" style={{ fontSize: 14 }} />
              </oj-button>
            </div>
          )}
        </div>
      </oj-popup>
    </div>
  );
}
