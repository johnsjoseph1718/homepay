import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db, collection, onSnapshot } from '../firebase';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [payments, setPayments] = useState([]);
    const [firestoreUsers, setFirestoreUsers] = useState([]);

    // Sync Firestore registered users in real-time
    useEffect(() => {
        if (!db) return;
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersList = [];
            snapshot.forEach(doc => {
                usersList.push({ id: doc.id, ...doc.data() });
            });
            setFirestoreUsers(usersList);
        });
        return () => unsubscribe();
    }, []);

    // Seed mock data if database is empty
    useEffect(() => {
        // Load active databases
        let dbRequests = JSON.parse(localStorage.getItem('homepay_db_requests') || '[]');
        let dbPayments = JSON.parse(localStorage.getItem('homepay_db_payments') || '[]');

        const repAlanId = 'rep_alan_id';

        // 2. Seed Default payment requests if empty
        if (dbRequests.length === 0) {
            dbRequests = [
                { id: 'req_1', title: 'College Union Fund', description: 'Contribution for college union activities and annual sports meet.', amount: 500, deadline: '2026-06-25', department: 'Computer Science', semester: 'S5', division: 'B', createdBy: repAlanId, status: 'active' },
                { id: 'req_2', title: 'Industrial Tour Transport', description: 'Bus rental and route accommodation advance payment.', amount: 1200, deadline: '2026-07-15', department: 'Computer Science', semester: 'S5', division: 'B', createdBy: repAlanId, status: 'active' },
                { id: 'req_3', title: 'Lab Record Sheets', description: 'Record sheets print, binding, and layout distribution fee.', amount: 150, deadline: '2026-05-10', department: 'Computer Science', semester: 'S5', division: 'B', createdBy: repAlanId, status: 'closed' }
            ];
            localStorage.setItem('homepay_db_requests', JSON.stringify(dbRequests));
        }

        // 3. Seed Default payments if empty
        if (dbPayments.length === 0) {
            dbPayments = [
                // Seed 2 students who paid Union Fund
                { id: 'pay_1', paymentRequestId: 'req_1', studentId: 'stud_1', amount: 500, paymentStatus: 'paid', paymentDate: '2026-05-28T10:00:00.000Z' },
                { id: 'pay_2', paymentRequestId: 'req_1', studentId: 'stud_2', amount: 500, paymentStatus: 'paid', paymentDate: '2026-05-29T14:30:00.000Z' },
                // Seed all students paying Lab Record Sheets (as it is closed)
                { id: 'pay_3', paymentRequestId: 'req_3', studentId: 'stud_1', amount: 150, paymentStatus: 'paid', paymentDate: '2026-05-08T09:15:00.000Z' },
                { id: 'pay_4', paymentRequestId: 'req_3', studentId: 'stud_2', amount: 150, paymentStatus: 'paid', paymentDate: '2026-05-08T09:25:00.000Z' },
                { id: 'pay_5', paymentRequestId: 'req_3', studentId: 'stud_3', amount: 150, paymentStatus: 'paid', paymentDate: '2026-05-09T10:45:00.000Z' },
                { id: 'pay_6', paymentRequestId: 'req_3', studentId: 'stud_4', amount: 150, paymentStatus: 'paid', paymentDate: '2026-05-09T11:10:00.000Z' },
                { id: 'pay_7', paymentRequestId: 'req_3', studentId: 'stud_5', amount: 150, paymentStatus: 'paid', paymentDate: '2026-05-09T15:20:00.000Z' }
            ];
            localStorage.setItem('homepay_db_payments', JSON.stringify(dbPayments));
        }

        setRequests(dbRequests);
        setPayments(dbPayments);
    }, []);

    const saveRequests = (newRequests) => {
        setRequests(newRequests);
        localStorage.setItem('homepay_db_requests', JSON.stringify(newRequests));
    };

    const savePayments = (newPayments) => {
        setPayments(newPayments);
        localStorage.setItem('homepay_db_payments', JSON.stringify(newPayments));
    };

    // --- Request Actions ---
    const createRequest = (data) => {
        const newRequest = {
            id: `req_${Date.now()}`,
            ...data,
            // Lock request parameters automatically to representative class coordinates
            department: user.role === 'representative' ? user.department : data.department,
            semester: user.role === 'representative' ? user.semester : data.semester,
            division: user.role === 'representative' ? user.division : data.division,
            createdBy: user.id,
            status: 'active'
        };
        saveRequests([...requests, newRequest]);
        return newRequest;
    };

    const closeRequest = (id) => {
        const newRequests = requests.map(r => r.id === id ? { ...r, status: 'closed' } : r);
        saveRequests(newRequests);
    };

    // --- Payment Actions ---
    const makePayment = (requestId, amount) => {
        const newPayment = {
            id: `pay_${Date.now()}`,
            paymentRequestId: requestId,
            studentId: user.id,
            amount,
            paymentStatus: 'paid',
            paymentDate: new Date().toISOString()
        };
        savePayments([...payments, newPayment]);
        return newPayment;
    };

    // --- Data Accessors ---
    const getRequestsForUser = useCallback(() => {
        if (!user) return [];
        if (user.role === 'admin') return requests;
        if (user.role === 'representative') return requests.filter(r => r.createdBy === user.id);
        
        // For Students, return all requests targeted at their specific Class
        if (user.role === 'student') {
            const userDept = user.department?.trim().toLowerCase();
            const userSem = user.semester?.trim().toLowerCase();
            const userDiv = user.division?.trim().toLowerCase();

            return requests.filter(r => {
                const reqDept = r.department?.trim().toLowerCase();
                const reqSem = r.semester?.trim().toLowerCase();
                const reqDiv = r.division?.trim().toLowerCase();

                return (!reqDept || reqDept === userDept) &&
                       (!reqSem || reqSem === userSem) &&
                       (!reqDiv || reqDiv === 'all' || reqDiv === userDiv);
            });
        }
        return [];
    }, [user, requests]);

    const getPaymentsForRequest = (requestId) => {
        return payments.filter(p => p.paymentRequestId === requestId);
    };

    const getStudentPayments = (studentId) => {
        return payments.filter(p => p.studentId === studentId);
    };

    const hasStudentPaid = (requestId, studentId) => {
        return payments.some(p => p.paymentRequestId === requestId && p.studentId === studentId && p.paymentStatus === 'paid');
    };

    // Fetch all students belonging to a target class
    const getClassStudents = useCallback((dept, sem, div) => {
        const matchingFirestoreStudents = firestoreUsers.filter(u => 
            u.role === 'student' && 
            u.department?.trim().toLowerCase() === dept?.trim().toLowerCase() &&
            u.semester?.trim().toLowerCase() === sem?.trim().toLowerCase() &&
            u.division?.trim().toLowerCase() === div?.trim().toLowerCase()
        );

        if (matchingFirestoreStudents.length > 0) {
            return matchingFirestoreStudents.sort((a, b) => {
                const rollA = a.rollNumber || '';
                const rollB = b.rollNumber || '';
                return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
            });
        }

        // Fallback to static seed students if no real Firestore users are registered in this class yet
        const seedStudents = [
            { id: 'stud_1', name: 'Abhijith K.', email: 'stud1@college.edu', role: 'student', department: 'Computer Science', semester: 'S5', division: 'B', rollNumber: 'CS23B01', admissionNumber: 'ADM8720' },
            { id: 'stud_2', name: 'Aishwarya Roy', email: 'stud2@college.edu', role: 'student', department: 'Computer Science', semester: 'S5', division: 'B', rollNumber: 'CS23B02', admissionNumber: 'ADM8721' },
            { id: 'stud_3', name: 'Basil Eldhose', email: 'stud3@college.edu', role: 'student', department: 'Computer Science', semester: 'S5', division: 'B', rollNumber: 'CS23B03', admissionNumber: 'ADM8722' },
            { id: 'stud_4', name: 'Devika S.', email: 'stud4@college.edu', role: 'student', department: 'Computer Science', semester: 'S5', division: 'B', rollNumber: 'CS23B04', admissionNumber: 'ADM8723' },
            { id: 'stud_5', name: 'Gautham Krishna', email: 'stud5@college.edu', role: 'student', department: 'Computer Science', semester: 'S5', division: 'B', rollNumber: 'CS23B05', admissionNumber: 'ADM8724' }
        ];

        return seedStudents.filter(u => 
            u.department?.trim().toLowerCase() === dept?.trim().toLowerCase() &&
            u.semester?.trim().toLowerCase() === sem?.trim().toLowerCase() &&
            u.division?.trim().toLowerCase() === div?.trim().toLowerCase()
        ).sort((a, b) => {
            const rollA = a.rollNumber || '';
            const rollB = b.rollNumber || '';
            return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [firestoreUsers]);

    return (
        <DataContext.Provider value={{
            requests,
            payments,
            createRequest,
            closeRequest,
            makePayment,
            getRequestsForUser,
            getPaymentsForRequest,
            getStudentPayments,
            hasStudentPaid,
            getClassStudents
        }}>
            {children}
        </DataContext.Provider>
    );
};
