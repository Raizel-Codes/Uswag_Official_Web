import { useCallback, useEffect, useState } from 'react';
import { getVapidPublicKey, subscribeToPush, unsubscribeFromPush } from '@/services/notificationService';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// iPhones only allow Web Push from a site added to the Home Screen (iOS 16.4+), not from a Safari tab.
function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function isInstalledApp() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

/** Read fresh each time: the person can change this in the browser while the page is open. */
const permissionBlocked = () => Notification.permission === 'denied';

/** How long to wait for the service worker before telling the person, instead of spinning forever. */
const WORKER_WAIT_MS = 10_000;
/** On first load we only need to know if this device is already subscribed; don't hold the toggle for long. */
const STATE_CHECK_MS = 4_000;

const timeout = (ms: number) => new Promise<never>((_, reject) => setTimeout(() => reject(new Error('worker-timeout')), ms));

export function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // On an iPhone in a Safari tab: push isn't available yet, but it will be once USWAG is on the Home Screen.
  const needsInstall = !isSupported && isIos() && !isInstalledApp();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      Promise.race([navigator.serviceWorker.ready, timeout(STATE_CHECK_MS)])
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setIsSubscribed(sub !== null))
        .catch(() => undefined)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;
    setError(null);
    if (permissionBlocked()) {
      setError('Notifications are blocked for this site. Allow them in your browser’s site settings, then try again.');
      return;
    }
    setIsLoading(true);
    try {
      const worker = await Promise.race([
        navigator.serviceWorker.ready,
        timeout(WORKER_WAIT_MS),
      ]);
      let sub = await worker.pushManager.getSubscription();
      if (!sub) {
        const key = await getVapidPublicKey();
        sub = await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
      }
      // Always tell the server, even for an existing subscription: it re-attaches this device to the
      // signed-in person (a shared computer) and recovers a row that was cleaned up.
      await subscribeToPush(sub.toJSON());
      setIsSubscribed(true);
    } catch (e) {
      console.error('Push subscription failed:', e);
      setError(
        e instanceof Error && e.message === 'worker-timeout'
          ? 'Notifications aren’t ready yet. Reload the page and try again.'
          : permissionBlocked()
            ? 'Notifications are blocked for this site. Allow them in your browser’s site settings, then try again.'
            : 'We couldn’t turn notifications on. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setError(null);
    setIsLoading(true);
    try {
      const worker = await navigator.serviceWorker.ready;
      const sub = await worker.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPush(sub.endpoint).catch(() => undefined);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (e) {
      console.error('Push unsubscription failed:', e);
      setError('We couldn’t turn notifications off. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return { isSupported, isSubscribed, isLoading, error, needsInstall, subscribe, unsubscribe };
}
