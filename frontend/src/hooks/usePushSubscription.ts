import { useState, useEffect } from 'react';
import { subscribeToPush } from '@/services/notificationService';

// Add this to your environment file, or fetch it dynamically
const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BM_TODO_REPLACE_ME_VAPID';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setIsSubscribed(sub !== null);
          setIsLoading(false);
        });
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const subscribe = async () => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
        });
        await subscribeToPush(sub.toJSON() as PushSubscriptionJSON);
      }
      setIsSubscribed(true);
    } catch (e) {
      console.error('Push subscription failed:', e);
      alert('Failed to subscribe to push notifications. Check browser permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        // optionally tell backend to delete the subscription
      }
      setIsSubscribed(false);
    } catch (e) {
      console.error('Push unsubscription failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe };
}
