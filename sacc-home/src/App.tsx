import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SiteDataProvider } from './context/SiteDataContext'
import AboutPage from './pages/AboutPage'
import DocsPage from './pages/DocsPage'
import HomePage from './pages/home/HomePage'
import JoinUsPage from './pages/join/JoinUsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import NewsPage from './pages/NewsPage'
import NotFoundPage from './pages/NotFoundPage'
import ProjectsPage from './pages/ProjectsPage'

function App() {
  return (
    <SiteDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/docs/:docId" element={<DocsPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:newsId" element={<NewsDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/join-us" element={<JoinUsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </SiteDataProvider>
  )
}

export default App
