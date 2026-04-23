import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/all.css';
import 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap';

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
