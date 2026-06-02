// FILE PATH: app/api/attendance/undertime-request/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee, { IEmployee } from '@/lib/models/Employee';
import Notification from '@/lib/models/Notification';
import { getAuthFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getAuthFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = session.employeeId;
    const body = await req.json().catch(() => ({}));
    const { reason } = body; // optional reason

    // Get today's active shift
    const attendance = await (Attendance as any).getActiveShift(employeeId);
    if (!attendance) {
      return NextResponse.json({ success: false, error: 'No active shift found' }, { status: 404 });
    }

    // Already requested undertime or overtime
    if (attendance.undertimeRequested) {
      return NextResponse.json({ success: false, error: 'Undertime already requested' }, { status: 400 });
    }
    if (attendance.overtimeRequested) {
      return NextResponse.json({ success: false, error: 'You already have an overtime request pending' }, { status: 400 });
    }

    const workMinutes = Math.floor((Date.now() - attendance.timeIn.getTime()) / (1000 * 60)) - 60;

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

    const hoursWorked = Math.floor(workMinutes / 60);
    const minsWorked = workMinutes % 60;

    // Mark undertime requested
    attendance.undertimeRequested = true;
    attendance.undertimeRequestedAt = new Date();
    if (reason) attendance.undertimeReason = reason;
    await attendance.save();

    // Notify all department managers
    const notifications = managers.map((manager: IEmployee) => ({
      recipientId: manager._id,
      senderId: employeeId,
      type: 'UNDERTIME_REQUEST' as const,
      title: 'Undertime Request',
      message: `${employee.name} from ${employee.department} is requesting early time-out after ${hoursWorked}h ${minsWorked}m.${reason ? ` Reason: ${reason}` : ''}`,
      attendanceId: attendance._id,
      actionRequired: true,
      actionTaken: false,
      read: false,
    }));

    await Notification.insertMany(notifications);

    return NextResponse.json({
      success: true,
      message: 'Undertime request sent to your manager(s). Please wait for approval.',
    });
  } catch (error) {
    console.error('Undertime request error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}