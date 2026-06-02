// FILE PATH: app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Notification from '@/lib/models/Notification';
import { getAuthFromCookies } from '@/lib/auth';

// ── GET — fetch notifications for current user ──
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await getAuthFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Only return notifications where createdAt <= now
    // (scheduled shift notifs have future createdAt — don't show yet)
    const notifications = await Notification.find({
      recipientId: session.employeeId,
      createdAt: { $lte: now },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = notifications.filter((n) => !n.read).length;

    // Pending overtime requests (for managers)
    const pendingOvertimeCount = notifications.filter(
      (n) => n.actionRequired && !n.actionTaken
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pendingOvertimeCount,
      },
    });
  } catch (error) {
    console.error('GET notifications error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ── PATCH — mark as read ──
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const session = await getAuthFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      // Mark all unread notifications as read for this user
      await Notification.updateMany(
        {
          recipientId: session.employeeId,
          read: false,
          createdAt: { $lte: new Date() },
        },
        { read: true }
      );

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (!notificationId) {
      return NextResponse.json({
        success: false,
        error: 'notificationId or markAllRead is required',
      }, { status: 400 });
    }

    // Mark single notification as read — must belong to current user
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipientId: session.employeeId,
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({
        success: false,
        error: 'Notification not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    console.error('PATCH notifications error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE — delete a notification ──
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const session = await getAuthFromCookies();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({
        success: false,
        error: 'Notification ID is required as query param ?id=',
      }, { status: 400 });
    }

    // Only delete if belongs to current user
    const deleted = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientId: session.employeeId,
    });

    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Notification not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('DELETE notifications error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}