import React, { useCallback, useEffect, useRef, useState } from 'react';

const TOAST_EVENT = 'cake-house-admin:toast';
const TOAST_LIFETIME = 3200;

const normalizeMessage = (value) => {
  const text = (value ?? '').toString().trim();
  if (!text) {
    return 'Đã cập nhật thông báo.';
  }

  const upperText = text.toUpperCase();
  if (upperText.includes('OK BABY')) {
    return 'Thao tác đã được thực hiện thành công.';
  }

  if (upperText.includes('SORRY BABY')) {
    return 'Thao tác chưa thể thực hiện lúc này.';
  }

  if (upperText.includes('DELETE ERROR')) {
    return 'Không thể xóa dữ liệu vào lúc này.';
  }

  return text;
};

const inferType = (message = '', explicitType = '') => {
  if (explicitType) {
    return explicitType;
  }

  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes('thành công') ||
    normalizedMessage.includes('đã') ||
    normalizedMessage.includes('ok')
  ) {
    return 'success';
  }

  if (
    normalizedMessage.includes('vui lòng') ||
    normalizedMessage.includes('please') ||
    normalizedMessage.includes('missing')
  ) {
    return 'warning';
  }

  if (
    normalizedMessage.includes('không thể') ||
    normalizedMessage.includes('lỗi') ||
    normalizedMessage.includes('sorry') ||
    normalizedMessage.includes('error') ||
    normalizedMessage.includes('incorrect')
  ) {
    return 'error';
  }

  return 'info';
};

const emitToast = (detail) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail }));
};

function AppToastHost() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());
  const idRef = useRef(0);

  const dismissToast = useCallback((toastId) => {
    setToasts((prevState) => prevState.filter((toast) => toast.id !== toastId));

    const timer = timersRef.current.get(toastId);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(toastId);
    }
  }, []);

  useEffect(() => {
    const timers = timersRef.current;

    const handleToast = (event) => {
      const rawDetail = event.detail || {};
      const message = normalizeMessage(rawDetail.message ?? rawDetail);
      const type = inferType(message, rawDetail.type);
      const toastId = idRef.current + 1;

      idRef.current = toastId;
      setToasts((prevState) => [...prevState, { id: toastId, message, type }]);

      const timer = window.setTimeout(() => {
        dismissToast(toastId);
      }, TOAST_LIFETIME);

      timers.set(toastId, timer);
    };

    const originalAlert = window.alert ? window.alert.bind(window) : null;
    const originalShowToast = window.__showAdminToast;

    window.alert = (message) => {
      emitToast({ message });
    };
    window.__showAdminToast = (message, type = '') => {
      emitToast({ message, type });
    };
    window.addEventListener(TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);

      if (originalAlert) {
        window.alert = originalAlert;
      }

      if (originalShowToast) {
        window.__showAdminToast = originalShowToast;
      } else {
        delete window.__showAdminToast;
      }

      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, [dismissToast]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="app-toast-viewport" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={`app-toast app-toast--${toast.type}`}
          onClick={() => dismissToast(toast.id)}
        >
          <span className="app-toast__dot" />
          <span>{toast.message}</span>
        </button>
      ))}
    </div>
  );
}

export default AppToastHost;
