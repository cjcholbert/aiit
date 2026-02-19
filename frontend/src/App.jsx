import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { ProgressProvider } from './hooks/useProgress';
import { LessonStatsProvider } from './contexts/LessonStatsContext';
import NavDropdown from './components/NavDropdown';
import ModuleTabNav from './components/ModuleTabNav';
import ProgressSidebar from './components/ProgressSidebar';
import { MODULES } from './config/modules';
import { useTheme } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import CelebrationToast from './components/CelebrationToast';
import SkipLink from './components/SkipLink';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
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
import Admin from './pages/Admin';
import Landing from './pages/Landing';

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
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

function PublicOrDashboard() {
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
        return (
            <AppLayout>
                <Dashboard />
            </AppLayout>
        );
    }

    return <Landing />;
}

function AppLayout({ children }) {
    const location = useLocation();
    const { theme } = useTheme();

    // Parse lesson number from route for sidebar
    const lessonMatch = location.pathname.match(/^\/lesson\/(\d+)$/);
    const lessonNumber = lessonMatch ? parseInt(lessonMatch[1], 10) : null;

    // Find current module's border color for tab accent
    const currentModule = lessonNumber
        ? MODULES.find(m => m.lessons.some(l => l.lesson === lessonNumber))
        : null;
    const moduleBorderColor = currentModule
        ? (theme === 'dark' ? currentModule.darkBorderColor : currentModule.borderColor)
        : undefined;

    // Track last-visited lesson for "Continue where you left off"
    useEffect(() => {
        if (lessonNumber) {
            localStorage.setItem('ams_last_lesson', String(lessonNumber));
        }
    }, [lessonNumber]);

    return (
        <ProgressProvider>
        <LessonStatsProvider>
            <div className="app-layout">
                <SkipLink targetId="main-content" />

                <div className="content-column" style={moduleBorderColor ? { '--module-accent-border': moduleBorderColor } : undefined}>
                    <div className="content-header">
                        <div className="header-brand">
                            <span className="header-brand-title">The AI <span className="header-brand-accent">Collaborator</span></span>
                            <span className="header-brand-byline">brought to you by <strong>Your AI Iteration</strong></span>
                        </div>
                        <NavDropdown />
                    </div>

                    {lessonNumber && <ModuleTabNav />}

                    <div className={`content-body${lessonNumber ? ' content-body--with-sidebar' : ''}`}>
                        <main id="main-content" className="main-content" tabIndex="-1">
                            <ErrorBoundary>{children}</ErrorBoundary>
                        </main>

                        {lessonNumber && (
                            <ProgressSidebar lessonNumber={lessonNumber} />
                        )}
                    </div>
                </div>

                <CelebrationToast />
            </div>
        </LessonStatsProvider>
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

            {/* Public landing / authenticated dashboard */}
            <Route path="/" element={<PublicOrDashboard />} />

            {/* Explicit dashboard route for authenticated users */}
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Dashboard />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/welcome" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Landing />
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
