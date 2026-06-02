import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, db, doc, getDoc, setDoc } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [googleUser, setGoogleUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data();
            setUser(profileData);
            setGoogleUser(null);
          } else {
            setGoogleUser({
              name: firebaseUser.displayName || '',
              email: firebaseUser.email,
              uid: firebaseUser.uid
            });
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      return { success: false, error: 'Firebase is not initialized. Please configure your Vercel Environment Variables.' };
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { email, displayName, uid } = result.user;

      const userDoc = await getDoc(doc(db, "users", uid));

      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setUser(profileData);
        return { success: true, isNewUser: false };
      } else {
        setGoogleUser({ name: displayName || '', email, uid });
        return { success: true, isNewUser: true };
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      return { success: false, error: error.message || 'Google sign in failed' };
    }
  };

  const completeGoogleSignup = async (signupData) => {
    if (!googleUser) {
      return { success: false, error: 'No active Google session found.' };
    }

    const { role } = signupData;

    let assignedDetails = {
      department: signupData.department || '',
      semester: signupData.semester || '',
      division: signupData.division || '',
      rollNumber: signupData.rollNumber || '',
      admissionNumber: signupData.admissionNumber || '',
      uniqueRepId: '',
      activeStatus: 'active'
    };

    if (role === 'representative') {
      if (!signupData.department || !signupData.semester || !signupData.division) {
        return { success: false, error: 'Department, Semester, and Division are required for representatives.' };
      }

      const firstName = googleUser.name.trim().split(/\s+/)[0] || '';
      if (!firstName) {
        return { success: false, error: 'Full Name is required to validate representative access.' };
      }

      const expectedCode = `${firstName}0001`;
      const enteredCode = signupData.uniqueRepId?.trim();

      if (enteredCode !== expectedCode) {
        return { success: false, error: 'Representative code invalid' };
      }

      assignedDetails.department = signupData.department;
      assignedDetails.semester = signupData.semester;
      assignedDetails.division = signupData.division;
      assignedDetails.uniqueRepId = expectedCode;
      assignedDetails.activeStatus = 'active';
    } else if (role === 'student') {
      if (!signupData.rollNumber || !signupData.admissionNumber || !signupData.department || !signupData.semester || !signupData.division) {
        return { success: false, error: 'All academic credentials and class selections are required for students.' };
      }
    }

    const newUser = {
      id: googleUser.uid,
      name: googleUser.name,
      email: googleUser.email,
      role, // 'student' | 'representative' | 'admin'
      uid: googleUser.uid,
      ...assignedDetails
    };

    try {
      await setDoc(doc(db, "users", googleUser.uid), newUser);
      setUser(newUser);
      setGoogleUser(null);
      return { success: true };
    } catch (err) {
      console.error('Error writing user profile to Firestore:', err);
      return { success: false, error: err.message || 'Failed to save profile' };
    }
  };

  const cancelGoogleSignup = async () => {
    setGoogleUser(null);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Firebase signout error:', e);
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Firebase signout error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, googleUser, loading, signInWithGoogle, completeGoogleSignup, cancelGoogleSignup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
