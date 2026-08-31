import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarConfigProvider } from '@/contexts/sidebar-context'
import { DashboardSettingsProvider } from '@/contexts/dashboard-settings-context'
import { AppRouter } from '@/components/router/app-router'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { initGTM } from '@/utils/analytics'

const basename = import.meta.env.VITE_BASENAME || ''

function App() {
  // Initialize GTM on app load
  useEffect(() => {
    initGTM();
  }, []);

  return (
    <div className="font-sans antialiased" style={{ fontFamily: 'var(--font-inter)' }}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <SidebarConfigProvider>
          <DashboardSettingsProvider>
            <Router basename={basename}>
              <AppRouter />
              <Toaster />
            </Router>
          </DashboardSettingsProvider>
        </SidebarConfigProvider>
      </ThemeProvider>
    </div>
  )
}

export default App
