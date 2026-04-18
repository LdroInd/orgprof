import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BeritaPage from './pages/BeritaPage';
import BeritaDetail from './pages/BeritaDetail';
import AdminPanel from './pages/AdminPanel';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/berita" element={<><Navbar /><BeritaPage /></>} />
      <Route path="/berita/:id" element={<BeritaDetail />} />
      <Route path="/admin/*" element={<AdminPanel />} />
    </Routes>
  );
}
