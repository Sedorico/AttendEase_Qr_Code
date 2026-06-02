import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import { getAuthFromCookies } from '@/lib/auth';
import { ApiResponse } from '@/types';

// Get attendance records
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();

    if (!auth) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeId = searchParams.get('employeeId');
    const department = searchParams.get('department');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    interface QueryType {
      timestamp?: { $gte?: Date; $lte?: Date };
      employeeId?: unknown;
      type?: string;
    }

    const query: QueryType = {};

    // Date filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    // Non-admin can only see their own records
    if (auth.role !== 'admin') {
      const employee = await Employee.findOne({ employeeId: auth.employeeId });
      if (employee) {
        query.employeeId = employee._id;
      }
    } else {
      // Admin can filter by employee
      if (employeeId) {
        const employee = await Employee.findOne({ employeeId });
        if (employee) {
          query.employeeId = employee._id;
        }
      }

      // Filter by department
      if (department) {
        const employeesInDept = await Employee.find({ department }).select('_id');
        query.employeeId = { $in: employeesInDept.map(e => e._id) };
      }
    }

    if (type) {
      query.type = type;
    }

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate('employeeId', 'name employeeId department position avatar')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          records: records.map(record => ({
            _id: record._id.toString(),
            employee: record.employeeId,
            type: record.type,
            timestamp: record.timestamp.toISOString(),
            deviceInfo: record.deviceInfo,
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
    console.error('Get attendance error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
