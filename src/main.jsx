import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* useTransitions={false}: apply route changes immediately so the
        page transitions (hooks/usePageTransition.js)
        can capture the new page inside document.startViewTransition. */}
    <BrowserRouter useTransitions={false}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
