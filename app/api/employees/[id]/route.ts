import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';
import { ApiResponse, Employee as EmployeeType } from '@/types';

interface Params {
  params: Promise<{ id: string }>;
}

function mapEmployee(employee: any): Partial<EmployeeType> {
  return {
    _id: employee._id.toString(),
    employeeId: employee.employeeId,
    name: employee.name,
    email: employee.email,
    department: employee.department,
    position: employee.position,
    avatar: employee.avatar,
    role: employee.role,
    isActive: employee.isActive,
    address: employee.address,
    age: employee.age,
    scheduleTimeIn: employee.scheduleTimeIn,
    scheduleTimeOut: employee.scheduleTimeOut,
    profileCompleted: employee.profileCompleted,
    createdAt: employee.createdAt?.toISOString(),
    updatedAt: employee.updatedAt?.toISOString(),
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await connectDB();

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    if (auth.role !== 'admin' && auth.userId !== id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse<{ employee: Partial<EmployeeType> }>>(
      { success: true, data: { employee: mapEmployee(employee) } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (auth.role !== 'admin' && auth.userId !== id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const data = await request.json();

    if (auth.role !== 'admin') {
      delete data.role;
      delete data.isActive;
      delete data.employeeId;
      delete data.department;
    }

    if (data.password) {
      const emp = await Employee.findById(id);
      if (emp) {
        emp.password = data.password;
        await emp.save();
      }
      delete data.password;
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ employee: Partial<EmployeeType> }>>(
      {
        success: true,
        data: { employee: mapEmployee(employee) },
        message: 'Employee updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (auth.role !== 'admin' && auth.role !== 'manager') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();

    const data = await request.json();

    if (auth.role !== 'admin') {
      delete data.role;
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ employee: Partial<EmployeeType> }>>(
      {
        success: true,
        data: { employee: mapEmployee(employee) },
        message: 'Employee updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Patch employee error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (auth.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();

    const employee = await Employee.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!employee) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Employee deactivated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}