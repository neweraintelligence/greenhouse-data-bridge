import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Flowchart } from './pages/Flowchart';
import { Dashboard } from './pages/Dashboard';
import { MobileUpload } from './pages/MobileUpload';
import { MobileScanner } from './pages/MobileScanner';
import { PrintLabels } from './pages/PrintLabels';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/flowchart" element={<Flowchart />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload/:sessionCode/:sourceId" element={<MobileUpload />} />
        <Route path="/scan/:sessionCode" element={<MobileScanner />} />
        <Route path="/print-labels/:sessionCode" element={<PrintLabels />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
