import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { UserProfile, isUserAdmin } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sync user session to Express backend
async function syncSessionWithBackend(userData: { uid: string; email: string; displayName?: string }) {
  try {
    await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  } catch (err) {
    console.warn('No se pudo sincronizar sesión con backend:', err);
  }
}

// Persist known user locally so all registered accounts are accessible in Admin Dashboard
export function rememberUserLocally(userProfile: UserProfile) {
  try {
    const raw = localStorage.getItem('MalaTinta Studio_known_users');
    let list: UserProfile[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    const idx = list.findIndex((u) => u.uid === userProfile.uid);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...userProfile };
    } else {
      list.push(userProfile);
    }
    localStorage.setItem('MalaTinta Studio_known_users', JSON.stringify(list));
  } catch (e) {
    console.warn('No se pudo guardar usuario en localStorage:', e);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile document in Firestore
  const syncOrCreateProfile = async (firebaseUser: User, customDisplayName?: string): Promise<UserProfile> => {
    const userDocPath = `users/${firebaseUser.uid}`;
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const shouldBeAdmin = isUserAdmin(firebaseUser.uid, firebaseUser.email, null);

    try {
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const effectiveRole = (shouldBeAdmin || data.role === 'admin') ? 'admin' : (data.role || 'cliente');
        const prof: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: data.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          photoURL: data.photoURL || firebaseUser.photoURL || null,
          role: effectiveRole,
          createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()) : new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };

        // Update last login in background — no await to avoid triggering re-renders
        setDoc(userDocRef, {
          role: effectiveRole,
          email: firebaseUser.email || data.email,
          displayName: prof.displayName,
          lastLoginAt: serverTimestamp(),
        }, { merge: true }).catch((e) => console.warn('Could not update lastLoginAt:', e));

        return prof;
      } else {
        // Document does not exist yet; create it
        const effectiveRole = shouldBeAdmin ? 'admin' : 'cliente';
        const newProf: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: customDisplayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          photoURL: firebaseUser.photoURL || null,
          role: effectiveRole,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, {
          ...newProf,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });

        return newProf;
      }
    } catch (err) {
      console.warn('Aviso al obtener/crear perfil en Firestore:', err);
      // Fallback in-memory profile so user is not blocked
      const fallbackProf: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: customDisplayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
        photoURL: firebaseUser.photoURL || null,
        role: shouldBeAdmin ? 'admin' : 'cliente',
        createdAt: new Date().toISOString(),
      };
      return fallbackProf;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const prof = await syncOrCreateProfile(currentUser);
          setProfile(prof);
          rememberUserLocally(prof);
          await syncSessionWithBackend({
            uid: prof.uid,
            email: prof.email,
            displayName: prof.displayName,
          });
        } catch (err) {
          console.error('Error cargando perfil:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    const prof = await syncOrCreateProfile(credential.user);
    setProfile(prof);
    rememberUserLocally(prof);
    await syncSessionWithBackend({
      uid: prof.uid,
      email: prof.email,
      displayName: prof.displayName,
    });
  };

  const register = async (email: string, pass: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName.trim()) {
      await updateProfile(credential.user, { displayName: displayName.trim() });
    }
    const prof = await syncOrCreateProfile(credential.user, displayName);
    setProfile(prof);
    rememberUserLocally(prof);
    await syncSessionWithBackend({
      uid: prof.uid,
      email: prof.email,
      displayName: prof.displayName,
    });
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await signInWithPopup(auth, provider);
    const prof = await syncOrCreateProfile(credential.user);
    setProfile(prof);
    rememberUserLocally(prof);
    await syncSessionWithBackend({
      uid: prof.uid,
      email: prof.email,
      displayName: prof.displayName,
    });
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
