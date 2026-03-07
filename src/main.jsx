import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './Landing.jsx'
import F1Predictor from './F1Predictor.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/f1predictor" element={<F1Predictor />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
