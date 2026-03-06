import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { MODULES } from '../config/modules';

export default function NavDropdown() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Get current page name for the button label
    const getCurrentPageName = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path === '/dashboard') return 'Dashboard';
        if (path === '/admin') return 'Admin';
        if (path.startsWith('/lesson/')) return `Lesson ${path.split('/')[2]}`;
        return 'Navigate';
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdown on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <div className="nav-header-right">
            <div className="nav-dropdown-container" ref={dropdownRef}>
                <button
                    className="nav-dropdown-trigger"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                >
                    <span className="nav-dropdown-current">{getCurrentPageName()}</span>
                    <span className={`nav-dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
                </button>

                {isOpen && (
                    <div className="nav-dropdown-menu" role="menu">
                        <div className="nav-dropdown-section">
                            <NavLink
                                to="/"
                                className={({ isActive }) => `nav-dropdown-item ${isActive ? 'active' : ''}`}
                                role="menuitem"
                                end
                            >
                                Dashboard
                            </NavLink>
                            {user?.is_admin && (
                                <NavLink
                                    to="/admin"
                                    className={({ isActive }) => `nav-dropdown-item ${isActive ? 'active' : ''}`}
                                    role="menuitem"
                                >
                                    Admin
                                </NavLink>
                            )}
                        </div>

                        <div className="nav-dropdown-divider" />

                        <div className="nav-dropdown-lessons">
                            {MODULES.map((module) => (
                                <div key={module.name} className="nav-dropdown-section">
                                    <div className="nav-dropdown-section-title">{module.name}</div>
                                    {module.lessons.map((lesson) => (
                                        <NavLink
                                            key={lesson.lesson}
                                            to={`/lesson/${lesson.lesson}`}
                                            className={({ isActive }) => `nav-dropdown-item nav-dropdown-lesson-item ${isActive ? 'active' : ''}`}
                                            role="menuitem"
                                        >
                                            <span className="nav-dropdown-lesson-num">{lesson.lesson}</span>
                                            <span className="nav-dropdown-lesson-title">{lesson.title}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <button
                className="nav-theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {theme === 'dark' ? '\u2600' : '\u263D'}
            </button>

            <div className="nav-user-bar">
                <span className="nav-user-email">{user?.email || 'User'}</span>
                <button
                    className="nav-signout-btn"
                    onClick={logout}
                    aria-label="Sign out"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
