import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { grantProAccess } from '@/lib/credits';

const razorpaySecret = process.env.RAZORPAY_KEY_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const data = JSON.parse(body);
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = data;

    const shasum = crypto.createHmac('sha256', razorpaySecret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest === razorpay_signature) {
      // Payment is legitimate, grant pro access
      await grantProAccess(userId);
      
      return NextResponse.json({ status: 'ok' });
    } else {
      return NextResponse.json({ status: 'error', message: 'Invalid signature' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
