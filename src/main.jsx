import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { fetchAppConfig, loadConfig } from './config/api.config';
import './index.css';
import './components/RnbLoader.css';
import RnbApp from './RnbApp.jsx';

async function bootstrap() {
  try {
    const config = await fetchAppConfig();
    loadConfig(config);
  } catch (err) {
    console.error('Config load failed:', err);
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <RnbApp />
      </BrowserRouter>
    </StrictMode>,
  );
}

bootstrap();
