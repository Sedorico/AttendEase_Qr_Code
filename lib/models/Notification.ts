// FILE PATH: lib/models/Notification.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'SHIFT_30MIN'
  | 'SHIFT_10MIN'
  | 'SHIFT_COMPLETE'
  | 'OVERTIME_REQUEST'
  | 'OVERTIME_APPROVED'
  | 'OVERTIME_REJECTED'
  | 'UNDERTIME_REQUEST'
  | 'UNDERTIME_APPROVED'
  | 'UNDERTIME_REJECTED'
  | 'AUTO_SIGNED_OUT';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  attendanceId?: mongoose.Types.ObjectId;
  actionRequired?: boolean;
  actionTaken?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Recipient is required'],
      index: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    type: {
      type: String,
      enum: [
        'SHIFT_30MIN', 'SHIFT_10MIN', 'SHIFT_COMPLETE',
        'OVERTIME_REQUEST', 'OVERTIME_APPROVED', 'OVERTIME_REJECTED',
        'UNDERTIME_REQUEST', 'UNDERTIME_APPROVED', 'UNDERTIME_REJECTED',
        'AUTO_SIGNED_OUT',
      ],
      required: [true, 'Notification type is required'],
    },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    message: { type: String, required: [true, 'Message is required'], trim: true },
    read: { type: Boolean, default: false, index: true },
    attendanceId: { type: Schema.Types.ObjectId, ref: 'Attendance', default: null },
    actionRequired: { type: Boolean, default: false },
    actionTaken: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, actionRequired: 1, actionTaken: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;