// FILE PATH: app/api/dashboard/stats/route.ts

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
      return NextResponse.json<ApiResponse>({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    if (auth.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Access denied' }, { status: 403 });
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

    // Once timed in = present
    const present = todayAttendance.length;
    const absent = Math.max(0, totalEmployees - present);
    const overtime = todayAttendance.filter((r) => r.status === 'overtime').length;
    const undertime = todayAttendance.filter((r) => r.status === 'undertime').length;
    const complete = todayAttendance.filter((r) => r.status === 'complete').length;

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          totalEmployees,
          present,
          absent,
          overtime,
          undertime,
          complete,
          late: 0, // kept for backwards compat, always 0
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}