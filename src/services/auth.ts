import { auth, db, googleProvider } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  UserCredential,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword
} from 'firebase/auth';
import { 
  doc, 
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs
} from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

// Unified function to create/update user in Firestore
const createOrUpdateUser = async (
  uid: string,
  data: {
    name: string;
    email: string;
    role: 'vendor' | 'wholesaler'; // Updated roles
    type: 'email' | 'google'; // Removed twitter
    photoURL?: string | null;
  }
) => {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  const userData = {
    ...data,
    updatedAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  };

  if (userDoc.exists()) {
    // Update existing user
    await setDoc(userRef, userData, { merge: true });
  } else {
    // Create new user
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
    });
  }
};

// Email signup
export const emailSignUp = async (
  email: string, 
  password: string, 
  name: string, 
  role: 'vendor' | 'wholesaler' // Updated roles
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update auth profile
  await updateProfile(userCredential.user, { displayName: name });
  
  // Create user in Firestore
  await createOrUpdateUser(userCredential.user.uid, {
    name,
    email,
    role,
    type: 'email',
  });
  
  return userCredential;
};

// Email login
export const emailLogin = async (
  email: string, 
  password: string, 
  role: 'vendor' | 'wholesaler' // Updated roles
) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Update user role in Firestore
  await createOrUpdateUser(userCredential.user.uid, {
    name: userCredential.user.displayName || '',
    email: userCredential.user.email || '',
    role,
    type: 'email',
  });
  
  return userCredential;
};

// Provider sign-in (Google only)
export const providerSignIn = async (
  role: 'vendor' | 'wholesaler' // Updated roles
) => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  
  // Create/update user in Firestore
  await createOrUpdateUser(userCredential.user.uid, {
    name: userCredential.user.displayName || '',
    email: userCredential.user.email || '',
    role,
    type: 'google',
    photoURL: userCredential.user.photoURL || null,
  });
  
  return userCredential;
};

// Password reset with actual password update
export const resetPassword = async (email: string, newPassword: string) => {
  try {
    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('User not found');
    }

    // Send password reset email
    await sendPasswordResetEmail(auth, email);
    
    // If user is found and email is sent, update password in auth
    // Note: This requires the user to be logged in, so we need to sign them in first
    // This approach is not recommended - see note below
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to reset password');
  }
};

// Actual password update function (requires logged-in user)
export const updateUserPassword = async (newPassword: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  
  try {
    await updatePassword(user, newPassword);
    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update password');
  }
};