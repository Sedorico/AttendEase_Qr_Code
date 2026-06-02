// FILE PATH: app/api/attendance/today/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const departmentScope = searchParams.get('department') === 'true';

    const employee = await Employee.findOne({ employeeId: auth.employeeId });
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ── Department scope (manager view) ──
    if (departmentScope && (employee.role === 'manager' || employee.role === 'admin')) {
      // Get all employees in this department
      const deptEmployees = await Employee.find({
        department: employee.department,
        isActive: true,
      }).select('_id name position department');

      const deptEmployeeIds = deptEmployees.map((e) => e._id);

      const records = await Attendance.find({
        employeeId: { $in: deptEmployeeIds },
        timeIn: { $gte: today, $lt: tomorrow },
      })
        .sort({ timeIn: -1 })
        .lean();

      // Attach employee info to each record
      const employeeMap = new Map(deptEmployees.map((e) => [e._id.toString(), e]));
      const enriched = records.map((r) => ({
        ...r,
        employee: employeeMap.get(r.employeeId.toString()) || null,
      }));

      return NextResponse.json({ success: true, data: enriched });
    }

    // ── Single employee view ──
    const shift = await Attendance.findOne({
      employeeId: employee._id,
      timeIn: { $gte: today, $lt: tomorrow },
    })
      .sort({ timeIn: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        shift: shift || null,
        hasTimeIn: !!shift,
        hasTimeOut: !!(shift as any)?.timeOut,
        timeIn: (shift as any)?.timeIn || null,
        timeOut: (shift as any)?.timeOut || null,
        status: (shift as any)?.status || null,
        workMinutes: (shift as any)?.workMinutes || null,
        overtimeRequested: (shift as any)?.overtimeRequested || false,
        overtimeApproved: (shift as any)?.overtimeApproved ?? null,
        autoSignedOut: (shift as any)?.autoSignedOut || false,
      },
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}