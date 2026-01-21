import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Flowchart } from './pages/Flowchart';
import { Dashboard } from './pages/Dashboard';
import { MobileUpload } from './pages/MobileUpload';
import { MobileDataEntry } from './pages/MobileDataEntry';
import { MobileScanner } from './pages/MobileScanner';
import { MobileJoinSession } from './pages/MobileJoinSession';
import { PrintLabels } from './pages/PrintLabels';
import { DockTablet } from './pages/DockTablet';
import { QuickIdentity } from './pages/QuickIdentity';
import { ReceiptSigningForm } from './pages/ReceiptSigningForm';
import { TheoryPresentation } from './pages/TheoryPresentation';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/flowchart" element={<Flowchart />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload/:sessionCode/:sourceId" element={<MobileUpload />} />
          <Route path="/mobile-entry/:sessionCode" element={<MobileDataEntry />} />
          <Route path="/scan/:sessionCode" element={<MobileScanner />} />
          <Route path="/print-labels/:sessionCode" element={<PrintLabels />} />
          <Route path="/dock/:sessionCode" element={<DockTablet />} />
          <Route path="/identity" element={<QuickIdentity />} />
          <Route path="/sign-receipt/:sessionCode/:shipmentId" element={<ReceiptSigningForm />} />
          <Route path="/theory" element={<TheoryPresentation />} />
          <Route path="/join/:sessionCode" element={<MobileJoinSession />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
