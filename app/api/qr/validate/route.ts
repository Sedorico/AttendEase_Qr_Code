import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { parseQRToken, validateQRToken, checkAndMarkTokenUsed } from '@/lib/qr';
import Employee from '@/lib/models/Employee';
import Attendance, { AttendanceStatus } from '@/lib/models/Attendance';
import Notification from '@/lib/models/Notification';
import QRSession from '@/lib/models/QRSession';
import { ApiResponse } from '@/types';

const REQUIRED_WORK_MINUTES = 540; // 9 hours
const BREAK_MINUTES = 60;
const COMPLETE_TOLERANCE = 5;

export async function POST(request: NextRequest) {
  try {
    const { qrData, deviceInfo } = await request.json();

    if (!qrData) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'QR data is required' },
        { status: 400 }
      );
    }

    // Parse QR token
    const tokenData = parseQRToken(qrData);

    if (!tokenData) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid QR code format' },
        { status: 400 }
      );
    }

    // Validate token
    const validation = validateQRToken(tokenData);

    if (!validation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Check for replay attack
    if (!checkAndMarkTokenUsed(tokenData)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'QR code has already been used' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find employee
    const employee = await Employee.findOne({
      employeeId: tokenData.employeeId,
      isActive: true,
    });

    if (!employee) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Employee not found or inactive' },
        { status: 404 }
      );
    }

    // Invalidate the QR session
    await QRSession.updateOne(
      { token: tokenData.nonce },
      { used: true, usedAt: new Date() }
    );

    const now = new Date();

    // Check for active shift (in_progress)
    const activeShift = await Attendance.findOne({
      employeeId: employee._id,
      status: 'in_progress',
    });

    // Check for today's completed/auto_signed_out shift
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayShift = await Attendance.findOne({
      employeeId: employee._id,
      timeIn: { $gte: today, $lt: tomorrow },
    });

    // ── TIME IN ──────────────────────────────────────────────
    if (!activeShift) {
      // If already has a completed shift today, block
      if (todayShift && todayShift.status !== 'in_progress') {
        // If auto_signed_out, silently accept redundant scan
        if (todayShift.autoSignedOut) {
          return NextResponse.json<ApiResponse>(
            {
              success: true,
              data: {
                employee: {
                  _id: employee._id.toString(),
                  name: employee.name,
                  employeeId: employee.employeeId,
                  department: employee.department,
                  position: employee.position,
                },
                type: 'TIME_OUT',
                timestamp: now.toISOString(),
                message: 'Already signed out',
              },
              message: 'Already signed out',
            },
            { status: 200 }
          );
        }

        return NextResponse.json<ApiResponse>(
          { success: false, error: 'You have already completed your attendance for today' },
          { status: 400 }
        );
      }

      // Create new shift (TIME IN)
      const attendance = await Attendance.create({
        employeeId: employee._id,
        timeIn: now,
        status: 'in_progress',
        deviceInfo: deviceInfo || 'Scanner Kiosk',
        qrTokenUsed: tokenData.nonce,
      });

      // Schedule shift notifications
      const shift30min = new Date(now.getTime() + (8.5 * 60 * 60 * 1000));
      const shift10min = new Date(now.getTime() + (8.833 * 60 * 60 * 1000));
      const shiftComplete = new Date(now.getTime() + (9 * 60 * 60 * 1000));

      await Notification.insertMany([
        {
          recipientId: employee._id,
          type: 'SHIFT_30MIN',
          title: 'Almost done!',
          message: "You're almost done! 30 minutes left.",
          attendanceId: attendance._id,
          read: false,
          createdAt: shift30min,
        },
        {
          recipientId: employee._id,
          type: 'SHIFT_10MIN',
          title: '10 minutes left!',
          message: '10 minutes left to complete your shift!',
          attendanceId: attendance._id,
          read: false,
          createdAt: shift10min,
        },
        {
          recipientId: employee._id,
          type: 'SHIFT_COMPLETE',
          title: 'Shift complete!',
          message: "You've completed your 9 hours! Don't forget to Time Out.",
          attendanceId: attendance._id,
          read: false,
          createdAt: shiftComplete,
        },
      ]);

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: {
            attendance,
            employee: {
              _id: employee._id.toString(),
              name: employee.name,
              employeeId: employee.employeeId,
              department: employee.department,
              position: employee.position,
            },
            type: 'TIME_IN',
            timestamp: now.toISOString(),
          },
          message: 'Time In recorded successfully',
        },
        { status: 200 }
      );
    }

    // ── TIME OUT ─────────────────────────────────────────────
    // If auto_signed_out, ignore redundant scan
    if (activeShift.autoSignedOut) {
      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: {
            employee: {
              _id: employee._id.toString(),
              name: employee.name,
              employeeId: employee.employeeId,
              department: employee.department,
              position: employee.position,
            },
            type: 'TIME_OUT',
            timestamp: now.toISOString(),
            message: 'Already auto signed out',
          },
          message: 'Already signed out',
        },
        { status: 200 }
      );
    }

    // Calculate hours
    const totalMinutes = Math.floor((now.getTime() - new Date(activeShift.timeIn).getTime()) / 60000);
    const workMinutes = Math.max(0, totalMinutes - BREAK_MINUTES);
    const isManagerOrAdmin = employee.role === 'manager' || employee.role === 'admin';

    // Block time-out if >9h without overtime approval (except managers/admins)
    if (workMinutes > REQUIRED_WORK_MINUTES && !isManagerOrAdmin && !activeShift.overtimeApproved) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'You need overtime approval before timing out. Please request overtime.',
        },
        { status: 403 }
      );
    }

    // Determine status
    let status: AttendanceStatus;
    if (workMinutes > REQUIRED_WORK_MINUTES) {
      status = 'overtime';
    } else if (workMinutes >= REQUIRED_WORK_MINUTES - COMPLETE_TOLERANCE) {
      status = 'complete';
    } else {
      status = 'undertime';
    }

    // Update attendance record
    activeShift.timeOut = now;
    activeShift.totalMinutes = totalMinutes;
    activeShift.workMinutes = workMinutes;
    activeShift.status = status;
    await activeShift.save();

    // Clean up undelivered future notifications
    await Notification.deleteMany({
      attendanceId: activeShift._id,
      read: false,
      createdAt: { $gt: now },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          attendance: activeShift,
          employee: {
            _id: employee._id.toString(),
            name: employee.name,
            employeeId: employee.employeeId,
            department: employee.department,
            position: employee.position,
          },
          type: 'TIME_OUT',
          timestamp: now.toISOString(),
          totalMinutes,
          workMinutes,
          status,
        },
        message: `Time Out recorded — ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('QR validation error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to process QR code' },
      { status: 500 }
    );
  }
}