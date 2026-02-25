import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletContextProvider } from "./contexts/WalletContext";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/Dashboard";
import { ApiErrorsPage } from "./pages/ApiErrors";
import { ResearchPage } from "./pages/Research";

function App() {
  return (
    <BrowserRouter>
      <WalletContextProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="api-errors" element={<ApiErrorsPage />} />
            <Route path="research" element={<ResearchPage />} />
          </Route>
        </Routes>
      </WalletContextProvider>
    </BrowserRouter>
  );
}

export default App;
