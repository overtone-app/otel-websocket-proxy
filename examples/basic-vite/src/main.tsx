import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { doExampleMetrics } from './otel-metrics'
import { doExampleTracing } from './otel-tracing'

doExampleTracing()
doExampleMetrics()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
