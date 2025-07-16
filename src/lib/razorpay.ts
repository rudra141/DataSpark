import Razorpay from 'razorpay';
import shortUUID from 'short-uuid';

export const razorpayInstance = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createRazorpayOrder(amount: number, userId: string) {
  const options = {
    amount: amount * 100, // amount in the smallest currency unit
    currency: 'INR',
    receipt: `receipt_order_${shortUUID.generate()}`,
    notes: {
      userId: userId,
    }
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    throw new Error('Could not create payment order.');
  }
}
