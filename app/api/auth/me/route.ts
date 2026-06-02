import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';
import { ApiResponse, Employee as EmployeeType } from '@/types';

export async function GET() {
  try {
    const auth = await getAuthFromCookies();

    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const employee = await Employee.findById(auth.userId);

    if (!employee || !employee.isActive) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Employee not found or inactive' },
        { status: 404 }
      );
    }

    const employeeData: Partial<EmployeeType> = {
      _id: employee._id.toString(),
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      position: employee.position,
      avatar: employee.avatar,
      role: employee.role,
      isActive: employee.isActive,
    };

    return NextResponse.json<ApiResponse<{ employee: Partial<EmployeeType> }>>(
      {
        success: true,
        data: { employee: employeeData },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
