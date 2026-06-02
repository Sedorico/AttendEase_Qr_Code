import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { signToken, setAuthCookie, generateEmployeeId } from '@/lib/auth';
import { ApiResponse, Employee as EmployeeType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, password, department, position, role } = await request.json();

    // Validation
    if (!name || !email || !password || !department || !position) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email });

    if (existingEmployee) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Generate employee ID
    const employeeId = generateEmployeeId();

    // Create employee
    const employee = await Employee.create({
      employeeId,
      name,
      email,
      password,
      department,
      position,
      role: role || 'employee',
    });

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
        message: 'Registration successful',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
