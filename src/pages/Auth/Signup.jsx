import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Receipt } from 'lucide-react';

const Signup = () => {
    const [error, setError] = useState('');
    const { signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSignUp = async () => {
        setError('');
        const result = await signInWithGoogle();
        if (result.success) {
            if (result.isNewUser) {
                navigate('/complete-profile');
            } else {
                navigate('/');
            }
        } else {
            setError(result.error);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: 'var(--spacing-xl)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                    <Receipt size={56} color="var(--color-primary)" style={{ margin: '0 auto var(--spacing-md)' }} />
                    <h1 className="display-title" style={{ fontSize: '1.6rem', marginBottom: 'var(--spacing-xs)' }}>Create your account</h1>
                    <p className="text-muted">Simplify and streamline your classroom collections</p>
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

                <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        fontWeight: 600,
                        padding: '0.8rem 1.25rem',
                        transition: 'all 0.2s',
                        fontSize: '0.95rem'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFFFFF"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FFFFFF" fillOpacity="0.8"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FFFFFF" fillOpacity="0.8"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#FFFFFF" fillOpacity="0.9"/>
                    </svg>
                    Sign up with Google
                </button>

                <p style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Already have an account?{' '}
                    <a href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in instead</a>
                </p>
            </div>
        </div>
    );
};

export default Signup;
