// FILE PATH: app/api/attendance/today/shift/route.ts

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await getAuthFromCookies();

    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const employee = await Employee.findOne({
      employeeId: auth.employeeId,
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      timeIn: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .sort({ timeIn: -1 })
      .lean();

    if (!attendance) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    let workMinutes = attendance.workMinutes ?? 0;

    if (
      attendance.status === 'in_progress' &&
      !attendance.timeOut
    ) {
      const totalMinutes = Math.floor(
        (Date.now() - new Date(attendance.timeIn).getTime()) /
          (1000 * 60)
      );

      workMinutes = Math.max(0, totalMinutes - 60);
    }

    return NextResponse.json({
      success: true,
      data: {
        status: attendance.status,
        timeIn: attendance.timeIn,
        timeOut: attendance.timeOut,

        workMinutes,
        totalMinutes: attendance.totalMinutes ?? 0,

        overtimeRequested:
          attendance.overtimeRequested ?? false,

        overtimeRequestedAt:
          attendance.overtimeRequestedAt ?? null,

        overtimeApproved:
          attendance.overtimeApproved ?? null,

        undertimeRequested:
          attendance.undertimeRequested ?? false,

        undertimeRequestedAt:
          attendance.undertimeRequestedAt ?? null,

        undertimeApproved:
          attendance.undertimeApproved ?? null,

        autoSignedOut:
          attendance.autoSignedOut ?? false,
      },
    });
  } catch (error) {
    console.error('Get shift error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}