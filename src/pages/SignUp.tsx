// src/pages/SignUp.tsx
import { useState } from 'react';
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
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/components/ui/use-toast';
import { emailSignUp } from '@/services/auth';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Password must contain uppercase, lowercase, and numbers.",
  }),
  role: z.enum(["vendor", "wholesaler"], {
    required_error: "Please select a role.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const SignUp = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "vendor",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await emailSignUp(values.email, values.password, values.name, values.role);
      
      toast({
        title: "Account created!",
        description: "You've successfully created your account.",
        className: "bg-green-100 border-green-200 text-green-800"
      });

      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "An error occurred during signup",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-white">
      <Header searchQuery={''} onSearchChange={() => {}} cartItems={0} />
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-lg p-4">
          <div className="text-center mb-8 animate-fade-down">
            <h1 className="text-3xl font-bold mb-3">Create your account</h1>
            <p className="text-gray-600">
              Join thousands of vendors and wholesalers in our marketplace
            </p>
          </div>

          <div className="animate-fade-up">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Full Name</FormLabel>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <FormControl>
                            <Input
                              placeholder="John Doe"
                              className="pl-10"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Create a strong password"
                              className="pl-10"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Must be 8+ chars with uppercase, lowercase, and numbers
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>I want to join as a</FormLabel>
                        <div className="flex flex-col space-y-1">
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 gap-2"
                            >
                              <div className="flex items-center space-x-2 border rounded-md p-3 hover:border-green-500 cursor-pointer">
                                <RadioGroupItem 
                                  value="vendor" 
                                  id="vendor" 
                                  className="text-green-600"
                                />
                                <label htmlFor="vendor" className="font-medium text-sm cursor-pointer">
                                  <span className="block font-medium">Vendor</span>
                                  <span className="text-xs text-gray-500">Sell products directly to customers</span>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2 border rounded-md p-3 hover:border-green-500 cursor-pointer">
                                <RadioGroupItem 
                                  value="wholesaler" 
                                  id="wholesaler" 
                                  className="text-green-600"
                                />
                                <label htmlFor="wholesaler" className="font-medium text-sm cursor-pointer">
                                  <span className="block font-medium">Wholesaler</span>
                                  <span className="text-xs text-gray-500">Buy products in bulk for resale</span>
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                        </div>
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
                      <span>Creating account...</span>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By signing up, you agree to our{' '}
                    <Link to="/terms" className="text-green-600 hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link>
                  </p>
                </form>
              </Form>
            </div>

            <p className="text-center mt-6 text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignUp;