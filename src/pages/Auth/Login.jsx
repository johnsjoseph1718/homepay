import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Receipt } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        const result = await signInWithGoogle();
        if (result.success) {
            if (result.isNewUser) {
                navigate('/complete-profile');
            } else {
                navigate('/');
            }
        } else {
            if (result.error !== 'popup-closed-by-user') {
                setError(result.error);
            }
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <Receipt size={48} color="var(--color-primary)" style={{ margin: '0 auto var(--spacing-md)' }} />
                    <h1 className="display-title" style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-xs)' }}>Welcome back</h1>
                    <p className="text-muted">Enter your details to sign in to your account</p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'var(--color-danger-bg)',
                        color: 'var(--color-danger-text)',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-md)',
                        fontSize: '0.85rem',
                        borderLeft: '4px solid var(--color-danger)',
                        fontWeight: 500
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="student@college.edu"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}>
                        Sign In
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--spacing-md) 0', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
                    <span style={{ padding: '0 var(--spacing-sm)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>or</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="btn btn-outline"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        fontWeight: 600,
                        padding: '0.75rem 1rem',
                        borderColor: '#e2e8f0',
                        transition: 'all 0.2s',
                        backgroundColor: '#ffffff'
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                </button>

                <p style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
                    Don't have an account?{' '}
                    <a href="/signup" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create one</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
