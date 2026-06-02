// FILE PATH: app/api/attendance/undertime-approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import Notification from '@/lib/models/Notification';
import { getAuthFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getAuthFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const managerId = session.employeeId;
    const body = await req.json();
    const { attendanceId, approved } = body;

    if (!attendanceId || approved === undefined) {
      return NextResponse.json({
        success: false,
        error: 'attendanceId and approved (boolean) are required',
      }, { status: 400 });
    }

    // Verify manager/admin role
    const manager = await Employee.findById(managerId).select('role department name');
    if (!manager || (manager.role !== 'manager' && manager.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized — managers only' }, { status: 403 });
    }

    // Get attendance record
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return NextResponse.json({ success: false, error: 'Attendance record not found' }, { status: 404 });
    }

    // Verify dept scope for manager
    if (manager.role === 'manager') {
      const employee = await Employee.findById(attendance.employeeId).select('department');
      if (!employee || employee.department !== manager.department) {
        return NextResponse.json({ success: false, error: 'This employee is not in your department' }, { status: 403 });
      }
    }

    if (!attendance.undertimeRequested) {
      return NextResponse.json({ success: false, error: 'No undertime request found for this record' }, { status: 400 });
    }

    // Mark manager notifications as actioned
    await Notification.updateMany(
      { attendanceId, type: 'UNDERTIME_REQUEST', actionRequired: true, actionTaken: false },
      { actionTaken: true, read: true }
    );

    if (approved) {
      // APPROVE — sign out the employee now
      const timeOut = new Date();
      const totalMinutes = Math.floor((timeOut.getTime() - attendance.timeIn.getTime()) / (1000 * 60));
      const workMinutes = totalMinutes - 60;

      attendance.timeOut = timeOut;
      attendance.totalMinutes = totalMinutes;
      attendance.workMinutes = workMinutes;
      attendance.status = 'undertime';
      attendance.undertimeApproved = true;
      attendance.undertimeApprovedBy = manager._id as typeof attendance.undertimeApprovedBy;
      attendance.undertimeApprovedAt = new Date();
      await attendance.save();

      await Notification.create({
        recipientId: attendance.employeeId,
        senderId: managerId,
        type: 'UNDERTIME_APPROVED',
        title: 'Undertime Approved ✅',
        message: `Your undertime request has been approved by ${manager.name}. You may now leave.`,
        attendanceId: attendance._id,
        actionRequired: false,
        read: false,
      });

      return NextResponse.json({ success: true, message: 'Undertime approved. Employee has been signed out.' });

    } else {
      // REJECT — employee stays, must complete shift
      attendance.undertimeRequested = false;
      attendance.undertimeRequestedAt = undefined;
      attendance.undertimeReason = undefined;
      await attendance.save();

      await Notification.create({
        recipientId: attendance.employeeId,
        senderId: managerId,
        type: 'UNDERTIME_REJECTED',
        title: 'Undertime Rejected',
        message: `Your undertime request was rejected by ${manager.name}. Please complete your shift.`,
        attendanceId: attendance._id,
        actionRequired: false,
        read: false,
      });

      return NextResponse.json({ success: true, message: 'Undertime rejected. Employee must complete their shift.' });
    }
  } catch (error) {
    console.error('Undertime approve error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}