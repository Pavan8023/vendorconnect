// src/pages/api/create-razorpay-order.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { amount, currency = 'INR' } = req.body;
      
      const options = {
        amount,
        currency,
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1,
      };
      
      const order = await razorpay.orders.create(options);
      res.status(200).json(order);
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}