import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Receipt, Users, PlusCircle, ShieldCheck, Key, Settings, Ban, CheckCircle2 } from 'lucide-react';

const AdminDashboard = () => {
    const { requests, getPaymentsForRequest, closeRequest } = useData();
    const [activePanel, setActivePanel] = useState('overview'); // 'overview' | 'reps'
    
    // Representative Access keys list state
    const [repAccessKeys, setRepAccessKeys] = useState([]);
    
    // Authorization form state
    const [newKeyData, setNewKeyData] = useState({
        id: '',
        department: '',
        semester: '',
        division: ''
    });
    const [keySuccess, setKeySuccess] = useState('');
    const [keyError, setKeyError] = useState('');

    useEffect(() => {
        const savedKeys = JSON.parse(localStorage.getItem('homepay_db_rep_access_ids') || '[]');
        setRepAccessKeys(savedKeys);
    }, []);

    const saveAccessKeys = (newKeys) => {
        setRepAccessKeys(newKeys);
        localStorage.setItem('homepay_db_rep_access_ids', JSON.stringify(newKeys));
    };

    // Pre-authorize new representative key
    const handleAuthorizeKey = (e) => {
        e.preventDefault();
        setKeySuccess('');
        setKeyError('');

        if (!newKeyData.id || !newKeyData.department || !newKeyData.semester || !newKeyData.division) {
            setKeyError('Please fill out all key authorization fields.');
            return;
        }

        const trimmedId = newKeyData.id.trim();
        const exists = repAccessKeys.some(k => k.id.toLowerCase() === trimmedId.toLowerCase());
        
        if (exists) {
            setKeyError('Representative Access ID already exists.');
            return;
        }

        const newKeysList = [
            ...repAccessKeys,
            {
                id: trimmedId,
                department: newKeyData.department,
                semester: newKeyData.semester,
                division: newKeyData.division,
                isUsed: false
            }
        ];

        saveAccessKeys(newKeysList);
        setNewKeyData({ id: '', department: '', semester: '', division: '' });
        setKeySuccess(`Access ID "${trimmedId}" authorized successfully!`);
        setTimeout(() => setKeySuccess(''), 3000);
    };

    const handleDeleteKey = (keyId) => {
        if (window.confirm(`Are you sure you want to revoke authorization for representative key ${keyId}?`)) {
            const filtered = repAccessKeys.filter(k => k.id !== keyId);
            saveAccessKeys(filtered);
        }
    };

    const totalCollectedAll = requests.reduce((total, req) => {
        const pays = getPaymentsForRequest(req.id);
        const reqTotal = pays.reduce((sum, p) => sum + p.amount, 0);
        return total + reqTotal;
    }, 0);

    const activeRequestsCount = requests.filter(r => r.status === 'active').length;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
            
            {/* Header banner */}
            <div className="flex justify-between items-center flex-wrap gap-md">
                <div>
                    <h1 className="display-title" style={{ marginBottom: '4px' }}>Administrative Console</h1>
                    <p className="text-muted">Global campus overview and user management workspace</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} /> Master Admin
                    </span>
                </div>
            </div>

            {/* Global KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                    <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Collected Total</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>${totalCollectedAll}</h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-success-text)', fontWeight: 600 }}>Across all classrooms</span>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                    <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Collections</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>{activeRequestsCount} Campaigns</h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Currently accepting payments</span>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--color-success)' }}>
                    <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collection Demands Issued</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>{requests.length} Requests</h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Created system-wide</span>
                </div>
            </div>

            {/* Panel Selector Tabs */}
            <div className="tabs-container" style={{ marginBottom: 'var(--spacing-xs)' }}>
                <button 
                    className={`tab-btn ${activePanel === 'overview' ? 'active' : ''}`}
                    onClick={() => setActivePanel('overview')}
                    style={{ fontSize: '1rem', fontWeight: 600 }}
                >
                    Global Overview & Campaigns
                </button>
                <button 
                    className={`tab-btn ${activePanel === 'reps' ? 'active' : ''}`}
                    onClick={() => setActivePanel('reps')}
                    style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <Key size={16} /> Representative Access Keys ({repAccessKeys.length})
                </button>
            </div>

            {/* TAB PANEL 1: OVERVIEW */}
            {activePanel === 'overview' && (
                <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
                        <h3 className="section-title" style={{ marginBottom: 0 }}>All Payment Campaigns</h3>
                        <p className="text-muted" style={{ fontSize: '0.8rem' }}>Review progress and manually override active demands.</p>
                    </div>

                    <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                        <table style={{ minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th>Campaign Description</th>
                                    <th>Manager ID</th>
                                    <th>Target Class Coordinates</th>
                                    <th>Target Fee</th>
                                    <th>Collected Sum</th>
                                    <th>Status Badge</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => {
                                    const collected = getPaymentsForRequest(req.id).reduce((sum, p) => sum + p.amount, 0);
                                    const isActive = req.status === 'active';

                                    return (
                                        <tr key={req.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{req.title}</td>
                                            <td style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{req.createdBy}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    <span className="badge" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>{req.department}</span>
                                                    <span className="badge" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>{req.semester}</span>
                                                    <span className="badge" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>Div {req.division}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>${req.amount}</td>
                                            <td style={{ fontWeight: 800, color: 'var(--color-primary)' }}>${collected}</td>
                                            <td>
                                                <span className={`badge ${isActive ? 'badge-warning' : 'badge-success'}`}>
                                                    {isActive ? 'Active' : 'Closed'}
                                                </span>
                                            </td>
                                            <td>
                                                {isActive && (
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--color-danger-border)', color: 'var(--color-danger-text)' }}
                                                        onClick={() => {
                                                            if (window.confirm(`Are you sure you want to close the campaign "${req.title}"?`)) {
                                                                closeRequest(req.id);
                                                            }
                                                        }}
                                                    >
                                                        Force Close
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>
                                            No payment campaigns found in local memory database.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB PANEL 2: KEY MANAGEMENT WORKSPACE */}
            {activePanel === 'reps' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    
                    {/* Left: Key Authorization Console */}
                    <div className="card animate-fade-in" style={{ alignSelf: 'flex-start' }}>
                        <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--spacing-xs)' }}>
                            <Settings size={20} style={{ color: 'var(--color-primary)' }} />
                            Authorize Rep Key
                        </h3>
                        <p className="text-muted" style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.8rem' }}>
                            Register and pre-authorize unique codes to bind new Class Representatives to their target academic classrooms.
                        </p>

                        {keyError && (
                            <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-sm)', fontSize: '0.8rem', fontWeight: 500 }}>
                                {keyError}
                            </div>
                        )}
                        {keySuccess && (
                            <div style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-sm)', fontSize: '0.8rem', fontWeight: 500 }}>
                                {keySuccess}
                            </div>
                        )}

                        <form onSubmit={handleAuthorizeKey} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label" htmlFor="keyId">Unique Access Code</label>
                                <input
                                    id="keyId"
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. David0004"
                                    style={{ borderColor: 'var(--color-primary)', fontWeight: 700, letterSpacing: '0.05em' }}
                                    value={newKeyData.id}
                                    onChange={(e) => setNewKeyData(prev => ({ ...prev, id: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label" htmlFor="keyDept">Target Department</label>
                                <select
                                    id="keyDept"
                                    className="input-field"
                                    value={newKeyData.department}
                                    onChange={(e) => setNewKeyData(prev => ({ ...prev, department: e.target.value }))}
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
                                    <label className="input-label" htmlFor="keySem">Semester</label>
                                    <select
                                        id="keySem"
                                        className="input-field"
                                        value={newKeyData.semester}
                                        onChange={(e) => setNewKeyData(prev => ({ ...prev, semester: e.target.value }))}
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
                                    <label className="input-label" htmlFor="keyDiv">Division/Batch</label>
                                    <select
                                        id="keyDiv"
                                        className="input-field"
                                        value={newKeyData.division}
                                        onChange={(e) => setNewKeyData(prev => ({ ...prev, division: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select...</option>
                                        <option value="A">Division A</option>
                                        <option value="B">Division B</option>
                                        <option value="C">Division C</option>
                                        <option value="D">Division D</option>
                                        <option value="ALL">All Divisions</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
                                Register & Authorize ID Key
                            </button>
                        </form>
                    </div>

                    {/* Right: Key Directory */}
                    <div className="card animate-fade-in" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
                            <h3 className="section-title" style={{ marginBottom: 0 }}>Access Key Directory</h3>
                            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Inspect, review claims, and manage credentials.</p>
                        </div>

                        <div className="table-container" style={{ border: 'none', borderRadius: 0, flex: 1 }}>
                            <table style={{ minWidth: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Access ID Key</th>
                                        <th>Target Class Assignment</th>
                                        <th>Claim Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {repAccessKeys.map(key => (
                                        <tr key={key.id}>
                                            <td style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                                                {key.id}
                                            </td>
                                            <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                {key.department.substring(0, 12)}... {key.semester}-{key.division}
                                            </td>
                                            <td>
                                                <span className={`badge ${key.isUsed ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.6rem' }}>
                                                    {key.isUsed ? 'Registered' : 'Available'}
                                                </span>
                                            </td>
                                            <td>
                                                {!key.isUsed && (
                                                    <button 
                                                        onClick={() => handleDeleteKey(key.id)}
                                                        className="btn btn-outline" 
                                                        style={{ 
                                                            padding: '2px 8px', 
                                                            fontSize: '0.7rem', 
                                                            borderColor: '#fee2e2', 
                                                            color: 'var(--color-danger-text)',
                                                            backgroundColor: 'white'
                                                        }}
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}

                                    {repAccessKeys.length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>
                                                No representative keys authorized.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
