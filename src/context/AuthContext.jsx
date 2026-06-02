import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('homepay_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [googleUser, setGoogleUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email;
        const users = JSON.parse(localStorage.getItem('homepay_db_users') || '[]');
        const foundUser = users.find(u => u.email?.trim().toLowerCase() === email?.trim().toLowerCase());

        if (foundUser) {
          if (foundUser.uid !== firebaseUser.uid) {
            foundUser.uid = firebaseUser.uid;
            localStorage.setItem('homepay_db_users', JSON.stringify(users));
          }
          setUser(foundUser);
          localStorage.setItem('homepay_user', JSON.stringify(foundUser));
          setGoogleUser(null);
        } else {
          setGoogleUser({ name: firebaseUser.displayName || '', email, uid: firebaseUser.uid });
          setUser(null);
          localStorage.removeItem('homepay_user');
        }
      } else {
        const savedUser = localStorage.getItem('homepay_user');
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        if (parsedUser && parsedUser.uid) {
          setUser(null);
          localStorage.removeItem('homepay_user');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('homepay_db_users') || '[]');
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('homepay_user', JSON.stringify(foundUser));
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      return { success: false, error: 'Firebase is not initialized. Please verify that your Vercel Environment Variables are correctly configured with VITE_ prefixes, and that you have redeployed.' };
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { email, displayName, uid } = result.user;

      const users = JSON.parse(localStorage.getItem('homepay_db_users') || '[]');
      const foundUser = users.find(u => u.email?.trim().toLowerCase() === email?.trim().toLowerCase());

      if (foundUser) {
        foundUser.uid = uid;
        localStorage.setItem('homepay_db_users', JSON.stringify(users));
        setUser(foundUser);
        localStorage.setItem('homepay_user', JSON.stringify(foundUser));
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

  const completeGoogleSignup = (signupData) => {
    if (!googleUser) {
      return { success: false, error: 'No active Google session found.' };
    }

    const { role } = signupData;
    const users = JSON.parse(localStorage.getItem('homepay_db_users') || '[]');

    let assignedDetails = {
      department: signupData.department || '',
      semester: signupData.semester || '',
      division: signupData.division || '',
      rollNumber: signupData.rollNumber || '',
      admissionNumber: signupData.admissionNumber || '',
      uniqueRepId: '',
      activeStatus: 'active'
    };

    if (role === 'rep') {
      if (!signupData.department || !signupData.semester || !signupData.division) {
        return { success: false, error: 'Department, Semester, and Division are required for representatives.' };
      }

      // Extract First Name from Google User Name and generate expected code
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
      role, // 'student' | 'rep' | 'admin'
      uid: googleUser.uid,
      ...assignedDetails
    };

    users.push(newUser);
    localStorage.setItem('homepay_db_users', JSON.stringify(users));

    setUser(newUser);
    localStorage.setItem('homepay_user', JSON.stringify(newUser));
    setGoogleUser(null);
    return { success: true };
  };

  const cancelGoogleSignup = async () => {
    setGoogleUser(null);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Firebase signout error:', e);
    }
  };

  const signup = (signupData) => {
    const { name, email, password, role } = signupData;
    const users = JSON.parse(localStorage.getItem('homepay_db_users') || '[]');
    
    if (users.some(u => u.email === email)) {
      return { success: false, error: 'Email already exists' };
    }

    let assignedDetails = {
      department: signupData.department || '',
      semester: signupData.semester || '',
      division: signupData.division || '',
      rollNumber: signupData.rollNumber || '',
      admissionNumber: signupData.admissionNumber || '',
      uniqueRepId: '',
      activeStatus: 'active'
    };

    if (role === 'rep') {
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

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role, // 'student' | 'rep' | 'admin'
      ...assignedDetails
    };

    users.push(newUser);
    localStorage.setItem('homepay_db_users', JSON.stringify(users));

    setUser(newUser);
    localStorage.setItem('homepay_user', JSON.stringify(newUser));
    return { success: true };
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
    <AuthContext.Provider value={{ user, googleUser, loading, login, signInWithGoogle, completeGoogleSignup, cancelGoogleSignup, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

