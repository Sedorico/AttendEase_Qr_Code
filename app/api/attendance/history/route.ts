import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';
import { ApiResponse, AttendanceRecord } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
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

    await connectDB();

    const employee = await Employee.findOne({ employeeId: auth.employeeId });
    
    if (!employee) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month'); // Format: YYYY-MM
    
    let startDate: Date;
    let endDate: Date;
    
    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number);
      startDate = startOfMonth(new Date(year, month - 1));
      endDate = endOfMonth(new Date(year, month - 1));
    } else {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    }

    // Get all attendance records for the month
    const records = await Attendance.find({
      employeeId: employee._id,
      timestamp: { $gte: startDate, $lte: endDate },
    }).sort({ timestamp: 1 });

    // Group by day
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const today = new Date();
    
    const history: AttendanceRecord[] = days
      .filter(day => day <= today) // Only include past days and today
      .map(day => {
        const dayRecords = records.filter(r => isSameDay(new Date(r.timestamp), day));
        const timeInRecord = dayRecords.find(r => r.type === 'TIME_IN');
        const timeOutRecord = dayRecords.find(r => r.type === 'TIME_OUT');

        let status: AttendanceRecord['status'] = 'absent';
        
        if (timeInRecord) {
          const timeInDate = new Date(timeInRecord.timestamp);
          const lateTime = WORK_START_HOUR * 60 + WORK_START_MINUTE + LATE_THRESHOLD_MINUTES;
          const actualTime = timeInDate.getHours() * 60 + timeInDate.getMinutes();
          
          if (actualTime > lateTime) {
            status = 'late';
          } else {
            status = 'present';
          }

          if (timeInRecord && !timeOutRecord && !isSameDay(day, today)) {
            status = 'half-day';
          }
        }

        // Calculate duration if both in and out exist
        let duration: string | undefined;
        if (timeInRecord && timeOutRecord) {
          const diffMs = new Date(timeOutRecord.timestamp).getTime() - new Date(timeInRecord.timestamp).getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          duration = `${hours}h ${minutes}m`;
        }

        return {
          date: format(day, 'yyyy-MM-dd'),
          timeIn: timeInRecord ? format(new Date(timeInRecord.timestamp), 'h:mm a') : undefined,
          timeOut: timeOutRecord ? format(new Date(timeOutRecord.timestamp), 'h:mm a') : undefined,
          duration,
          status,
        };
      })
      .reverse(); // Most recent first

    // Calculate summary
    const summary = {
      present: history.filter(h => h.status === 'present').length,
      late: history.filter(h => h.status === 'late').length,
      absent: history.filter(h => h.status === 'absent').length,
      halfDay: history.filter(h => h.status === 'half-day').length,
      totalDays: history.length,
    };

    return NextResponse.json<ApiResponse<{
      history: AttendanceRecord[];
      summary: typeof summary;
    }>>(
      {
        success: true,
        data: {
          history,
          summary,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get attendance history error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
