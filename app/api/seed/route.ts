import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Employee from '@/lib/models/Employee';

export async function GET() {
  try {
    await connectDB();

    // Check if admin already exists
    const existing = await Employee.findOne({ employeeId: 'ITADMIN' });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: 'Admin account already exists. Nothing was changed.',
        hint: 'Login with: itadmin@51talk.com / 51T@lk3rsMNL@',
      });
    }

    // Create the admin account
    const admin = await Employee.create({
      employeeId: 'ITADMIN',
      name: 'IT Admin',
      email: 'itadmin@51talk.com',
      password: '51T@lk3rsMNL@',
      department: 'Information Technology',
      position: 'System Administrator',
      role: 'admin',
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: '✅ Admin account created!',
      credentials: {
        email: 'itadmin@51talk.com',
        password: '51T@lk3rsMNL@',
        employeeId: admin.employeeId,
      },
      next: 'DELETE this file after confirming login works!',
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: 'Seed failed. Check server logs.' },
      { status: 500 }
    );
  }
}
