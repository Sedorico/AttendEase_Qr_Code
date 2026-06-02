import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';
import { ApiResponse, AttendanceChartData } from '@/types';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import { WORK_START_HOUR, WORK_START_MINUTE, LATE_THRESHOLD_MINUTES } from '@/lib/constants';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    const totalEmployees = await Employee.countDocuments({ isActive: true });
    const lateTime = WORK_START_HOUR * 60 + WORK_START_MINUTE + LATE_THRESHOLD_MINUTES;

    const chartData: AttendanceChartData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const timeIns = await Attendance.find({
        type: 'TIME_IN',
        timestamp: { $gte: dayStart, $lte: dayEnd },
      });

      let present = 0;
      let late = 0;

      timeIns.forEach(record => {
        const recordTime = new Date(record.timestamp);
        const actualTime = recordTime.getHours() * 60 + recordTime.getMinutes();
        
        if (actualTime > lateTime) {
          late++;
        } else {
          present++;
        }
      });

      const absent = Math.max(0, totalEmployees - present - late);

      chartData.push({
        date: format(day, 'MMM d'),
        present,
        late,
        absent,
      });
    }

    return NextResponse.json<ApiResponse<{ chartData: AttendanceChartData[] }>>(
      {
        success: true,
        data: { chartData },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard chart error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
