import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import { AppRoutes } from './routes/AppRoutes'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="page">
          <Header />
          <main className="main">
            <AppRoutes />
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
