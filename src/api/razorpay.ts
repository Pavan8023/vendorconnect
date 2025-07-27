import axios from 'axios';

export const createRazorpayOrder = async (amount: number) => {
  try {
    const response = await axios.post('/api/create-razorpay-order', {
      amount: amount * 100, // Razorpay uses paise (multiply by 100)
      currency: 'INR',
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};