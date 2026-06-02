// FILE PATH: app/api/attendance/overtime-request/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee, { IEmployee } from '@/lib/models/Employee';
import Notification from '@/lib/models/Notification';
import { getAuthFromCookies } from '@/lib/auth';

const REQUIRED_MINUTES = 9 * 60;

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getAuthFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = session.employeeId;

    // Get today's active shift
    const attendance = await (Attendance as any).getActiveShift(employeeId);

    if (!attendance) {
      return NextResponse.json({ success: false, error: 'No active shift found' }, { status: 404 });
    }

    // Check 9 hours reached
    const minutesWorked = Math.floor((Date.now() - attendance.timeIn.getTime()) / (1000 * 60)) - 60;
    if (minutesWorked < REQUIRED_MINUTES) {
      return NextResponse.json({
        success: false,
        error: `You have not yet completed 9 hours. Current: ${Math.floor(minutesWorked / 60)}h ${minutesWorked % 60}m`,
      }, { status: 400 });
    }

    // Already requested
    if (attendance.overtimeRequested) {
      return NextResponse.json({ success: false, error: 'Overtime already requested' }, { status: 400 });
    }

    // Get employee info
    const employee = await Employee.findById(employeeId).select('name department role');
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Find managers in same department
    const managers = await Employee.find({
      department: employee.department,
      role: 'manager',
      isActive: true,
    }).select('_id name');

    if (managers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No manager found in your department. Please contact HR.',
      }, { status: 404 });
    }

    // Mark overtime requested
    attendance.overtimeRequested = true;
    attendance.overtimeRequestedAt = new Date();
    await attendance.save();

    // Notify all department managers
    const notifications = managers.map((manager: IEmployee) => ({
      recipientId: manager._id,
      senderId: employeeId,
      type: 'OVERTIME_REQUEST' as const,
      title: 'Overtime Request',
      message: `${employee.name} from ${employee.department} is requesting overtime approval.`,
      attendanceId: attendance._id,
      actionRequired: true,
      actionTaken: false,
      read: false,
    }));

    await Notification.insertMany(notifications);

    return NextResponse.json({
      success: true,
      message: 'Overtime request sent to your manager(s). Please wait for approval.',
    });
  } catch (error) {
    console.error('Overtime request error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}