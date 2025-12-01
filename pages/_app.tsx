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
            className="h-full"
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </MotionConfig>
    </>
  )
}
