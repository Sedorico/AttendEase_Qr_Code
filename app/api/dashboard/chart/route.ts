import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';
import { ApiResponse, AttendanceChartData } from '@/types';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

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

    const chartData: AttendanceChartData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const records = await Attendance.find({
        timeIn: { $gte: dayStart, $lte: dayEnd },
      }).lean();

      const present = records.filter((r) =>
        ['in_progress', 'complete', 'overtime'].includes(r.status)
      ).length;

      const undertime = records.filter((r) => r.status === 'undertime').length;
      const absent = Math.max(0, totalEmployees - records.length);

      chartData.push({
        date: format(day, 'MMM d'),
        present,
        late: undertime,
        absent,
      });
    }

    return NextResponse.json<ApiResponse<{ weekly: AttendanceChartData[] }>>(
      {
        success: true,
        data: { weekly: chartData },
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