// FILE PATH: app/api/attendance/overtime-approve/route.ts

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

    // Verify employee is in manager's department (admin can approve any)
    if (manager.role === 'manager') {
      const employee = await Employee.findById(attendance.employeeId).select('department');
      if (!employee || employee.department !== manager.department) {
        return NextResponse.json({
          success: false,
          error: 'This employee is not in your department',
        }, { status: 403 });
      }
    }

    if (!attendance.overtimeRequested) {
      return NextResponse.json({
        success: false,
        error: 'No overtime request found for this record',
      }, { status: 400 });
    }

    // Mark all related manager notifications as action taken
    await Notification.updateMany(
      {
        attendanceId,
        type: 'OVERTIME_REQUEST',
        actionRequired: true,
        actionTaken: false,
      },
      { actionTaken: true, read: true }
    );

    if (approved) {
      // ── APPROVE ──
      attendance.overtimeApproved = true;
      attendance.overtimeApprovedBy = manager._id as typeof attendance.overtimeApprovedBy;
      attendance.overtimeApprovedAt = new Date();
      await attendance.save();

      await Notification.create({
        recipientId: attendance.employeeId,
        senderId: managerId,
        type: 'OVERTIME_APPROVED',
        title: 'Overtime Approved ✅',
        message: `Your overtime request has been approved by ${manager.name}. Keep going!`,
        attendanceId: attendance._id,
        actionRequired: false,
        read: false,
      });

      return NextResponse.json({ success: true, message: 'Overtime approved' });

    } else {
      // ── REJECT — auto sign out ──
      const timeOut = new Date();
      const totalMinutes = Math.floor((timeOut.getTime() - attendance.timeIn.getTime()) / (1000 * 60));
      const workMinutes = totalMinutes - 60;

      attendance.timeOut = timeOut;
      attendance.totalMinutes = totalMinutes;
      attendance.workMinutes = workMinutes;
      attendance.status = 'auto_signed_out';
      attendance.overtimeApproved = false;
      attendance.overtimeApprovedBy = manager._id as typeof attendance.overtimeApprovedBy;
      attendance.overtimeApprovedAt = new Date();
      attendance.autoSignedOut = true;
      await attendance.save();

      // Notify employee of rejection + auto sign out
      await Notification.create({
        recipientId: attendance.employeeId,
        senderId: managerId,
        type: 'OVERTIME_REJECTED',
        title: 'Overtime Rejected',
        message: `Your overtime request was rejected by ${manager.name}. You have been automatically signed out.`,
        attendanceId: attendance._id,
        actionRequired: false,
        read: false,
      });

      // Also create AUTO_SIGNED_OUT notification
      await Notification.create({
        recipientId: attendance.employeeId,
        type: 'AUTO_SIGNED_OUT',
        title: 'Automatically Signed Out',
        message: `You have been automatically signed out at ${timeOut.toLocaleTimeString()}.`,
        attendanceId: attendance._id,
        actionRequired: false,
        read: false,
      });

      return NextResponse.json({
        success: true,
        message: 'Overtime rejected. Employee has been auto signed out.',
      });
    }
  } catch (error) {
    console.error('Overtime approve error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}