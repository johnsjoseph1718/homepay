import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Receipt, Users, PlusCircle, CheckCircle2, AlertCircle, FileSpreadsheet, TrendingUp, XCircle, ArrowUpRight } from 'lucide-react';

const RepDashboard = () => {
    const { user } = useAuth();
    const { getRequestsForUser, getPaymentsForRequest, closeRequest, getClassStudents, hasStudentPaid, payments, createRequest } = useData();

    const requests = getRequestsForUser();
    const classStudents = getClassStudents(user.department, user.semester, user.division);

    const [selectedReqId, setSelectedReqId] = useState('');
    const [activeTab, setActiveTab] = useState('paid'); // 'paid' | 'unpaid'
    const [creationError, setCreationError] = useState('');
    const [creationSuccess, setCreationSuccess] = useState('');

    const [newRequestData, setNewRequestData] = useState({
        title: '',
        amount: '',
        description: '',
        deadline: ''
    });

    // Set first request as selected request by default
    useEffect(() => {
        if (requests.length > 0 && !selectedReqId) {
            setSelectedReqId(requests[0].id);
        }
    }, [requests, selectedReqId]);

    // Inline request creator logic
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewRequestData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateRequest = (e) => {
        e.preventDefault();
        setCreationError('');
        setCreationSuccess('');

        if (!newRequestData.title || !newRequestData.amount || !newRequestData.description || !newRequestData.deadline) {
            setCreationError('All fields are required.');
            return;
        }

        try {
            const created = createRequest({
                ...newRequestData,
                amount: Number(newRequestData.amount)
            });
            setNewRequestData({ title: '', amount: '', description: '', deadline: '' });
            setSelectedReqId(created.id);
            setCreationSuccess('Payment request successfully broadcast to your class!');
            setTimeout(() => setCreationSuccess(''), 4000);
        } catch (err) {
            setCreationError('Failed to create the request.');
        }
    };

    const calculateRequestStats = (req) => {
        if (!req) return { collected: 0, target: 0, paidCount: 0, totalCount: 0, percent: 0 };
        const paidCount = classStudents.filter(s => hasStudentPaid(req.id, s.id)).length;
        const collected = paidCount * req.amount;
        const totalCount = classStudents.length;
        const target = totalCount * req.amount;
        const percent = target > 0 ? Math.round((collected / target) * 100) : 0;
        return { collected, target, paidCount, totalCount, percent };
    };

    // Calculate overall KPIs for class rep
    const totalCollectedAll = requests.reduce((sum, req) => {
        const paidCount = classStudents.filter(s => hasStudentPaid(req.id, s.id)).length;
        return sum + (paidCount * req.amount);
    }, 0);

    const activeRequests = requests.filter(r => r.status === 'active');
    const closedRequests = requests.filter(r => r.status === 'closed');

    // Compute average collection completion rate %
    const totalPossibleUnion = activeRequests.length * classStudents.length;
    const currentPaidCount = activeRequests.reduce((sum, r) => {
        return sum + classStudents.filter(s => hasStudentPaid(r.id, s.id)).length;
    }, 0);
    const overallCompletionRate = totalPossibleUnion > 0 ? Math.round((currentPaidCount / totalPossibleUnion) * 100) : 0;

    // Excel CSV Exporter Engine
    const handleExportCSV = (req) => {
        if (!req) return;
        
        const sortedList = classStudents.map(student => {
            const paidStatus = hasStudentPaid(req.id, student.id);
            const pRecord = payments.find(p => p.paymentRequestId === req.id && p.studentId === student.id);
            return {
                rollNumber: student.rollNumber || 'N/A',
                name: student.name,
                status: paidStatus ? 'Paid' : 'Unpaid',
                date: pRecord ? new Date(pRecord.paymentDate).toLocaleDateString() : 'N/A'
            };
        });

        const headers = ['Roll Number', 'Student Name', 'Payment Status', 'Paid Date'];
        const csvRows = [
            headers.join(','),
            ...sortedList.map(item => [
                `"${item.rollNumber}"`,
                `"${item.name}"`,
                `"${item.status}"`,
                `"${item.date}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `HomePay_${req.title.replace(/\s+/g, '_')}_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const activeRequestDetails = requests.find(r => r.id === selectedReqId);
    const reqStats = calculateRequestStats(activeRequestDetails);

    // Resolve Student lists for tracking tables (Sorted Roll-wise by DataContext)
    const paidStudents = classStudents.filter(s => selectedReqId && hasStudentPaid(selectedReqId, s.id));
    const unpaidStudents = classStudents.filter(s => selectedReqId && !hasStudentPaid(selectedReqId, s.id));
    const activeCohortList = activeTab === 'paid' ? paidStudents : unpaidStudents;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
            
            {/* Page Title Header */}
            <div className="flex justify-between items-center flex-wrap gap-md">
                <div>
                    <h1 className="display-title" style={{ marginBottom: '4px' }}>Representative Desk</h1>
                    <p className="text-muted">
                        Active Classroom: <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{user.department} • {user.semester} • Div {user.division}</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-success" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        Verified Rep: {user.uniqueRepId}
                    </span>
                    <span className="badge badge-success">Active Desk</span>
                </div>
            </div>

            {/* KPI Performance Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
                    <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Classroom Collected</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>${totalCollectedAll}</h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-success-text)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '6px' }}>
                        <TrendingUp size={14} /> all campaigns
                    </span>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                    <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Completion Rate</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>{overallCompletionRate}%</h2>
                    <div className="progress-container" style={{ marginTop: '10px' }}>
                        <div className="progress-bar" style={{ width: `${overallCompletionRate}%` }}></div>
                    </div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--color-success)' }}>
                    <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Collections</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>{activeRequests.length}</h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px', display: 'block' }}>
                        out of {requests.length} demands created
                    </span>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #64748b' }}>
                    <p className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cohort Members</p>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>{classStudents.length} Students</h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px', display: 'block' }}>
                        sorted by academic roll number
                    </span>
                </div>
            </div>

            {/* Split Section: Rapid Creator and Active Collections */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-lg)' }}>
                
                {/* 1. Sleek Inline Broadcast Request Form */}
                <div className="card">
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-xs)' }}>
                        <PlusCircle size={20} style={{ color: 'var(--color-primary)' }} />
                        Broadcast Demand
                    </h3>
                    <p className="text-muted" style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.8rem' }}>
                        Broadcast a new collection demand to all {classStudents.length} students of your class.
                    </p>

                    {creationError && (
                        <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-sm)', fontSize: '0.8rem', fontWeight: 500 }}>
                            {creationError}
                        </div>
                    )}
                    {creationSuccess && (
                        <div style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-sm)', fontSize: '0.8rem', fontWeight: 500 }}>
                            {creationSuccess}
                        </div>
                    )}

                    <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label" htmlFor="title">Fee Demand Title</label>
                            <input
                                id="title" name="title"
                                type="text" className="input-field"
                                placeholder="e.g. Annual Fest T-Shirt Fee"
                                value={newRequestData.title} onChange={handleInputChange} required
                            />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label" htmlFor="description">Payment Purpose</label>
                            <textarea
                                id="description" name="description"
                                className="input-field"
                                style={{ minHeight: '60px', resize: 'vertical' }}
                                placeholder="Provide brief purpose details for your class members..."
                                value={newRequestData.description} onChange={handleInputChange} required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="input-label" htmlFor="amount">Amount ($)</label>
                                <input
                                    id="amount" name="amount"
                                    type="number" min="1" step="0.01" className="input-field"
                                    placeholder="250"
                                    value={newRequestData.amount} onChange={handleInputChange} required
                                />
                            </div>
                            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="input-label" htmlFor="deadline">Due Deadline</label>
                                <input
                                    id="deadline" name="deadline"
                                    type="date" className="input-field"
                                    value={newRequestData.deadline} onChange={handleInputChange} required
                                />
                            </div>
                        </div>

                        {/* Lock coordinate metadata display */}
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            backgroundColor: 'var(--color-bg)',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>Target Class Audience:</span>
                            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                                {user.department} {user.semester}-{user.division} (Locked)
                            </span>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '4px' }}>
                            Broadcast to Class
                        </button>
                    </form>
                </div>

                {/* 2. Active Collections Section */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-xs)' }}>
                        <Receipt size={20} style={{ color: 'var(--color-primary)' }} />
                        Active Campaigns ({activeRequests.length})
                    </h3>
                    <p className="text-muted" style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.8rem' }}>
                        Track collections and close active campaigns when finished.
                    </p>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '310px' }}>
                        {activeRequests.map(req => {
                            const stats = calculateRequestStats(req);
                            const selected = selectedReqId === req.id;
                            return (
                                <div key={req.id} 
                                    onClick={() => setSelectedReqId(req.id)}
                                    style={{
                                        border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '12px 16px',
                                        backgroundColor: selected ? 'var(--color-primary-light)' : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>{req.title}</h4>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>${req.amount}</span>
                                    </div>
                                    
                                    <div className="flex justify-between" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                                        <span>Collected: ${stats.collected} / ${stats.target}</span>
                                        <span style={{ fontWeight: 600 }}>{stats.paidCount} / {stats.totalCount} Paid ({stats.percent}%)</span>
                                    </div>

                                    <div className="progress-container" style={{ height: '6px', margin: '4px 0 10px' }}>
                                        <div className="progress-bar" style={{ width: `${stats.percent}%`, backgroundColor: 'var(--color-primary)' }}></div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Due: {new Date(req.deadline).toLocaleDateString()}</span>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Are you sure you want to close this payment collection?')) {
                                                    closeRequest(req.id);
                                                    if (selectedReqId === req.id) setSelectedReqId('');
                                                }
                                            }}
                                            className="btn btn-outline" 
                                            style={{ 
                                                fontSize: '0.7rem', 
                                                padding: '2px 8px', 
                                                borderColor: 'var(--color-danger-border)',
                                                color: 'var(--color-danger-text)',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            Close Campaign
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {activeRequests.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-lg)' }}>
                                <AlertCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                <p style={{ fontSize: '0.85rem' }}>No active collection campaigns.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Selected Request Tracking and Excel Exports */}
            {activeRequestDetails ? (
                <div className="card animate-fade-in">
                    
                    {/* tracking header */}
                    <div className="flex justify-between items-center flex-wrap gap-md" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                        <div>
                            <span className="badge badge-warning" style={{ fontSize: '0.65rem', marginBottom: 'var(--spacing-xs)' }}>Selected Campaign</span>
                            <h3 className="section-title" style={{ marginBottom: '2px' }}>{activeRequestDetails.title}</h3>
                            <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                                Tracking stats: <span style={{ fontWeight: 700 }}>{reqStats.paidCount} paid</span> out of <span style={{ fontWeight: 700 }}>{reqStats.totalCount} students</span> total.
                            </p>
                        </div>
                        
                        {/* CSV Export Trigger */}
                        <button 
                            onClick={() => handleExportCSV(activeRequestDetails)}
                            className="btn btn-success"
                            style={{ gap: '8px' }}
                        >
                            <FileSpreadsheet size={18} />
                            Export Excel (CSV)
                        </button>
                    </div>

                    {/* Interactive Tab Selectors */}
                    <div className="tabs-container" style={{ marginBottom: 'var(--spacing-md)' }}>
                        <button 
                            className={`tab-btn ${activeTab === 'paid' ? 'active' : ''}`}
                            onClick={() => setActiveTab('paid')}
                        >
                            Paid Students ({paidStudents.length})
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'unpaid' ? 'active' : ''}`}
                            onClick={() => setActiveTab('unpaid')}
                        >
                            Unpaid Students ({unpaidStudents.length})
                        </button>
                    </div>

                    {/* Class Tracker List Table */}
                    <div className="table-container shadow-md">
                        <table>
                            <thead>
                                <tr>
                                    <th>Roll Number</th>
                                    <th>Student Name</th>
                                    <th>Status</th>
                                    {activeTab === 'paid' && <th>Receipt Date</th>}
                                    {activeTab === 'paid' && <th>Collected</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {activeCohortList.map(student => {
                                    const paymentRecord = payments.find(p => p.paymentRequestId === selectedReqId && p.studentId === student.id);
                                    return (
                                        <tr key={student.id}>
                                            <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '0.8rem' }}>{student.rollNumber || 'N/A'}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{student.name}</td>
                                            <td>
                                                <span className={`badge ${activeTab === 'paid' ? 'badge-success' : 'badge-danger'}`}>
                                                    {activeTab === 'paid' ? 'Paid' : 'Unpaid'}
                                                </span>
                                            </td>
                                            {activeTab === 'paid' && (
                                                <td style={{ color: 'var(--color-text-muted)' }}>
                                                    {paymentRecord ? new Date(paymentRecord.paymentDate).toLocaleString() : 'N/A'}
                                                </td>
                                            )}
                                            {activeTab === 'paid' && (
                                                <td style={{ fontWeight: 700, color: 'var(--color-success-text)' }}>
                                                    ${activeRequestDetails.amount}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}

                                {activeCohortList.length === 0 && (
                                    <tr>
                                        <td colSpan={activeTab === 'paid' ? 5 : 3} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-lg)' }}>
                                            No students found in this category.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                    <p className="text-muted">Select or create an active campaign above to track individual student payments.</p>
                </div>
            )}

            {/* Classroom Roster Section */}
            <div className="card animate-fade-in">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-xs)' }}>
                    <Users size={22} style={{ color: 'var(--color-primary)' }} />
                    Classroom Roster (Registered Students)
                </h3>
                <p className="text-muted" style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.8rem' }}>
                    View all students currently registered in {user.department} • {user.semester} • Division {user.division}.
                </p>

                <div className="table-container shadow-md">
                    <table>
                        <thead>
                            <tr>
                                <th>Roll Number</th>
                                <th>Student Name</th>
                                <th>Email</th>
                                <th>Admission Number</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classStudents.map(student => (
                                <tr key={student.id}>
                                    <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)', fontSize: '0.8rem' }}>
                                        {student.rollNumber || 'N/A'}
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                                        {student.name}
                                    </td>
                                    <td style={{ color: 'var(--color-text-muted)' }}>
                                        {student.email}
                                    </td>
                                    <td style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                        {student.admissionNumber || 'N/A'}
                                    </td>
                                    <td>
                                        <span className="badge badge-success">Registered</span>
                                    </td>
                                </tr>
                            ))}

                            {classStudents.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-lg)' }}>
                                        No registered students found in this class yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Collection History Logs (Closed Campaigns) */}
            <div>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={22} style={{ color: 'var(--color-text-muted)' }} />
                    Collection History (Closed Campaigns)
                </h3>

                <div className="grid-3" style={{ marginTop: 'var(--spacing-sm)' }}>
                    {closedRequests.map(req => {
                        const stats = calculateRequestStats(req);
                        return (
                            <div key={req.id} className="card" style={{ backgroundColor: '#fafbfc' }}>
                                <div className="flex justify-between items-start" style={{ marginBottom: '4px' }}>
                                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{req.title}</h4>
                                    <span className="badge" style={{ backgroundColor: '#cbd5e1', color: '#334155' }}>Closed</span>
                                </div>
                                <p className="text-muted" style={{ fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '36px', marginBottom: '8px' }}>
                                    {req.description}
                                </p>

                                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Targeted Fee:</span>
                                        <span style={{ fontWeight: 600 }}>${req.amount} / stud</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Total Realized:</span>
                                        <span style={{ fontWeight: 700, color: 'var(--color-success-text)' }}>${stats.collected}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Collection Ratio:</span>
                                        <span style={{ fontWeight: 600 }}>{stats.paidCount} / {stats.totalCount} Paid</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleExportCSV(req)}
                                    className="btn btn-outline"
                                    style={{ width: '100%', padding: '6px', fontSize: '0.75rem', marginTop: '12px', gap: '6px' }}
                                >
                                    <FileSpreadsheet size={14} /> Download Archive Excel
                                </button>
                            </div>
                        );
                    })}

                    {closedRequests.length === 0 && (
                        <div className="card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: 'var(--spacing-lg)', backgroundColor: 'transparent', borderStyle: 'dashed' }}>
                            <p className="text-muted">No closed collections in history logs.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RepDashboard;
