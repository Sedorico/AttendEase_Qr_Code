import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';

const REQUIRED_MINUTES = 540; // 9 hours
const BREAK_MINUTES = 60;     // auto-deducted

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const employee = await Employee.findOne({ employeeId: auth.employeeId });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const shift = await Attendance.findOne({
      employeeId: employee._id,
      timeIn: { $gte: today, $lt: tomorrow },
    }).sort({ timeIn: -1 }).lean() as any;

    // No shift today
    if (!shift) {
      return NextResponse.json({
        success: true,
        data: {
          hasShift: false,
          hasTimeIn: false,
          hasTimeOut: false,
          status: null,
          workMinutes: 0,
          totalMinutes: 0,
          requiredMinutes: REQUIRED_MINUTES,
          progressPercent: 0,
          timeIn: null,
          timeOut: null,
          overtimeRequested: false,
          overtimeApproved: null,
          autoSignedOut: false,
          canRequestOvertime: false,
        },
      });
    }

    // Calculate live workMinutes if still in progress
    let workMinutes = shift.workMinutes || 0;
    let totalMinutes = shift.totalMinutes || 0;

    if (shift.status === 'in_progress' && shift.timeIn && !shift.timeOut) {
      totalMinutes = Math.floor((Date.now() - new Date(shift.timeIn).getTime()) / 60000);
      workMinutes = Math.max(0, totalMinutes - BREAK_MINUTES);
    }

    const progressPercent = Math.min(100, Math.round((workMinutes / REQUIRED_MINUTES) * 100));

    // Can request overtime if:
    // - workMinutes >= 540 (9 hours reached)
    // - no timeOut yet
    // - not already requested
    // - not auto signed out
    // - role is employee (managers auto-calculate)
    const canRequestOvertime =
      workMinutes >= REQUIRED_MINUTES &&
      !shift.timeOut &&
      !shift.overtimeRequested &&
      !shift.autoSignedOut &&
      employee.role === 'employee';

    return NextResponse.json({
      success: true,
      data: {
        hasShift: true,
        hasTimeIn: !!shift.timeIn,
        hasTimeOut: !!shift.timeOut,
        status: shift.status,
        workMinutes,
        totalMinutes,
        requiredMinutes: REQUIRED_MINUTES,
        progressPercent,
        timeIn: shift.timeIn || null,
        timeOut: shift.timeOut || null,
        overtimeRequested: shift.overtimeRequested || false,
        overtimeApproved: shift.overtimeApproved ?? null,
        autoSignedOut: shift.autoSignedOut || false,
        canRequestOvertime,
        shiftId: shift._id.toString(),
      },
    });
  } catch (error) {
    console.error('Get shift error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}