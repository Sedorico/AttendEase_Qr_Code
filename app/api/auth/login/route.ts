import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { signToken, setAuthCookie } from '@/lib/auth';
import { ApiResponse, Employee as EmployeeType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find employee with password
    const employee = await Employee.findOne({ email, isActive: true }).select('+password');

    if (!employee) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await employee.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({
      userId: employee._id.toString(),
      employeeId: employee.employeeId,
      role: employee.role,
      email: employee.email,
    });

    // Set auth cookie
    await setAuthCookie(token);

    // Return employee data without password
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

    return NextResponse.json<ApiResponse<{ employee: Partial<EmployeeType>; token: string }>>(
      {
        success: true,
        data: { employee: employeeData, token },
        message: 'Login successful',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
