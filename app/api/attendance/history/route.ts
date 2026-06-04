import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';
import { ApiResponse } from '@/types';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const HK_TZ = 'Asia/Hong_Kong';

type DisplayStatus = 'present' | 'undertime' | 'overtime' | 'absent' | 'in_progress';

interface HistoryRecord {
  date: string;
  timeIn?: string;
  timeOut?: string;
  duration?: string;
  status: DisplayStatus;
}

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
    const monthParam = searchParams.get('month');

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

    const records = await Attendance.find({
      employeeId: employee._id,
      timeIn: { $gte: startDate, $lte: endDate },
    }).sort({ timeIn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const today = new Date();

    const history: HistoryRecord[] = days
      .filter(day => day <= today)
      .map(day => {
        const record = records.find(r => isSameDay(new Date(r.timeIn), day));

        if (!record) {
          return {
            date: formatInTimeZone(day, HK_TZ, 'yyyy-MM-dd'),
            status: 'absent' as DisplayStatus,
          };
        }

        // Map DB status → display status
        let status: DisplayStatus;
        switch (record.status) {
          case 'complete':
            status = 'present';
            break;
          case 'overtime':
            status = 'overtime';
            break;
          case 'undertime':
            status = 'undertime';
            break;
          case 'in_progress':
            status = 'in_progress';
            break;
          case 'auto_signed_out':
            status = 'absent';
            break;
          default:
            status = 'present';
        }

        let duration: string | undefined;
        if (record.timeIn && record.timeOut) {
          const diffMs = new Date(record.timeOut).getTime() - new Date(record.timeIn).getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          duration = `${hours}h ${minutes}m`;
        }

        return {
          date: formatInTimeZone(new Date(record.timeIn), HK_TZ, 'yyyy-MM-dd'),
          timeIn: record.timeIn
            ? formatInTimeZone(new Date(record.timeIn), HK_TZ, 'h:mm a')
            : undefined,
          timeOut: record.timeOut
            ? formatInTimeZone(new Date(record.timeOut), HK_TZ, 'h:mm a')
            : undefined,
          duration,
          status,
        };
      })
      .reverse();

    const summary = {
      present:   history.filter(h => h.status === 'present').length,
      overtime:  history.filter(h => h.status === 'overtime').length,
      absent:    history.filter(h => h.status === 'absent').length,
      undertime: history.filter(h => h.status === 'undertime').length,
      totalDays: history.length,
    };

    return NextResponse.json<ApiResponse<{ history: HistoryRecord[]; summary: typeof summary }>>(
      { success: true, data: { history, summary } },
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