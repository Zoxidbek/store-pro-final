import React from 'react'
import { Toast } from '../hooks/useToast'
export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' && '✓ '}
          {t.type === 'error'   && '✕ '}
          {t.type === 'warning' && '⚠ '}
          {t.message}
        </div>
      ))}
    </div>
  )
}
