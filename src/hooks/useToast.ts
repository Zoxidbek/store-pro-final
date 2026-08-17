import { useState, useCallback } from 'react'
export interface Toast { id: number; message: string; type: string }
let _id = 0
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const add = useCallback((message: string, type = 'info') => {
    const id = ++_id
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }, [])
  return {
    toasts,
    toast: {
      success: (m: string) => add(m, 'success'),
      error:   (m: string) => add(m, 'error'),
      warning: (m: string) => add(m, 'warning'),
      info:    (m: string) => add(m, 'info'),
    }
  }
}
