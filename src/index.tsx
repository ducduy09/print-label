import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './setup/assets/language/i18nextConfig';
import TemplateBuilder from '@container/home/printLabel/TemplateBuilder';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
      <TemplateBuilder />
    </React.StrictMode>
);
