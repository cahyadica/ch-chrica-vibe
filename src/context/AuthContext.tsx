import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  bio?: string;
  subscribedCategories?: string[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  permissions: string[];
  loading: boolean;
  isAdmin: boolean;
  isAuthor: boolean;
  hasPermission: (p: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubRoles: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch/Sync Initial Profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          let currentRole = 'guest';

          if (firebaseUser.email === 'cahyadife@gmail.com') {
            currentRole = 'admin';
          }

          if (!userSnap.exists()) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Anonymous User',
              photoURL: firebaseUser.photoURL || '',
              role: currentRole,
              bio: '',
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          } else {
            const data = userSnap.data() as UserProfile;
            if (firebaseUser.email === 'cahyadife@gmail.com' && data.role !== 'admin') {
              await setDoc(userRef, { role: 'admin' }, { merge: true });
              data.role = 'admin';
            }
            setProfile(data);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }

        // Live update subscriptions
        unsubProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) setProfile(doc.data() as UserProfile);
        });

        unsubRoles = onSnapshot(collection(db, 'roles'), (snap) => {
          const roles = snap.docs.map(d => d.data());
          // Wait for profile to be available to determine permissions
          // This is a bit reactive
        });
      } else {
        setProfile(null);
        setPermissions([]);
        if (unsubProfile) unsubProfile();
        if (unsubRoles) unsubRoles();
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
      if (unsubRoles) unsubRoles();
    };
  }, []);

  // Separate effect for permissions based on current profile role
  useEffect(() => {
    if (!profile?.role) {
      setPermissions([]);
      return;
    }

    const unsubRoles = onSnapshot(collection(db, 'roles'), (snap) => {
      const roles = snap.docs.map(d => d.data());
      const userRole = roles.find(r => r.name.toLowerCase() === profile.role.toLowerCase());
      if (userRole) {
        setPermissions(userRole.permissions || []);
      }
    });

    return () => unsubRoles();
  }, [profile?.role]);

  const hasPermission = (p: string) => permissions.includes(p) || profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      permissions,
      loading,
      hasPermission,
      isAdmin: profile?.role?.toLowerCase() === 'admin',
      isAuthor: profile?.role?.toLowerCase() === 'author' || profile?.role?.toLowerCase() === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
