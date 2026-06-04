import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, db, doc, getDoc, setDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('homepay_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'rep') {
          parsed.role = 'representative';
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
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
          let userDoc = null;
          const isGoogle = firebaseUser.providerData.some(p => p.providerId === 'google.com');
          
          try {
            userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (!userDoc.exists() && !isGoogle) {
              // Wait 1 second for the signup function to finish creating the Firestore profile document
              await new Promise(resolve => setTimeout(resolve, 1000));
              userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            }
          } catch (err) {
            console.warn("Firestore fetch error, falling back to cache:", err);
            const cachedUser = localStorage.getItem('homepay_user');
            if (cachedUser) {
              const parsed = JSON.parse(cachedUser);
              if (parsed.uid === firebaseUser.uid) {
                setUser(parsed);
                setGoogleUser(null);
                setLoading(false);
                return;
              }
            }
            throw err;
          }

          if (userDoc && userDoc.exists()) {
            const profileData = userDoc.data();
            if (profileData.role === 'rep') {
              profileData.role = 'representative';
              setDoc(doc(db, "users", firebaseUser.uid), { role: 'representative' }, { merge: true }).catch(err => console.error("Error upgrading user role:", err));
            }
            setUser(profileData);
            localStorage.setItem('homepay_user', JSON.stringify(profileData));
            setGoogleUser(null);
          } else {
            if (isGoogle) {
              setGoogleUser({
                name: firebaseUser.displayName || '',
                email: firebaseUser.email,
                uid: firebaseUser.uid
              });
            }
            setUser(null);
            localStorage.removeItem('homepay_user');
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          setUser(null);
          localStorage.removeItem('homepay_user');
        }
      } else {
        setUser(null);
        localStorage.removeItem('homepay_user');
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

      let userDoc = null;
      try {
        userDoc = await getDoc(doc(db, "users", uid));
      } catch (err) {
        console.warn("Google Sign-In Firestore check failed, falling back to cache:", err);
        const cachedUser = localStorage.getItem('homepay_user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          if (parsed.uid === uid) {
            setUser(parsed);
            return { success: true, isNewUser: false };
          }
        }
        throw new Error('Firestore is unreachable. Please verify that you have clicked "Create Database" under Firestore Database in your Firebase Console (homepay-d84fd) and allowed reads/writes in the Rules tab.');
      }

      if (userDoc && userDoc.exists()) {
        const profileData = userDoc.data();
        if (profileData.role === 'rep') {
          profileData.role = 'representative';
          setDoc(doc(db, "users", uid), { role: 'representative' }, { merge: true }).catch(err => console.error("Error upgrading user role:", err));
        }
        setUser(profileData);
        localStorage.setItem('homepay_user', JSON.stringify(profileData));
        return { success: true, isNewUser: false };
      } else {
        setGoogleUser({ name: displayName || '', email, uid });
        return { success: true, isNewUser: true };
      }
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'popup-closed-by-user' };
      }
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
      localStorage.setItem('homepay_user', JSON.stringify(newUser));
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

  const login = async (email, password) => {
    if (!auth) {
      return { success: false, error: 'Firebase is not initialized.' };
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const { uid } = result.user;
      
      let profileData = null;
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          profileData = userDoc.data();
          if (profileData.role === 'rep') {
            profileData.role = 'representative';
            setDoc(doc(db, "users", uid), { role: 'representative' }, { merge: true }).catch(err => console.error("Error upgrading user role:", err));
          }
        }
      } catch (err) {
        console.warn("Offline login Firestore fetch warning:", err);
        const cachedUser = localStorage.getItem('homepay_user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          if (parsed.uid === uid) {
            profileData = parsed;
          }
        }
        if (!profileData) {
          throw new Error('Firestore is unreachable. Please verify that you have clicked "Create Database" under Firestore Database in your Firebase Console (homepay-d84fd) and allowed reads/writes in the Rules tab.');
        }
      }

      if (profileData) {
        setUser(profileData);
        localStorage.setItem('homepay_user', JSON.stringify(profileData));
        return { success: true };
      } else {
        return { success: false, error: 'User profile not found.' };
      }
    } catch (error) {
      console.error("Email Login Error:", error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signup = async (signupData) => {
    if (!auth) {
      return { success: false, error: 'Firebase is not initialized.' };
    }
    const { name, email, password, role } = signupData;

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

      const firstName = name.trim().split(/\s+/)[0] || '';
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

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = result.user;

      const newUser = {
        id: uid,
        name,
        email,
        role, // 'student' | 'representative' | 'admin'
        uid,
        ...assignedDetails
      };

      try {
        console.log('[HomePay] Writing new user profile to Firestore users collection...');
        await setDoc(doc(db, "users", uid), newUser);
        console.log('[HomePay] Firestore profile successfully created for:', uid);
      } catch (err) {
        console.error('[HomePay] Error writing user profile to Firestore during signup:', err);
        try {
          console.log('[HomePay] Rolling back created Auth user account...');
          await result.user.delete();
          console.log('[HomePay] Successfully deleted orphaned Auth account.');
        } catch (delErr) {
          console.error('[HomePay] Failed to delete orphaned Auth account:', delErr);
        }
        return { success: false, error: `Failed to save database user profile: ${err.message}` };
      }

      setUser(newUser);
      localStorage.setItem('homepay_user', JSON.stringify(newUser));
      return { success: true };
    } catch (err) {
      console.error('Email Signup Error:', err);
      return { success: false, error: err.message || 'Failed to save profile' };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('homepay_user');
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Firebase signout error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, googleUser, loading, login, signup, signInWithGoogle, completeGoogleSignup, cancelGoogleSignup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
