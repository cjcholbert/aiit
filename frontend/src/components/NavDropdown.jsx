import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

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
        if (path === '/concepts') return 'Core Concepts';
        if (path === '/analytics') return 'Analytics';
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
                        <div className="nav-dropdown-section-title">Pages</div>
                        <NavLink
                            to="/"
                            className={({ isActive }) => `nav-dropdown-item ${isActive ? 'active' : ''}`}
                            role="menuitem"
                            end
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/concepts"
                            className={({ isActive }) => `nav-dropdown-item ${isActive ? 'active' : ''}`}
                            role="menuitem"
                        >
                            Core Concepts
                        </NavLink>
                        <NavLink
                            to="/analytics"
                            className={({ isActive }) => `nav-dropdown-item ${isActive ? 'active' : ''}`}
                            role="menuitem"
                        >
                            Analytics
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

                    <div className="nav-dropdown-section">
                        <div className="nav-dropdown-section-title">Settings</div>
                        <button
                            className="nav-dropdown-item"
                            onClick={toggleTheme}
                            role="menuitem"
                        >
                            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        </button>
                    </div>

                    <div className="nav-dropdown-divider" />

                    <div className="nav-dropdown-section">
                        <div className="nav-dropdown-user">
                            <div className="user-avatar-sm">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="nav-dropdown-email">{user?.email || 'User'}</span>
                        </div>
                        <button
                            className="nav-dropdown-item nav-dropdown-logout"
                            onClick={logout}
                            role="menuitem"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
