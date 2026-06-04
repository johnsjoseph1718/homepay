import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Lock, FilePlus, ChevronLeft, ShieldCheck } from 'lucide-react';

const CreateRequest = () => {
    const { createRequest } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        amount: '',
        deadline: '',
        department: user.role === 'representative' ? user.department : '',
        semester: user.role === 'representative' ? user.semester : '',
        division: user.role === 'representative' ? user.division : ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const returnPath = user.role === 'admin' ? '/dashboard/admin' : '/dashboard/rep';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title || !formData.amount || !formData.description || !formData.deadline) {
            setError("Please fill out all request details.");
            return;
        }

        if (user.role === 'admin') {
            if (!formData.department || !formData.semester || !formData.division) {
                setError("Please select the target department, semester, and division coordinates.");
                return;
            }
        }

        try {
            await createRequest({
                ...formData,
                amount: Number(formData.amount)
            });
            navigate(returnPath);
        } catch (error) {
            console.error('Failed to create payment request:', error);
            setError("Failed to broadcast the demand.");
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <button
                className="btn btn-outline"
                style={{ marginBottom: 'var(--spacing-lg)', border: 'none', paddingLeft: 0, gap: '4px' }}
                onClick={() => navigate(returnPath)}
            >
                <ChevronLeft size={16} /> Back to Dashboard
            </button>

            <div className="card shadow-lg">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-xs)' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'var(--color-primary-light)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-primary)'
                    }}>
                        <FilePlus size={20} />
                    </div>
                    <div>
                        <h2 className="section-title" style={{ marginBottom: 0 }}>Create Payment Request</h2>
                        <p className="text-muted" style={{ fontSize: '0.8rem' }}>Broadcast fee demands to target classrooms</p>
                    </div>
                </div>

                {error && (
                    <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-md)', fontSize: '0.85rem', fontWeight: 500, borderLeft: '4px solid var(--color-danger)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    <div className="input-group">
                        <label className="input-label" htmlFor="title">Fee Demand Title</label>
                        <input
                            id="title" name="title"
                            type="text" className="input-field"
                            placeholder="e.g. Laboratory Record Print Book"
                            value={formData.title} onChange={handleInputChange} required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label" htmlFor="description">Demand Purpose / Instructions</label>
                        <textarea
                            id="description" name="description"
                            className="input-field"
                            style={{ resize: 'vertical', minHeight: '90px' }}
                            placeholder="Describe what this fee is for and other submission instructions..."
                            value={formData.description} onChange={handleInputChange} required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        <div className="input-group" style={{ flex: 1 }}>
                            <label className="input-label" htmlFor="amount">Amount ($)</label>
                            <input
                                id="amount" name="amount"
                                type="number" min="1" step="0.01" className="input-field"
                                placeholder="150"
                                value={formData.amount} onChange={handleInputChange} required
                            />
                        </div>

                        <div className="input-group" style={{ flex: 1 }}>
                            <label className="input-label" htmlFor="deadline">Due Deadline Date</label>
                            <input
                                id="deadline" name="deadline"
                                type="date" className="input-field"
                                value={formData.deadline} onChange={handleInputChange} required
                            />
                        </div>
                    </div>

                    {/* DYNAMIC TARGET LOCKING BASED ON ROLE */}
                    {user.role === 'representative' ? (
                        <div style={{
                            backgroundColor: '#f8fafc',
                            border: '1px dashed var(--color-input-border)',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            marginTop: '4px',
                            marginBottom: 'var(--spacing-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Lock size={16} style={{ color: 'var(--color-primary)' }} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Target Class</span>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                {user.department} • {user.semester} • Div {user.division} (Locked)
                            </span>
                        </div>
                    ) : (
                        /* Admin View: Full Target Configuration Panel */
                        <div className="card" style={{ padding: 'var(--spacing-md)', backgroundColor: '#fafaff', borderColor: 'var(--color-primary-light)', marginTop: '4px', marginBottom: 'var(--spacing-md)' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                <ShieldCheck size={16} /> Administrator Targeting System
                            </h4>
                            
                            <div className="input-group">
                                <label className="input-label" htmlFor="department">Target Department</label>
                                <select
                                    id="department" name="department"
                                    className="input-field"
                                    value={formData.department} onChange={handleInputChange} required
                                >
                                    <option value="" disabled>Select Department...</option>
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
                                    <label className="input-label" htmlFor="semester">Target Semester</label>
                                    <select
                                        id="semester" name="semester"
                                        className="input-field"
                                        value={formData.semester} onChange={handleInputChange} required
                                    >
                                        <option value="" disabled>Select...</option>
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
                                    <label className="input-label" htmlFor="division">Target Division</label>
                                    <select
                                        id="division" name="division"
                                        className="input-field"
                                        value={formData.division} onChange={handleInputChange} required
                                    >
                                        <option value="" disabled>Select...</option>
                                        <option value="A">Division A</option>
                                        <option value="B">Division B</option>
                                        <option value="C">Division C</option>
                                        <option value="D">Division D</option>
                                        <option value="ALL">All Divisions</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>
                            Broadcast Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRequest;
