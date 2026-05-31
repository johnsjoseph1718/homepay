import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Receipt } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleClearData = () => {
        if (window.confirm('Are you sure you want to clear all LocalStorage data? This will delete all users, requests, and payments.')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const result = login(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
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
                    <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-md)', fontSize: '0.875rem' }}>
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

                <p style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
                    Don't have an account?{' '}
                    <a href="/signup" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create one</a>
                </p>
                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
                    <button onClick={handleClearData} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '4px 8px', borderColor: 'var(--color-danger-border)', color: 'var(--color-danger-text)' }}>
                        Clear Test Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
