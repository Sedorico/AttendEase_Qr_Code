import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';
import { ApiResponse, DashboardStats } from '@/types';
import { WORK_START_HOUR, WORK_START_MINUTE, LATE_THRESHOLD_MINUTES } from '@/lib/constants';

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

    // Get total active employees
    const totalEmployees = await Employee.countDocuments({ isActive: true });

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's TIME_IN records
    const todayTimeIns = await Attendance.find({
      type: 'TIME_IN',
      timestamp: { $gte: today, $lt: tomorrow },
    }).populate('employeeId');

    // Calculate present and late
    const lateTime = WORK_START_HOUR * 60 + WORK_START_MINUTE + LATE_THRESHOLD_MINUTES;
    
    let presentToday = 0;
    let lateToday = 0;

    todayTimeIns.forEach(record => {
      const recordTime = new Date(record.timestamp);
      const actualTime = recordTime.getHours() * 60 + recordTime.getMinutes();
      
      if (actualTime > lateTime) {
        lateToday++;
      } else {
        presentToday++;
      }
    });

    const absentToday = totalEmployees - (presentToday + lateToday);

    const stats: DashboardStats = {
      totalEmployees,
      presentToday,
      lateToday,
      absentToday: Math.max(0, absentToday),
      onLeave: 0, // Can be extended for leave management
    };

    return NextResponse.json<ApiResponse<{ stats: DashboardStats }>>(
      {
        success: true,
        data: { stats },
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
