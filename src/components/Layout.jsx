import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LogOut, Home, Receipt, PlusCircle, CreditCard, User, Menu, Activity } from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
    const { user, logout } = useAuth();
    const { requests } = useData() || { requests: [] };
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const getNavItems = () => {
        switch (user.role) {
            case 'student':
                return [
                    { name: 'Student Portal', path: '/dashboard/student', icon: Home },
                ];
            case 'representative':
                return [
                    { name: 'Dashboard', path: '/dashboard/rep', icon: Home },
                    { name: 'Create Demand', path: '/dashboard/rep/create', icon: PlusCircle },
                ];
            case 'admin':
                return [
                    { name: 'Overview', path: '/dashboard/admin', icon: Home },
                    { name: 'Create Demand', path: '/dashboard/admin/create', icon: PlusCircle },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems();
    const isActive = (path) => location.pathname === path;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
            
            {/* Sidebar Drawer */}
            <aside style={{
                width: '260px',
                backgroundColor: 'white',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                padding: 'var(--spacing-lg) var(--spacing-md)',
                position: 'fixed',
                height: '100vh',
                left: 0,
                top: 0,
                zIndex: 100,
                boxShadow: 'var(--shadow-sm)',
                overflowY: 'auto'
            }}>
                {/* Brand Logo Header */}
                <div style={{ marginBottom: 'var(--spacing-xl)', padding: '0 var(--spacing-sm)' }}>
                    <h2 style={{ 
                        color: 'var(--color-text)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        fontWeight: 800,
                        fontSize: '1.4rem',
                        letterSpacing: '-0.03em'
                    }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            backgroundColor: 'var(--color-primary)',
                            borderRadius: 'var(--radius-md)',
                            color: 'white'
                        }}>
                            <Receipt size={20} />
                        </div>
                        <span>HomePay</span>
                    </h2>
                    <p style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        College Fintech
                    </p>
                </div>

                {/* Sidebar Navigation */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {navItems.map(item => {
                        const active = isActive(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className="btn"
                                style={{
                                    justifyContent: 'flex-start',
                                    border: 'none',
                                    padding: '0.75rem 0.875rem',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: active ? 'var(--color-primary-light)' : 'transparent',
                                    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    fontWeight: active ? 600 : 500,
                                    width: '100%'
                                }}
                            >
                                <item.icon size={20} style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', opacity: active ? 1 : 0.7 }} />
                                {item.name}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar Profile Card */}
                <div style={{ 
                    marginTop: 'auto', 
                    borderTop: '1px solid var(--color-border)', 
                    paddingTop: 'var(--spacing-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-md)'
                }}>
                    <div style={{ 
                        padding: 'var(--spacing-sm) var(--spacing-sm)', 
                        backgroundColor: 'var(--color-bg)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>{user.name}</p>
                        
                        {/* Dynamic Metadata display based on role */}
                        {user.role === 'student' && (
                            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span className="badge badge-success" style={{ alignSelf: 'flex-start', fontSize: '0.6rem', padding: '1px 6px' }}>Student</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Roll: {user.rollNumber}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Class: {user.department} • {user.semester} • Div {user.division}</span>
                            </div>
                        )}

                        {user.role === 'representative' && (
                            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span className="badge badge-warning" style={{ alignSelf: 'flex-start', fontSize: '0.6rem', padding: '1px 6px', backgroundColor: '#e0e7ff', color: 'var(--color-primary)' }}>Representative</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Class: {user.department} • {user.semester} • Div {user.division}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: {user.uniqueRepId}</span>
                            </div>
                        )}

                        {user.role === 'admin' && (
                            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span className="badge badge-danger" style={{ alignSelf: 'flex-start', fontSize: '0.6rem', padding: '1px 6px' }}>Administrator</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Manage Global System</span>
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={logout}
                        className="btn btn-outline"
                        style={{ 
                            width: '100%', 
                            justifyContent: 'center', 
                            borderColor: '#fee2e2',
                            backgroundColor: '#fef2f2', 
                            color: 'var(--color-danger-text)',
                            fontWeight: 600
                        }}
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>

                    {/* System Diagnostics Panel */}
                    <div style={{
                        marginTop: 'var(--spacing-sm)',
                        padding: '12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.72rem',
                        fontFamily: 'monospace',
                        textAlign: 'left'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                            <Activity size={12} style={{ color: '#22c55e' }} />
                            <span>DIAGNOSTICS</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', color: '#64748b' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <strong>Proj ID:</strong> <span style={{ color: '#0f172a' }}>{import.meta.env.VITE_FIREBASE_PROJECT_ID || 'MISSING'}</span>
                            </div>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <strong>UID:</strong> <span style={{ color: '#0f172a' }}>{user.uid || 'None'}</span>
                            </div>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <strong>Email:</strong> <span style={{ color: '#0f172a' }}>{user.email || 'None'}</span>
                            </div>
                            <div>
                                <strong>Class:</strong> <span style={{ color: '#0f172a' }}>{user.department?.substring(0, 10) || 'N/A'}/{user.semester || 'N/A'}/{user.division || 'N/A'}</span>
                            </div>
                            <div>
                                <strong>Demands:</strong> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{requests?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, paddingLeft: '260px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                    flex: 1,
                    padding: 'var(--spacing-xl) var(--spacing-lg)', 
                    maxWidth: '1080px', 
                    width: '100%',
                    margin: '0 auto'
                }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
