import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

// Import Pages
import Home from './pages/Home';
import UploadPage from './features/upload/UploadPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ChatPage from './features/chat/ChatPage';
import StudyPage from './features/study/StudyPage';
import NotFound from './pages/NotFound';
import About from './pages/About';

// Import CSS
import './App.css';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}

export default App;