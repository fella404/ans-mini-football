import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import './index.css'
import router from './router.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </MotionConfig>
  </StrictMode>,
)
