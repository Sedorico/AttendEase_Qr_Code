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

    // Present = anyone who timed in today
    const present = todayAttendance.filter((r) => r.status !== 'absent').length;
    const overtime = todayAttendance.filter((r) => r.status === 'overtime').length;
    const undertime = todayAttendance.filter((r) => r.status === 'undertime').length;
    const complete = todayAttendance.filter((r) => r.status === 'complete').length;

    // Absent = only count from actual absent records (created by cron at 5PM)
    // NOT computed as totalEmployees - present
    const absent = todayAttendance.filter((r) => r.status === 'absent').length;

    // Check if past 5PM PHT (9:00 UTC)
    const nowUTC = new Date();
    const isPast5PM = nowUTC.getUTCHours() >= 9; // 9 UTC = 5PM PHT

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          totalEmployees,
          present,
          // Only show absent count after 5PM PHT
          absent: isPast5PM ? absent : 0,
          overtime,
          undertime,
          complete,
          late: 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}