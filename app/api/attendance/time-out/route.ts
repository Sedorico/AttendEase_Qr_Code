// FILE PATH: app/api/attendance/time-out/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import Notification from '@/lib/models/Notification';
import { getAuthFromCookies } from '@/lib/auth';

const REQUIRED_MINUTES = 9 * 60; // 540 minutes
const TOLERANCE_MINUTES = 5;

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getAuthFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = session.employeeId;

    // Get today's shift
    const attendance = await (Attendance as any).getTodayShift(employeeId);

    if (!attendance) {
      return NextResponse.json({ success: false, error: 'No active shift found for today' }, { status: 404 });
    }

    // Already timed out
    if (attendance.timeOut) {
      return NextResponse.json({ success: false, error: 'Already timed out for today' }, { status: 400 });
    }

    // Already auto-signed out — ignore redundant scan
    if (attendance.autoSignedOut) {
      return NextResponse.json({
        success: true,
        message: 'Already signed out automatically. Have a good day!',
        data: { status: attendance.status },
      });
    }

    const timeOut = new Date();
    const totalMinutes = Math.floor((timeOut.getTime() - attendance.timeIn.getTime()) / (1000 * 60));
    const workMinutes = totalMinutes - 60; // auto-deduct 1 hour break

    // Get employee role
    const employee = await Employee.findById(employeeId).select('role department');
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const isManager = employee.role === 'manager' || employee.role === 'admin';

    // Block time out if employee exceeded 9h without overtime approval
    if (!isManager && workMinutes > REQUIRED_MINUTES + TOLERANCE_MINUTES) {
      if (!attendance.overtimeRequested) {
        return NextResponse.json({
          success: false,
          error: 'You have exceeded 9 hours. Please request overtime approval before timing out.',
          requiresOvertimeRequest: true,
        }, { status: 403 });
      }

      // Requested but still pending
      if (attendance.overtimeApproved === null || attendance.overtimeApproved === undefined) {
        return NextResponse.json({
          success: false,
          error: 'Your overtime request is pending manager approval.',
          pendingApproval: true,
        }, { status: 403 });
      }
    }

    // Calculate status
    let status: string;
    if (isManager) {
      // Managers: automatic calc, no approval needed
      status = (Attendance as any).calculateStatus(workMinutes);
    } else {
      if (workMinutes >= REQUIRED_MINUTES + TOLERANCE_MINUTES && attendance.overtimeApproved) {
        status = 'overtime';
      } else if (workMinutes >= REQUIRED_MINUTES - TOLERANCE_MINUTES) {
        status = 'complete';
      } else {
        status = 'undertime';
      }
    }

    // Save
    attendance.timeOut = timeOut;
    attendance.totalMinutes = totalMinutes;
    attendance.workMinutes = workMinutes;
    attendance.status = status;
    await attendance.save();

    // Delete undelivered scheduled shift notifications
    await Notification.deleteMany({
      recipientId: employeeId,
      attendanceId: attendance._id,
      read: false,
      type: { $in: ['SHIFT_30MIN', 'SHIFT_10MIN', 'SHIFT_COMPLETE'] },
    });

    return NextResponse.json({
      success: true,
      message: 'Time out recorded successfully',
      data: {
        timeIn: attendance.timeIn,
        timeOut: attendance.timeOut,
        totalMinutes,
        workMinutes,
        status,
      },
    });
  } catch (error) {
    console.error('Time out error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}