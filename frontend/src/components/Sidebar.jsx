import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../hooks/useProgress';
import { MODULES, APP_NAME } from '../config/modules';

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { isLessonComplete } = useProgress();
    const location = useLocation();

    // All modules expanded by default
    const [expandedModules, setExpandedModules] = useState(
        MODULES.reduce((acc, module) => ({ ...acc, [module.name]: true }), {})
    );

    // Close mobile menu on route change
    useEffect(() => {
        if (setIsMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    }, [location.pathname, setIsMobileMenuOpen]);

    // Close mobile menu on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && setIsMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [setIsMobileMenuOpen]);

    // Focus trap for mobile menu
    useEffect(() => {
        if (!isMobileMenuOpen) return;

        const sidebar = document.getElementById('curriculum-sidebar');
        if (!sidebar) return;

        const focusableElements = sidebar.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        const handleTab = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstEl) {
                    e.preventDefault();
                    lastEl.focus();
                }
            } else {
                if (document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                }
            }
        };

        sidebar.addEventListener('keydown', handleTab);
        // Focus the first element when menu opens
        firstEl.focus();

        return () => sidebar.removeEventListener('keydown', handleTab);
    }, [isMobileMenuOpen]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const toggleModule = (moduleName) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleName]: !prev[moduleName]
        }));
    };

    return (
        <>
            {/* Overlay - visible when mobile menu is open */}
            <div
                className={`sidebar-overlay ${isMobileMenuOpen ? 'visible' : ''}`}
                onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
                aria-hidden="true"
            />

            {/* Sidebar */}
            <aside
                id="curriculum-sidebar"
                className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
                aria-label="Curriculum navigation"
            >
                {/* Brand - visible always */}
                <div className="sidebar-brand">
                    <NavLink to="/" className="sidebar-brand-link">
                        <div className="brand-logo">AI</div>
                        <span className="brand-name">{APP_NAME}</span>
                    </NavLink>
                </div>

                {/* Mobile-only navigation links */}
                <div className="sidebar-mobile-nav">
                    <NavLink
                        to="/"
                        className={({ isActive }) => `sidebar-mobile-link ${isActive ? 'active' : ''}`}
                        end
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        to="/concepts"
                        className={({ isActive }) => `sidebar-mobile-link ${isActive ? 'active' : ''}`}
                    >
                        Core Concepts
                    </NavLink>
                    <NavLink
                        to="/curriculum"
                        className={({ isActive }) => `sidebar-mobile-link ${isActive ? 'active' : ''}`}
                    >
                        Curriculum
                    </NavLink>
                    <NavLink
                        to="/analytics"
                        className={({ isActive }) => `sidebar-mobile-link ${isActive ? 'active' : ''}`}
                    >
                        Analytics
                    </NavLink>
                    {user?.is_admin && (
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => `sidebar-mobile-link ${isActive ? 'active' : ''}`}
                        >
                            Admin
                        </NavLink>
                    )}
                </div>

                {/* Curriculum Header */}
                <div className="sidebar-header">
                    <h2 className="sidebar-title">The Curriculum</h2>
                </div>

                {/* Curriculum Modules */}
                <div className="sidebar-content">
                    {MODULES.map((module) => (
                        <div className="curriculum-module" key={module.name}>
                            <button
                                className="module-header"
                                onClick={() => toggleModule(module.name)}
                                style={{
                                    '--module-color': theme === 'dark' ? module.darkColor : module.color,
                                    '--module-text': theme === 'dark' ? module.darkTextColor : module.textColor
                                }}
                                aria-expanded={expandedModules[module.name]}
                            >
                                <span className="module-name">{module.name}</span>
                                <span className={`module-chevron ${expandedModules[module.name] ? 'expanded' : ''}`}>
                                    ▼
                                </span>
                            </button>
                            {expandedModules[module.name] && (
                                <ul className="module-lessons">
                                    {module.lessons.map((lesson) => (
                                        <li key={lesson.lesson}>
                                            {lesson.status === 'active' ? (
                                                <NavLink
                                                    to={`/lesson/${lesson.lesson}`}
                                                    className={({ isActive }) => `lesson-link ${isActive ? 'active' : ''}`}
                                                >
                                                    <span className="lesson-number">{lesson.lesson}</span>
                                                    <span className="lesson-title">{lesson.title}</span>
                                                    {isLessonComplete(lesson.lesson) && (
                                                        <span className="sidebar-lesson-check" title="Complete">&#x2713;</span>
                                                    )}
                                                </NavLink>
                                            ) : (
                                                <span className="lesson-link disabled">
                                                    <span className="lesson-number">{lesson.lesson}</span>
                                                    <span className="lesson-title">{lesson.title}</span>
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>

                {/* Mobile-only footer */}
                <div className="sidebar-mobile-footer">
                    <button className="sidebar-theme-btn" onClick={toggleTheme}>
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <div className="sidebar-user">
                        <div className="user-avatar-sm">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="sidebar-email">{user?.email || 'User'}</span>
                    </div>
                    <button className="btn btn-secondary" onClick={logout} style={{ width: '100%' }}>
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}
