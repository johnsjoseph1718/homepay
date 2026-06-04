import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { CreditCard, History, User, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

const StudentDashboard = () => {
    const { user } = useAuth();
    const { getRequestsForUser, getStudentPayments, makePayment } = useData();

    const requests = getRequestsForUser();
    const payments = getStudentPayments(user.id);

    const handlePay = async (reqId, amount) => {
        // Mock payment processing
        try {
            await makePayment(reqId, amount);
            alert(`Payment of $${amount} completed successfully!`);
        } catch (error) {
            console.error('Payment write failed:', error);
            alert('Payment could not be recorded. Please try again.');
        }
    };

    const hasPaid = (reqId) => {
        return payments.some(p => p.paymentRequestId === reqId && p.paymentStatus === 'paid');
    };

    // Filter requests into Unpaid (Active) and Paid (History)
    // A request belongs to "Active" if it is active AND student has not paid it yet.
    const activeUnpaidRequests = requests.filter(r => r.status === 'active' && !hasPaid(r.id));

    // For Payment History, we map the payments array to match the request titles
    const paymentRecords = payments.map(p => {
        const matchingRequest = requests.find(r => r.id === p.paymentRequestId);
        return {
            id: p.id,
            title: matchingRequest ? matchingRequest.title : 'Fee Payment',
            amount: p.amount,
            date: p.paymentDate,
            status: p.paymentStatus
        };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
            
            {/* Page Header Profile Hero */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: 'white',
                border: 'none'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <div>
                        <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', marginBottom: 'var(--spacing-sm)' }}>
                            Student Account
                        </span>
                        <h1 className="display-title" style={{ color: 'white', marginBottom: '4px' }}>Welcome back, {user.name}</h1>
                        <p style={{ opacity: 0.85, fontSize: '0.9rem' }}>
                            Classroom: {user.department} • {user.semester} • Div {user.division}
                        </p>
                    </div>
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        padding: '12px 18px',
                        borderRadius: 'var(--radius-md)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        fontSize: '0.85rem'
                    }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div>
                                <p style={{ opacity: 0.7, fontSize: '0.75rem', fontWeight: 600 }}>Roll Number</p>
                                <p style={{ fontWeight: 700, letterSpacing: '0.02em' }}>{user.rollNumber}</p>
                            </div>
                            <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.2)', paddingLeft: '16px' }}>
                                <p style={{ opacity: 0.7, fontSize: '0.75rem', fontWeight: 600 }}>Admission ID</p>
                                <p style={{ fontWeight: 700, letterSpacing: '0.02em' }}>{user.admissionNumber}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Fee Demands */}
            <div>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={22} style={{ color: 'var(--color-primary)' }} />
                    Active Payment Requests ({activeUnpaidRequests.length})
                </h2>

                <div className="grid-2">
                    {activeUnpaidRequests.map(req => {
                        const isOverdue = new Date(req.deadline) < new Date();
                        return (
                            <div key={req.id} className="card animate-fade-in" style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'space-between',
                                minHeight: '230px'
                            }}>
                                <div>
                                    <div className="flex justify-between items-start" style={{ marginBottom: 'var(--spacing-sm)' }}>
                                        <h3 className="card-title" style={{ maxWidth: '75%' }}>{req.title}</h3>
                                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                                            Pending
                                        </span>
                                    </div>
                                    <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 'var(--spacing-md)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {req.description}
                                    </p>
                                </div>

                                <div>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        backgroundColor: 'var(--color-bg)',
                                        padding: '10px 14px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        marginBottom: 'var(--spacing-md)'
                                    }}>
                                        <div>
                                            <p className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Amount Due</p>
                                            <p style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text)' }}>${req.amount}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                                                <Calendar size={12} /> Due Date
                                            </p>
                                            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: isOverdue ? 'var(--color-danger-text)' : 'var(--color-text)' }}>
                                                {new Date(req.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        onClick={() => handlePay(req.id, req.amount)}
                                    >
                                        Pay Demand Now
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {activeUnpaidRequests.length === 0 && (
                    <div className="card" style={{ 
                        textAlign: 'center', 
                        padding: 'var(--spacing-xl)',
                        borderColor: 'var(--color-success-bg)',
                        backgroundColor: 'var(--color-success-bg)',
                        color: 'var(--color-success-text)'
                    }}>
                        <CheckCircle2 size={36} style={{ margin: '0 auto var(--spacing-sm)' }} />
                        <p style={{ fontWeight: 600 }}>All caught up! No pending fee collections for your class.</p>
                    </div>
                )}
            </div>

            {/* Permanent Payment Transaction Log (NEW) */}
            <div>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={22} style={{ color: 'var(--color-primary)' }} />
                    Payment History
                </h2>

                <div className="table-container shadow-md">
                    <table style={{ minWidth: '600px' }}>
                        <thead>
                            <tr>
                                <th>Transaction Receipt ID</th>
                                <th>Fee Description</th>
                                <th>Amount Paid</th>
                                <th>Payment Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentRecords.map(record => (
                                <tr key={record.id}>
                                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                        {record.id}
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                                        {record.title}
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'var(--color-success-text)' }}>
                                        ${record.amount}
                                    </td>
                                    <td style={{ color: 'var(--color-text-muted)' }}>
                                        {new Date(record.date).toLocaleString(undefined, { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td>
                                        <span className="badge badge-success" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle2 size={12} /> Paid
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {paymentRecords.length === 0 && (
                        <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <AlertCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                            <p style={{ fontSize: '0.875rem' }}>No payment receipts recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
