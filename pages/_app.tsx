import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { MotionConfig, AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import ErrorBoundary from '../components/ErrorBoundary'
import { ToastContainer } from '../components/Toast'
import SystemPresence from '../components/SystemPresence'
import { useToastStore } from '../lib/toastStore'
import ThemeProvider from '../components/ThemeProvider'
import { supabase } from '../lib/supabaseClient'

const PUBLIC_ROUTES = ['/login', '/register']

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)
  const [authReady, setAuthReady] = useState(false)

  const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname)

  useEffect(() => {
    let cancelled = false

    if (!PUBLIC_ROUTES.includes(router.pathname)) {
      setAuthReady(false)
    }

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return

        if (!session && !PUBLIC_ROUTES.includes(router.pathname)) {
          router.replace('/login')
          return
        }

        if (session && PUBLIC_ROUTES.includes(router.pathname)) {
          router.replace('/dashboard')
          return
        }

        setAuthReady(true)
      } catch {
        if (cancelled) return
        if (!PUBLIC_ROUTES.includes(router.pathname)) {
          router.replace('/login')
        } else {
          setAuthReady(true)
        }
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !PUBLIC_ROUTES.includes(router.pathname)) {
        setAuthReady(false)
        router.replace('/login')
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
    // Intentionally keyed on pathname only: re-running on every router identity
    // change would needlessly tear down and re-create the auth subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname])

  if (!authReady && !isPublicRoute) {
    return (
      <>
        <Head>
          <title>Blueprint</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <ThemeProvider>
          <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--theme-bg)' }}>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: 'var(--theme-accent)', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Loading...</p>
            </div>
          </div>
        </ThemeProvider>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Blueprint</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <ErrorBoundary>
        <ThemeProvider>
          {!isPublicRoute && authReady && <SystemPresence />}
          <MotionConfig reducedMotion="user">
            <AnimatePresence mode="wait">
              <motion.div
                key={router.route}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full relative"
              >
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.35 }}
                    transition={{ duration: 0.8 }}
                    className="absolute -top-32 -left-16 w-96 h-96 rounded-full blur-3xl accent-gradient"
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.25 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="absolute -top-24 right-10 w-[28rem] h-[28rem] rounded-full blur-3xl accent-gradient"
                  />
                </div>
                <Component {...pageProps} />
              </motion.div>
            </AnimatePresence>
          </MotionConfig>
          <ToastContainer toasts={toasts.map((toast) => ({ ...toast, onDismiss: () => removeToast(toast.id) }))} onDismiss={removeToast} />
        </ThemeProvider>
      </ErrorBoundary>
    </>
  )
}
