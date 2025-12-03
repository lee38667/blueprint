import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { MotionConfig, AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/router'

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Blueprint</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <MotionConfig reducedMotion="user">
        <AnimatePresence mode="wait">
          {/* @ts-ignore */}
          <motion.div
            key={router.route}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full relative"
          >
            {/* Ambient LifeAt-inspired backdrop */}
            <div aria-hidden className="overlay-blur" />
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
    </>
  )
}
