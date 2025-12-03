
export const checkNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones de escritorio.');
    return 'denied';
  }
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') return true;
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const sendLocalNotification = (title: string, options?: NotificationOptions) => {
  if (checkNotificationPermission() === 'granted') {
    // Intentar usar ServiceWorker si está disponible (mejor para móviles)
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          icon: 'https://via.placeholder.com/128/003366/ffffff?text=BFA', // Icono genérico o link a logo real
          badge: 'https://via.placeholder.com/64/F2A900/ffffff?text=B',
          vibrate: [200, 100, 200],
          ...options
        } as any);
      });
    } else {
      // Fallback a notificación estándar de JS
      new Notification(title, {
        icon: 'https://via.placeholder.com/128/003366/ffffff?text=BFA',
        ...options
      });
    }
  } else {
    console.log('Permiso de notificaciones no otorgado.');
  }
};
