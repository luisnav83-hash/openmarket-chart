/**
 * main.jsx — punto de entrada de la app React.
 * Monta <App/> en #app e importa las hojas de estilo en el orden del sistema
 * de diseño: tokens → base → layout → gráfico → menús → paneles → responsive.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/chart.css';
import './styles/menus.css';
import './styles/panels.css';
import './styles/responsive.css';

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
