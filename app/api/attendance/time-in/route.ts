// FILE PATH: app/api/attendance/time-in/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Notification from '@/lib/models/Notification';
import { getAuthFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getAuthFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = session.employeeId;

    // Check if already timed in today
    const todayShift = await (Attendance as any).getTodayShift(employeeId);

    if (todayShift) {
      if (todayShift.autoSignedOut) {
        return NextResponse.json({
          success: false,
          error: 'You have already been signed out for today.',
        }, { status: 400 });
      }
      return NextResponse.json({
        success: false,
        error: 'You are already timed in for today.',
      }, { status: 400 });
    }

    // Require qrTokenUsed — passed from QR scan validate route
    const body = await req.json().catch(() => ({}));
    const qrTokenUsed = body.qrTokenUsed || 'MANUAL';

    // Create attendance record
    const attendance = await Attendance.create({
      employeeId,
      timeIn: new Date(),
      status: 'in_progress',
      qrTokenUsed,
      overtimeRequested: false,
      autoSignedOut: false,
    });

    const timeInMs = attendance.timeIn.getTime();

    // Schedule shift notifications (stored in DB, delivered by polling)
    await Notification.insertMany([
      {
        recipientId: employeeId,
        type: 'SHIFT_30MIN',
        title: 'Almost done!',
        message: "You're almost done! 30 minutes left to complete your shift.",
        attendanceId: attendance._id,
        actionRequired: false,
        actionTaken: false,
        read: false,
        // Store scheduled delivery time in createdAt — 
        // NotifToast will filter by scheduledAt vs now
        createdAt: new Date(timeInMs + (8 * 60 + 30) * 60 * 1000),
      },
      {
        recipientId: employeeId,
        type: 'SHIFT_10MIN',
        title: '10 minutes left!',
        message: '10 minutes left to complete your shift!',
        attendanceId: attendance._id,
        actionRequired: false,
        actionTaken: false,
        read: false,
        createdAt: new Date(timeInMs + (8 * 60 + 50) * 60 * 1000),
      },
      {
        recipientId: employeeId,
        type: 'SHIFT_COMPLETE',
        title: 'Shift complete!',
        message: "You've completed your 9 hours! Don't forget to Time Out.",
        attendanceId: attendance._id,
        actionRequired: false,
        actionTaken: false,
        read: false,
        createdAt: new Date(timeInMs + 9 * 60 * 60 * 1000),
      },
    ]);

    return NextResponse.json({
      success: true,
      message: 'Time in recorded successfully',
      data: {
        attendanceId: attendance._id,
        timeIn: attendance.timeIn,
        status: attendance.status,
      },
    });
  } catch (error) {
    console.error('Time in error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}