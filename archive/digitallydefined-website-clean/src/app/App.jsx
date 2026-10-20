import { Routes, Route } from 'react-router-dom';
import Layout from './Layout.jsx';
import Home from '../pages/Home.jsx';
import QuizPage from '../pages/quiz/QuizPage.jsx';
import QuizResultsPage from '../pages/quiz/QuizResultsPage.jsx';
import InboxPage from '../pages/quiz/InboxPage.jsx';
// Dashboard code kept for internal use — routes hidden from public navigation.
import LoginPage from '../pages/dashboard/LoginPage.jsx';
import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import AgentPage from '../pages/dashboard/AgentPage.jsx';
import NotFound from '../pages/quiz/NotFound.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz/results" element={<QuizResultsPage />} />
        <Route path="/quiz/inbox" element={<InboxPage />} />
        {/* Dashboard routes — accessible internally but not linked from navigation */}
        <Route path="/dashboard" element={<LoginPage />} />
        <Route path="/dashboard/app" element={<DashboardPage />} />
        <Route path="/dashboard/app/:agent" element={<AgentPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
