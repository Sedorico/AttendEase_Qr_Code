import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';
import { ApiResponse } from '@/types';

export async function GET() {
  try {
    const auth = await getAuthFromCookies();

    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (auth.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalEmployees = await Employee.countDocuments({ isActive: true });

    const todayAttendance = await Attendance.find({
      timeIn: { $gte: today, $lt: tomorrow },
    }).lean();

    const present = todayAttendance.filter((r) =>
      ['in_progress', 'complete', 'overtime'].includes(r.status)
    ).length;

    const late = 0; // No late tracking per business rules

    const absent = Math.max(0, totalEmployees - todayAttendance.length);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          totalEmployees,
          present,
          late,
          absent,
          onLeave: 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}