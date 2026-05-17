import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { FunctionSpaceProvider } from '@functionspace/react';
import { agentTheme } from './agent/theme';
import { MarketsHome } from './pages/MarketsHome';
import { MarketAgentPage } from './pages/MarketAgentPage';
import './agent.css';

const config = {
  baseUrl: import.meta.env.VITE_FS_BASE_URL,
  autoAuthenticate: false,
};

export default function AgentApp() {
  return (
    <FunctionSpaceProvider config={config} theme={agentTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MarketsHome />} />
          <Route path="/market/:marketId" element={<MarketAgentPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </FunctionSpaceProvider>
  );
}
