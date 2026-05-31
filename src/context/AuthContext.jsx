import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('homepay_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

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

    // New Representative Code validation workflow
    if (role === 'rep') {
      if (!signupData.department || !signupData.semester || !signupData.division) {
        return { success: false, error: 'Department, Semester, and Division are required for representatives.' };
      }

      // Extract First Name and generate expected code
      const firstName = name.trim().split(/\s+/)[0] || '';
      if (!firstName) {
        return { success: false, error: 'Full Name is required to validate representative access.' };
      }

      const expectedCode = `${firstName}0001`;
      const enteredCode = signupData.uniqueRepId?.trim();

      if (enteredCode !== expectedCode) {
        return { success: false, error: 'Representative code invalid' };
      }

      // Set target parameters
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

    // Auto login after signup
    setUser(newUser);
    localStorage.setItem('homepay_user', JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('homepay_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
