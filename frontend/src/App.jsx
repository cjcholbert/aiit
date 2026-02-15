import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { ProgressProvider } from './hooks/useProgress';
import Sidebar from './components/Sidebar';
import NavDropdown from './components/NavDropdown';
import ErrorBoundary from './components/ErrorBoundary';
import FeedbackWidget from './components/FeedbackWidget';
import CelebrationToast from './components/CelebrationToast';
import SkipLink from './components/SkipLink';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Lesson01 from './pages/Lesson01';
import Lesson02 from './pages/Lesson02';
import Lesson03 from './pages/Lesson03';
import Lesson04 from './pages/Lesson04';
import Lesson05 from './pages/Lesson05';
import Lesson06 from './pages/Lesson06';
import Lesson07 from './pages/Lesson07';
import Lesson08 from './pages/Lesson08';
import Lesson09 from './pages/Lesson09';
import Lesson10 from './pages/Lesson10';
import Lesson11 from './pages/Lesson11';
import Lesson12 from './pages/Lesson12';
import CoreConcepts from './pages/CoreConcepts';
import Curriculum from './pages/Curriculum';
import Admin from './pages/Admin';

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-container">
                <div className="loading">
                    <div className="spinner"></div>
                    Loading...
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function AuthRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-container">
                <div className="loading">
                    <div className="spinner"></div>
                    Loading...
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
}

function AppLayout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Track last-visited lesson for "Continue where you left off"
    useEffect(() => {
        const match = location.pathname.match(/^\/lesson\/(\d+)$/);
        if (match) {
            localStorage.setItem('ams_last_lesson', match[1]);
        }
    }, [location.pathname]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
    };

    return (
        <ProgressProvider>
            <div className="app-layout">
                <SkipLink targetId="main-content" />

                {/* Left column: Sidebar (spans full height) */}
                <Sidebar
                    isMobileMenuOpen={isMobileMenuOpen}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                />

                {/* Right column: Nav dropdown + Main content */}
                <div className="content-column">
                    {/* Hamburger button - visible on mobile only */}
                    <button
                        className="hamburger-btn"
                        onClick={toggleMobileMenu}
                        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="curriculum-sidebar"
                    >
                        <span className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </button>

                    {/* Navigation dropdown - hidden on mobile */}
                    <div className="content-header">
                        <NavDropdown />
                    </div>

                    {/* Main content area */}
                    <main id="main-content" className="main-content" tabIndex="-1">
                        <ErrorBoundary>{children}</ErrorBoundary>
                    </main>
                </div>

                <FeedbackWidget />
                <CelebrationToast />
            </div>
        </ProgressProvider>
    );
}

export default function App() {
    return (
        <Routes>
            {/* Auth routes */}
            <Route path="/login" element={
                <AuthRoute>
                    <Login />
                </AuthRoute>
            } />
            <Route path="/register" element={
                <AuthRoute>
                    <Register />
                </AuthRoute>
            } />

            {/* Protected routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Dashboard />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/concepts" element={
                <ProtectedRoute>
                    <AppLayout>
                        <CoreConcepts />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/curriculum" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Curriculum />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/analytics" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Analytics />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/admin" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Admin />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/lesson/1" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Lesson01 />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/lesson/2" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Lesson02 />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/lesson/3" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Lesson03 />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/lesson/4" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Lesson04 />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/lesson/5" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Lesson05 />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/lesson/6" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Lesson06 />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/lesson/7" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Lesson07 />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/lesson/8" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Lesson08 />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/lesson/9" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Lesson09 />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/lesson/10" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Lesson10 />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/lesson/11" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Lesson11 />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/lesson/12" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Lesson12 />
                    </AppLayout>
                </ProtectedRoute>
            } />

            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
