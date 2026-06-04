// FILE PATH: app/api/cron/mark-absent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';
import Notification from '@/lib/models/Notification';

export async function GET(req: NextRequest) {
  try {
    // Verify this is called by Vercel Cron — not a random person
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all active employees
    const employees = await Employee.find({
      isActive: true,
      role: { $in: ['employee', 'manager'] }, // mark admin as absent too if needed, remove this filter
    }).select('_id name department email');

    let markedCount = 0;
    const absentEmployees: string[] = [];

    for (const employee of employees) {
      // Check if they have ANY attendance record today
      const todayShift = await Attendance.findOne({
        employeeId: employee._id,
        timeIn: { $gte: today, $lt: tomorrow },
      });

      // If no record at all today → mark as absent
      if (!todayShift) {
        // Create absent record
        await Attendance.create({
          employeeId: employee._id,
          timeIn: today, // use start of day as placeholder
          status: 'absent' as any, // we'll add this to the enum
          qrTokenUsed: 'SYSTEM_ABSENT',
          notes: 'Auto-marked absent — no time-in recorded by 5:00 PM',
          autoSignedOut: false,
          overtimeRequested: false,
          undertimeRequested: false,
        });

        // Notify the employee
        await Notification.create({
          recipientId: employee._id,
          type: 'AUTO_SIGNED_OUT', // reusing closest type, or add MARKED_ABSENT type
          title: 'Marked as Absent',
          message: 'You were marked as absent today because no time-in was recorded by 5:00 PM.',
          actionRequired: false,
          read: false,
        });

        markedCount++;
        absentEmployees.push(employee.name);
      }
    }

    console.log(`[CRON] Marked ${markedCount} employees as absent:`, absentEmployees);

    return NextResponse.json({
      success: true,
      message: `Marked ${markedCount} employee(s) as absent`,
      data: { markedCount, absentEmployees },
    });
  } catch (error) {
    console.error('[CRON] mark-absent error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}