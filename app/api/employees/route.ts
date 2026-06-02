// FILE PATH: app/api/employees/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';
import { ApiResponse, Employee as EmployeeType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // ✅ Allow admin AND manager
    if (auth.role !== 'admin' && auth.role !== 'manager') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: Record<string, unknown> = {};

    // ✅ Manager can only see their own department
    if (auth.role === 'manager') {
      const managerEmployee = await Employee.findOne({ employeeId: auth.employeeId });
      if (!managerEmployee) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Manager not found' },
          { status: 404 }
        );
      }
      query.department = managerEmployee.department;
    } else if (department) {
      // Admin can filter by department
      query.department = department;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          employees: employees.map((emp) => ({
            _id: emp._id.toString(),
            employeeId: emp.employeeId,
            name: emp.name,
            email: emp.email,
            department: emp.department,
            position: emp.position,
            avatar: emp.avatar,
            role: emp.role,
            isActive: emp.isActive,
            createdAt: emp.createdAt.toISOString(),
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    await connectDB();

    const data = await request.json();

    if (!data.employeeId) {
      const count = await Employee.countDocuments();
      data.employeeId = `EMP${String(count + 1).padStart(5, '0')}`;
    }

    const employee = await Employee.create(data);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          employee: {
            _id: employee._id.toString(),
            employeeId: employee.employeeId,
            name: employee.name,
            email: employee.email,
            department: employee.department,
            position: employee.position,
            role: employee.role,
            isActive: employee.isActive,
          },
        },
        message: 'Employee created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
