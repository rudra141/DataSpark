'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';

const FREE_CREDITS = 3;

export async function getUserCredits() {
  const { userId } = auth();
  if (!userId) {
    return { credits: 0, hasPro: false };
  }

  const user = await clerkClient.users.getUser(userId);
  const credits = (user.privateMetadata.credits as number) ?? FREE_CREDITS;
  const hasPro = (user.privateMetadata.hasPro as boolean) ?? false;
  
  return { credits, hasPro };
}

export async function deductUserCredits(amount: number) {
  const { userId } = auth();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const user = await clerkClient.users.getUser(userId);
  const currentCredits = (user.privateMetadata.credits as number) ?? FREE_CREDITS;

  if (currentCredits < amount) {
    throw new Error('Insufficient credits');
  }

  const newCredits = currentCredits - amount;

  await clerkClient.users.updateUser(userId, {
    privateMetadata: {
      ...user.privateMetadata,
      credits: newCredits,
    },
  });

  return newCredits;
}

export async function addUserCredits(userId: string, amount: number) {
    if (!userId) {
        throw new Error('User ID is required');
    }

    const user = await clerkClient.users.getUser(userId);
    const currentCredits = (user.privateMetadata.credits as number) ?? 0;
    const newCredits = currentCredits + amount;

    await clerkClient.users.updateUser(userId, {
        privateMetadata: {
        ...user.privateMetadata,
        credits: newCredits,
        hasPro: true,
        },
    });

    return newCredits;
}

export async function grantProAccess(userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }
   const user = await clerkClient.users.getUser(userId);
   await clerkClient.users.updateUser(userId, {
    privateMetadata: {
      ...user.privateMetadata,
      hasPro: true,
    },
  });
}
