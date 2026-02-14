import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { APP_NAME } from '../config/modules';

export default function TopNav() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="top-nav">
            <div className="top-nav-left">
                <NavLink to="/" className="top-nav-brand">
                    <div className="brand-logo">AI</div>
                    <span className="brand-name">{APP_NAME}</span>
                </NavLink>
            </div>

            <nav className="top-nav-center">
                <NavLink
                    to="/"
                    className={({isActive}) => `top-nav-link ${isActive ? 'active' : ''}`}
                    end
                >
                    Dashboard
                </NavLink>
                <NavLink
                    to="/concepts"
                    className={({isActive}) => `top-nav-link ${isActive ? 'active' : ''}`}
                >
                    Core Concepts
                </NavLink>
                <NavLink
                    to="/analytics"
                    className={({isActive}) => `top-nav-link ${isActive ? 'active' : ''}`}
                >
                    Analytics
                </NavLink>
                {user?.is_admin && (
                    <NavLink
                        to="/admin"
                        className={({isActive}) => `top-nav-link ${isActive ? 'active' : ''}`}
                    >
                        Admin
                    </NavLink>
                )}
            </nav>

            <div className="top-nav-right">
                <button
                    className="top-nav-theme-btn"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? '(light)' : '(dark)'}
                </button>
                <div className="top-nav-user">
                    <div className="user-avatar-sm">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="top-nav-email">{user?.email || 'User'}</span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={logout}>
                    Sign Out
                </button>
            </div>
        </header>
    );
}
