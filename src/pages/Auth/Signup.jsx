import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Receipt, Key, UserCheck } from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: '',
        semester: '',
        division: '',
        rollNumber: '',
        admissionNumber: '',
        uniqueRepId: ''
    });
    const [error, setError] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getExpectedCode = () => {
        const firstName = formData.name.trim().split(/\s+/)[0];
        return firstName ? `${firstName}0001` : '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.email || !formData.password || !formData.role) {
            setError("Please fill all required fields.");
            return;
        }

        if (formData.role === 'student' || formData.role === 'rep') {
            if (!formData.department || !formData.semester || !formData.division) {
                setError("Please select your target Department, Semester, and Division coordinates.");
                return;
            }
        }

        if (formData.role === 'student') {
            if (!formData.rollNumber || !formData.admissionNumber) {
                setError("Roll number and Admission number are required for students.");
                return;
            }
        } else if (formData.role === 'rep') {
            if (!formData.uniqueRepId) {
                setError("Please enter your Representative Verification Code.");
                return;
            }
        }

        const result = signup(formData);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
    };

    const expectedCode = getExpectedCode();

    return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)', padding: 'var(--spacing-xl) var(--spacing-md)' }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '56px',
                        height: '56px',
                        backgroundColor: 'var(--color-primary-light)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-sm)',
                        color: 'var(--color-primary)'
                    }}>
                        <Receipt size={32} />
                    </div>
                    <h1 className="display-title" style={{ fontSize: '1.6rem', marginBottom: 'var(--spacing-xs)' }}>Create your account</h1>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>Join HomePay to streamline college fee collections</p>
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    
                    <div className="input-group">
                        <label className="input-label" htmlFor="role">Select Your Role</label>
                        <select
                            id="role"
                            name="role"
                            className="input-field"
                            style={{ fontWeight: 500, borderColor: 'var(--color-primary)' }}
                            value={formData.role}
                            onChange={handleInputChange}
                        >
                            <option value="student">Student (Class Member)</option>
                            <option value="rep">Class Representative (Manager)</option>
                            <option value="admin">Teacher / Admin</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            className="input-field"
                            placeholder="e.g. Alan Joseph"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label className="input-label" htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="input-field"
                                placeholder="name@college.edu"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="input-group" style={{ flex: 1 }}>
                            <label className="input-label" htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    {/* DYNAMIC FIELD PANEL FOR REPRESENTATIVES */}
                    {formData.role === 'rep' && (
                        <div className="card" style={{
                            backgroundColor: '#fafbff',
                            borderColor: 'var(--color-primary-light)',
                            padding: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-xs)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-xs)'
                        }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Key size={16} /> Representative Verification
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                Enter the verification code matching your first name + 0001 (Preserve casing and spelling).
                            </p>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <div className="flex justify-between items-center" style={{ marginBottom: '2px' }}>
                                    <label className="input-label" htmlFor="uniqueRepId" style={{ marginBottom: 0 }}>Representative Code</label>
                                    {expectedCode && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, letterSpacing: '0.02em' }}>
                                            Expected: {expectedCode}
                                        </span>
                                    )}
                                </div>
                                <input
                                    id="uniqueRepId"
                                    name="uniqueRepId"
                                    type="text"
                                    className="input-field"
                                    placeholder={expectedCode ? `e.g. ${expectedCode}` : "Enter name to see expected code"}
                                    style={{ borderColor: 'var(--color-primary)', letterSpacing: '0.05em', fontWeight: 600 }}
                                    value={formData.uniqueRepId}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* DYNAMIC FIELD PANEL FOR STUDENTS */}
                    {formData.role === 'student' && (
                        <div className="card" style={{
                            backgroundColor: '#f8fafc',
                            padding: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-xs)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-xs)'
                        }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <UserCheck size={16} /> Student Credentials
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                Provide your campus roll and admission details.
                            </p>

                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xs)' }}>
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="input-label" htmlFor="rollNumber">Roll Number</label>
                                    <input
                                        id="rollNumber"
                                        name="rollNumber"
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. CS23B42"
                                        value={formData.rollNumber}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="input-label" htmlFor="admissionNumber">Admission Number</label>
                                    <input
                                        id="admissionNumber"
                                        name="admissionNumber"
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. ADM20239"
                                        value={formData.admissionNumber}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACADEMIC TARGET SELECTORS FOR STUDENTS AND REPRESENTATIVES */}
                    {(formData.role === 'student' || formData.role === 'rep') && (
                        <div className="card" style={{
                            backgroundColor: '#f8fafc',
                            padding: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-xs)'
                        }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Class Assignment
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                                Select the department and class division you are registered in.
                            </p>

                            <div className="input-group" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                <label className="input-label" htmlFor="department">Department</label>
                                <select
                                    id="department"
                                    name="department"
                                    className="input-field"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Department...</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                                    <option value="Information Technology">Information Technology</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                    <option value="Civil Engineering">Civil Engineering</option>
                                    <option value="Electrical Engineering">Electrical Engineering</option>
                                    <option value="Electronics">Electronics</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="input-label" htmlFor="semester">Semester</label>
                                    <select
                                        id="semester"
                                        name="semester"
                                        className="input-field"
                                        value={formData.semester}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select...</option>
                                        <option value="S1">Semester 1</option>
                                        <option value="S2">Semester 2</option>
                                        <option value="S3">Semester 3</option>
                                        <option value="S4">Semester 4</option>
                                        <option value="S5">Semester 5</option>
                                        <option value="S6">Semester 6</option>
                                        <option value="S7">Semester 7</option>
                                        <option value="S8">Semester 8</option>
                                    </select>
                                </div>
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="input-label" htmlFor="division">Division/Batch</label>
                                    <select
                                        id="division"
                                        name="division"
                                        className="input-field"
                                        value={formData.division}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select...</option>
                                        <option value="A">Division A</option>
                                        <option value="B">Division B</option>
                                        <option value="C">Division C</option>
                                        <option value="D">Division D</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-xs)', py: '0.75rem' }}>
                        Register Account
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 'var(--spacing-md)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Already registered?{' '}
                    <a href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in instead</a>
                </p>
            </div>
        </div>
    );
};

export default Signup;
