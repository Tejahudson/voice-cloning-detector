import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { AppShell, SiteShell } from "@/components/layout/AppShell"
import Landing from "@/pages/Landing"
import Analyze from "@/pages/Analyze"
import History from "@/pages/History"

function Fade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <SiteShell>
              <Fade>
                <Landing />
              </Fade>
            </SiteShell>
          }
        />
        <Route
          path="/analyze"
          element={
            <AppShell>
              <Fade>
                <Analyze />
              </Fade>
            </AppShell>
          }
        />
        <Route
          path="/history"
          element={
            <AppShell>
              <Fade>
                <History />
              </Fade>
            </AppShell>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
