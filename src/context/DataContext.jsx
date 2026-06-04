import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
    db,
    collection,
    onSnapshot,
    addDoc,
    serverTimestamp,
    updateDoc,
    getDocs,
    doc,
    setDoc
} from '../firebase';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [payments, setPayments] = useState([]);
    const [firestoreUsers, setFirestoreUsers] = useState([]);

    const normalise = (value) => (value || '').trim().toLowerCase();
    const resolveUserId = useCallback((targetUser = user) => targetUser?.uid || targetUser?.id || '', [user]);

    const requestMatchesStudent = useCallback((request, targetUser) => {
        const reqDivision = normalise(request.division);

        return normalise(request.department) === normalise(targetUser.department) &&
            normalise(request.semester) === normalise(targetUser.semester) &&
            (reqDivision === normalise(targetUser.division) || reqDivision === 'all');
    }, []);

    const requestMatchesUser = useCallback((request, targetUser) => {
        if (!targetUser) return false;
        if (targetUser.role === 'admin') return true;
        if (targetUser.role === 'representative') {
            return request.createdBy === resolveUserId(targetUser);
        }
        if (targetUser.role === 'student') {
            return requestMatchesStudent(request, targetUser);
        }
        return false;
    }, [requestMatchesStudent, resolveUserId]);

    useEffect(() => {
        if (!db) return;

        const unsubscribe = onSnapshot(
            collection(db, 'users'),
            (snapshot) => {
                const usersList = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
                setFirestoreUsers(usersList);
            },
            (error) => {
                console.error('[HomePay] users listener error:', error.code, error.message);
                setFirestoreUsers([]);
            }
        );

        return () => unsubscribe();
    }, []);



    useEffect(() => {
        if (!db || !user) {
            queueMicrotask(() => setRequests([]));
            return;
        }

        console.log(`[HomePay] Subscribing to payment_requests as ${user.role} (uid: ${resolveUserId(user)})`);

        const unsubscribe = onSnapshot(
            collection(db, 'payment_requests'),
            (snapshot) => {
                const list = snapshot.docs
                    .map((entry) => ({ id: entry.id, ...entry.data() }))
                    .filter((request) => requestMatchesUser(request, user))
                    .sort((a, b) => {
                        const aTime = a.createdAt?.toMillis?.() || 0;
                        const bTime = b.createdAt?.toMillis?.() || 0;
                        return bTime - aTime;
                    });

                console.log(`[HomePay] Realtime update - ${list.length} payment requests received for ${user.role}`);
                setRequests(list);
            },
            (error) => {
                console.error('[HomePay] payment_requests listener error:', error.code, error.message);
                setRequests([]);
            }
        );

        return () => {
            console.log(`[HomePay] Unsubscribed from payment_requests listener (${user.role})`);
            unsubscribe();
        };
    }, [requestMatchesUser, resolveUserId, user]);

    useEffect(() => {
        if (!db || !user) {
            queueMicrotask(() => setPayments([]));
            return;
        }

        const unsubscribe = onSnapshot(
            collection(db, 'payments'),
            (snapshot) => {
                const list = snapshot.docs
                    .map((entry) => ({ id: entry.id, ...entry.data() }))
                    .filter((payment) => {
                        if (user.role === 'admin') return true;
                        if (user.role === 'student') return payment.studentId === resolveUserId(user);
                        if (user.role === 'representative') {
                            return requests.some((request) => request.id === payment.paymentRequestId);
                        }
                        return false;
                    });

                setPayments(list);
            },
            (error) => {
                console.error('[HomePay] payments listener error:', error.code, error.message);
                setPayments([]);
            }
        );

        return () => unsubscribe();
    }, [requests, resolveUserId, user]);

    const createRequest = async (data) => {
        if (!db) throw new Error('Firestore is not initialized.');

        const newRequest = {
            title: data.title,
            description: data.description,
            amount: Number(data.amount),
            deadline: data.deadline,
            department: user.role === 'representative' ? user.department : data.department,
            semester: user.role === 'representative' ? user.semester : data.semester,
            division: user.role === 'representative' ? user.division : data.division,
            createdBy: resolveUserId(),
            status: 'active',
            createdAt: serverTimestamp()
        };

        try {
            console.log('[HomePay] Writing payment request to Firestore:', newRequest);
            const docRef = await addDoc(collection(db, 'payment_requests'), newRequest);
            console.log('[HomePay] Firestore write success: payment request created with ID:', docRef.id);
            return { id: docRef.id, ...newRequest };
        } catch (error) {
            console.error('[HomePay] Firestore write failed during payment request creation:', error);
            throw new Error(`Failed to save payment request: ${error.message}`);
        }
    };

    const closeRequest = async (id) => {
        if (!db) return;

        try {
            console.log('[HomePay] Closing payment request in Firestore:', id);
            await updateDoc(doc(db, 'payment_requests', id), { status: 'closed' });
            console.log('[HomePay] Firestore write success: payment request closed:', id);
        } catch (error) {
            console.error('[HomePay] Firestore write failed during closing payment request:', error);
            throw new Error(`Failed to close payment request: ${error.message}`);
        }
    };

    const makePayment = async (requestId, amount) => {
        if (!db) throw new Error('Firestore is not initialized.');

        const newPayment = {
            paymentRequestId: requestId,
            studentId: resolveUserId(),
            amount,
            paymentStatus: 'paid',
            paymentDate: new Date().toISOString(),
            createdAt: serverTimestamp()
        };

        try {
            console.log('[HomePay] Writing payment to Firestore:', newPayment);
            const docRef = await addDoc(collection(db, 'payments'), newPayment);
            console.log('[HomePay] Firestore write success: payment recorded with ID:', docRef.id);
            return { id: docRef.id, ...newPayment };
        } catch (error) {
            console.error('[HomePay] Firestore write failed during payment recording:', error);
            throw new Error(`Failed to record payment: ${error.message}`);
        }
    };

    const getRequestsForUser = useCallback(() => {
        return requests;
    }, [requests]);

    const getPaymentsForRequest = (requestId) => {
        return payments.filter((payment) => payment.paymentRequestId === requestId);
    };

    const getStudentPayments = (studentId) => {
        const currentUserId = resolveUserId();
        return payments.filter((payment) => payment.studentId === studentId || payment.studentId === currentUserId);
    };

    const hasStudentPaid = (requestId, studentId) => {
        const currentUserId = resolveUserId();

        return payments.some((payment) =>
            payment.paymentRequestId === requestId &&
            (payment.studentId === studentId || payment.studentId === currentUserId) &&
            payment.paymentStatus === 'paid'
        );
    };

    const getClassStudents = useCallback((dept, sem, div) => {
        const matchingFirestoreStudents = firestoreUsers.filter((entry) =>
            entry.role === 'student' &&
            normalise(entry.department) === normalise(dept) &&
            normalise(entry.semester) === normalise(sem) &&
            normalise(entry.division) === normalise(div)
        );

        return matchingFirestoreStudents.sort((a, b) =>
            (a.rollNumber || '').localeCompare(b.rollNumber || '', undefined, { numeric: true, sensitivity: 'base' })
        );
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
