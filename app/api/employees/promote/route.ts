import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const session = await getAuthFromCookies();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = await Employee.findById(session.userId).select('role');
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden — admin access only' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { employeeId, role } = body;

    if (!employeeId || !role) {
      return NextResponse.json(
        { success: false, error: 'employeeId and role are required' },
        { status: 400 }
      );
    }

    const validRoles = ['employee', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    if (employeeId === session.userId && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { role },
      { new: true }
    ).select('-password');

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${employee.name} has been updated to ${role}`,
      data: { employee },
    });
  } catch (error) {
    console.error('Promote employee error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}