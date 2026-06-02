// FILE PATH: app/api/dashboard/manager/stats/route.ts

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const manager = await Employee.findOne({ employeeId: auth.employeeId });
    if (!manager || (manager.role !== 'manager' && manager.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // All active employees in this department
    const deptEmployees = await Employee.find({
      department: manager.department,
      isActive: true,
      role: { $in: ['employee', 'manager'] },
    }).select('_id');

    const deptEmployeeIds = deptEmployees.map((e) => e._id);
    const totalEmployees = deptEmployeeIds.length;

    // Today's attendance records for this department
    const todayRecords = await Attendance.find({
      employeeId: { $in: deptEmployeeIds },
      timeIn: { $gte: today, $lt: tomorrow },
    }).lean();

    const presentIds = new Set(todayRecords.map((r) => r.employeeId.toString()));
    const present = presentIds.size;
    const absent = totalEmployees - present;

    // Complete / undertime / overtime counts
    const complete = todayRecords.filter((r) => r.status === 'complete').length;
    const undertime = todayRecords.filter((r) => r.status === 'undertime').length;
    const overtime = todayRecords.filter((r) => r.status === 'overtime').length;

    // Pending overtime requests (overtimeRequested=true, overtimeApproved=null, not auto signed out)
    const pendingOT = todayRecords.filter(
      (r) => r.overtimeRequested && r.overtimeApproved == null && !r.autoSignedOut
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        present,
        absent,
        complete,
        undertime,
        overtime,
        pendingOT,
        department: manager.department,
      },
    });
  } catch (error) {
    console.error('Manager stats error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}