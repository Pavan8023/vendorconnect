// src/pages/Login.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Lock, ArrowRight, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/components/ui/use-toast';
import {
  emailLogin,
  providerSignIn,
  resetPassword
} from '@/services/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { browserSessionPersistence, setPersistence, signInWithPopup } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, googleProvider, db } from '@/lib/firebase';

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
  role: z.enum(["vendor", "wholesaler"], {
    required_error: "Please select a role.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [user, loadingAuth] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [googleRole, setGoogleRole] = useState<'vendor' | 'wholesaler' | null>(null);

  // Forgot password states
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [userType, setUserType] = useState<'email' | 'google' | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  // Arithmetic CAPTCHA states
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Error notification states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "vendor",
    },
  });

  // Display error notification
  const showErrorNotification = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 5000);
  };

  // Set session persistence
  useEffect(() => {
    setPersistence(auth, browserSessionPersistence)
      .catch((error) => {
        console.error("Error setting session persistence:", error);
        showErrorNotification("We encountered a technical issue. Please try again later.");
      });
  }, []);

  // Fetch user role from Firestore
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } catch (error: any) {
        console.error('Error fetching user role:', error);
        showErrorNotification("Failed to load your account information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Redirect if user is already logged in
  useEffect(() => {
    if (userRole) {
      navigate(userRole === 'wholesaler' ? '/wholesaler' : '/vendor');
    }
  }, [userRole, navigate]);

  // Generate arithmetic CAPTCHA
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setNum1(n1);
    setNum2(n2);
    setCaptchaAnswer('');
    setCaptchaError('');
  };

  // Initialize CAPTCHA when needed
  useEffect(() => {
    if (forgotPasswordOpen && userType === 'email' && !captchaVerified) {
      generateCaptcha();
    }
  }, [forgotPasswordOpen, userType, captchaVerified]);

  const handleEmailLogin = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Check if user exists and role matches
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', values.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        // Check if user role matches selected role
        if (userData.role !== values.role) {
          throw new Error(
            `You are registered as a ${userData.role}. Please select the correct role.`
          );
        }
      }

      await setPersistence(auth, browserSessionPersistence);
      await emailLogin(values.email, values.password, values.role);

      toast({
        title: "Logged in successfully!",
        description: "Welcome back to VendorConnect.",
      });

      // Redirect based on role
      if (values.role === 'wholesaler') {
        navigate("/wholesaler");
      } else {
        navigate("/vendor");
      }
    } catch (error: any) {
      showErrorNotification(
        error.message || "We couldn't sign you in. Please check your credentials and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (role: 'vendor' | 'wholesaler') => {
    setIsLoading(true);
    setGoogleRole(role);
    try {
      await setPersistence(auth, browserSessionPersistence);
      
      // Sign in with Google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Create or update user in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      const userData = {
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        role: role,
        type: 'google',
        createdAt: new Date(),
      };

      if (userDoc.exists()) {
        // Update existing user
        await updateDoc(userRef, userData);
      } else {
        // Create new user
        await setDoc(userRef, userData);
      }

      toast({
        title: "Logged in successfully!",
        description: `Welcome back via Google as a ${role}`,
      });

      // Redirect based on role
      if (role === 'wholesaler') {
        navigate("/wholesaler");
      } else {
        navigate("/vendor");
      }
    } catch (error: any) {
      showErrorNotification(
        error.message || "We couldn't sign you in with Google. Please try again."
      );
    } finally {
      setIsLoading(false);
      setGoogleRole(null);
    }
  };

  // Handle forgot password flow
  const handleForgotPassword = async () => {
    setEmailError('');
    if (!forgotEmail) {
      setEmailError('Please enter your email address');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', forgotEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setEmailError('This email is not registered or your account has been deleted');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      setUserType(userData.type || 'email');
    } catch (error: any) {
      console.error('Error finding user:', error);
      setEmailError('Failed to find account. Please try again.');
      showErrorNotification("We encountered a technical issue. Please try again later.");
    }
  };

  // Verify arithmetic CAPTCHA
  const verifyCaptcha = () => {
    const correctAnswer = num1 + num2;
    const userAnswer = parseInt(captchaAnswer, 10);

    if (isNaN(userAnswer)) {
      setCaptchaError('Please enter a valid number');
      return;
    }

    if (userAnswer === correctAnswer) {
      setCaptchaVerified(true);
      setCaptchaError('');
    } else {
      setCaptchaError('Incorrect answer. Please try again.');
      generateCaptcha();
    }
  };

  const handlePasswordReset = async () => {
    setPasswordError('');

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in both password fields');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password should be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', forgotEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setPasswordError('User not found. Please try again.');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;

      await resetPassword(forgotEmail, newPassword);
      await updateDoc(doc(db, 'users', userId), {
        password: newPassword
      });

      setPasswordResetSuccess(true);
      setPasswordError('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setPasswordError('Failed to reset password. Please try again.');
      showErrorNotification("We couldn't reset your password. Please try again later.");
    }
  };

  const closeForgotPassword = () => {
    setForgotPasswordOpen(false);
    setForgotEmail('');
    setUserType(null);
    setCaptchaVerified(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordResetSuccess(false);
    setCaptchaAnswer('');
    setCaptchaError('');
  };

  const handleRoleSelection = (role: 'vendor' | 'wholesaler') => {
    // After selecting role, redirect accordingly
    if (role === 'wholesaler') {
      navigate('/wholesaler');
    } else {
      navigate('/vendor');
    }
    setProviderModalOpen(false);
  };

  if (loadingAuth || (user && !userRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500">
          <Loader2 className="h-8 w-8" />
        </div>
        <p className="mt-4 text-lg">Loading your account...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
      <Header searchQuery={''} onSearchChange={() => {}} cartItems={0} />

      {/* Error Notification */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white border border-red-300 rounded-lg shadow-lg p-4 flex items-start gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <div className="bg-green-800 w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">V</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-red-700 font-medium">VendorConnect encountered an issue</p>
                <p className="text-gray-600 mt-1">{errorMessage}</p>
              </div>
              <button
                onClick={() => setShowError(false)}
                className="text-gray-500 hover:text-gray-700 mt-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Selection Modal for Google Login */}
      {providerModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Select Your Role</h2>
              <button
                onClick={() => setProviderModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-center text-gray-600">
                Please select your role to continue with Google
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  className="h-32 flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 border border-green-200"
                  onClick={() => handleGoogleLogin('vendor')}
                  disabled={isLoading && googleRole === 'vendor'}
                >
                  {isLoading && googleRole === 'vendor' ? (
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  ) : (
                    <>
                      <div className="bg-green-100 p-3 rounded-full mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-500">Vendor</span>
                      <p className="text-sm text-gray-600 mt-1">Buy in Bulk</p>
                    </>
                  )}
                </Button>
                
                <Button 
                  className="h-32 flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 border border-blue-200"
                  onClick={() => handleGoogleLogin('wholesaler')}
                  disabled={isLoading && googleRole === 'wholesaler'}
                >
                  {isLoading && googleRole === 'wholesaler' ? (
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  ) : (
                    <>
                      <div className="bg-blue-100 p-3 rounded-full mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-500">Wholesaler</span>
                      <p className="text-sm text-gray-600 mt-1">Sell Products</p>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Reset Password</h2>
              <button
                onClick={closeForgotPassword}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!userType && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                  {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                </div>

                <Button
                  onClick={handleForgotPassword}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            )}

            {userType === 'google' && (
              <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Password Secured by Google</p>
                  <p className="text-sm text-muted-foreground">
                    Your account password is managed by Google. Please reset your password through Google.
                  </p>
                </div>
              </div>
            )}

            {userType === 'email' && !captchaVerified && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-medium">Verify you're human</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Solve this simple math problem to continue
                  </p>

                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-2xl font-bold bg-gray-100 px-6 py-4 rounded-lg">
                      What is {num1} + {num2}?
                    </div>

                    <Input
                      type="number"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      placeholder="Enter answer"
                      className="text-center w-32"
                    />

                    {captchaError && <p className="text-red-500 text-sm">{captchaError}</p>}

                    <Button
                      onClick={verifyCaptcha}
                      className="w-32"
                    >
                      Verify
                    </Button>

                    <button
                      onClick={generateCaptcha}
                      className="text-sm text-green-600 hover:underline"
                    >
                      Generate new problem
                    </button>
                  </div>
                </div>
              </div>
            )}

            {userType === 'email' && captchaVerified && !passwordResetSuccess && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-medium">Create New Password</p>
                  <p className="text-sm text-muted-foreground">
                    Enter a new password for your account
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                  />
                </div>

                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}

                <Button
                  onClick={handlePasswordReset}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Reset Password
                </Button>
              </div>
            )}

            {passwordResetSuccess && (
              <div className="text-center py-6">
                <div className="bg-green-100 text-green-600 p-3 rounded-full inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Password Reset Successful!</h3>
                <p className="text-muted-foreground">
                  Your password has been updated successfully.
                </p>
                <Button
                  onClick={closeForgotPassword}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700"
                >
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-lg p-4">
          <div className="text-center mb-8 animate-fade-down">
            <div className="flex items-center justify-center mb-8">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="font-bold text-2xl ml-2">
                <span className="text-green-600">Vendor</span>
                <span className="text-green-800">Connect</span>
              </span>
            </div>

            <h1 className="text-3xl font-bold mb-3">Welcome back</h1>
            <p className="text-gray-600">
              Sign in to continue your vendor journey
            </p>
          </div>

          <div className="animate-fade-up">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleEmailLogin)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Email</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <FormControl>
                            <Input
                              placeholder="name@example.com"
                              className="pl-10"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex justify-between">
                          <FormLabel>Password</FormLabel>
                          <button
                            type="button"
                            onClick={() => setForgotPasswordOpen(true)}
                            className="text-sm text-green-600 hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="pl-10"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Login as</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="vendor" id="login-vendor" className="text-green-600" />
                              <label htmlFor="login-vendor" className="text-sm">Vendor</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="wholesaler" id="login-wholesaler" className="text-green-600" />
                              <label htmlFor="login-wholesaler" className="text-sm">Wholesaler</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full group bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => setProviderModalOpen(true)}
                    disabled={isLoading}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                    Continue with Google
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-center mt-6 text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-green-600 font-medium hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;