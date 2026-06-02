import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { ApiResponse } from '@/types';

export async function POST() {
  try {
    await clearAuthCookie();

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
