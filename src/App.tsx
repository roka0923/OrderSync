import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import OrderInputPage from './pages/OrderInputPage';
import MatchingPage from './pages/MatchingPage';
import CompletedPage from './pages/CompletedPage';
import AbbreviationsPage from './pages/AbbreviationsPage';
import { Settings, FileText, PlusCircle, Activity } from 'lucide-react';
import { useOrderStore } from './store/useOrderStore';

const Navbar = () => {
    const location = useLocation();
    const { parsedItems } = useOrderStore();
    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-gray-800/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">O</div>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                OrderSync
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4 md:space-x-8">
                        <Link
                            to="/"
                            className={`flex items-center text-sm font-medium transition-colors ${isActive('/') ? 'text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            <PlusCircle size={18} className="mr-1.5" /> 새 변환
                        </Link>

                        {parsedItems.length > 0 && (
                            <Link
                                to="/matching"
                                className={`flex items-center text-sm font-medium transition-colors ${isActive('/matching') ? 'text-primary' : 'text-orange-500 hover:text-orange-600'
                                    }`}
                            >
                                <Activity size={18} className="mr-1.5 animate-pulse" /> 작업 중
                            </Link>
                        )}

                        <Link
                            to="/abbreviations"
                            className={`flex items-center text-sm font-medium transition-colors ${isActive('/abbreviations') ? 'text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            <FileText size={18} className="mr-1.5" /> 약어표
                        </Link>
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                            <Settings size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-[#FDFDFD] dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    <Routes>
                        <Route path="/" element={<OrderInputPage />} />
                        <Route path="/matching" element={<MatchingPage />} />
                        <Route path="/completed" element={<CompletedPage />} />
                        <Route path="/abbreviations" element={<AbbreviationsPage />} />
                    </Routes>
                </main>

                <footer className="py-8 text-center text-sm text-gray-400 dark:text-gray-600">
                    <p>© 2026 OrderSync. All rights reserved.</p>
                </footer>
            </div>
        </Router>
    );
}

export default App;
