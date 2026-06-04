// FILE PATH: lib/models/Attendance.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export type AttendanceStatus =
  | 'in_progress'
  | 'complete'
  | 'undertime'
  | 'overtime'
  | 'auto_signed_out'
  | 'absent';           // ← added

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  timeIn: Date;
  timeOut?: Date;
  totalMinutes?: number;
  workMinutes?: number;
  status: AttendanceStatus;

  // Overtime
  overtimeRequested: boolean;
  overtimeRequestedAt?: Date;
  overtimeApproved?: boolean;
  overtimeApprovedBy?: mongoose.Types.ObjectId;
  overtimeApprovedAt?: Date;

  // Undertime
  undertimeRequested: boolean;
  undertimeRequestedAt?: Date;
  undertimeReason?: string;
  undertimeApproved?: boolean;
  undertimeApprovedBy?: mongoose.Types.ObjectId;
  undertimeApprovedAt?: Date;

  autoSignedOut: boolean;
  deviceInfo?: string;
  qrTokenUsed: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true,
    },
    timeIn: {
      type: Date,
      required: [true, 'Time In is required'],
      index: true,
    },
    timeOut: { type: Date, default: null },
    totalMinutes: { type: Number, default: null },
    workMinutes: { type: Number, default: null },
    status: {
      type: String,
      enum: ['in_progress', 'complete', 'undertime', 'overtime', 'auto_signed_out', 'absent'],
      default: 'in_progress',
      index: true,
    },

    // Overtime
    overtimeRequested: { type: Boolean, default: false },
    overtimeRequestedAt: { type: Date, default: null },
    overtimeApproved: { type: Boolean, default: null },
    overtimeApprovedBy: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    overtimeApprovedAt: { type: Date, default: null },

    // Undertime
    undertimeRequested: { type: Boolean, default: false },
    undertimeRequestedAt: { type: Date, default: null },
    undertimeReason: { type: String, default: '' },
    undertimeApproved: { type: Boolean, default: null },
    undertimeApprovedBy: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    undertimeApprovedAt: { type: Date, default: null },

    autoSignedOut: { type: Boolean, default: false },
    deviceInfo: { type: String, default: '' },
    qrTokenUsed: {
      type: String,
      required: [true, 'QR token is required'],
      index: true,
    },
    location: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

AttendanceSchema.index({ employeeId: 1, timeIn: -1 });
AttendanceSchema.index({ timeIn: 1, status: 1 });

// Get today's active (in_progress) shift
AttendanceSchema.statics.getActiveShift = async function (employeeId: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  return this.findOne({ employeeId, status: 'in_progress', timeIn: { $gte: today, $lt: tomorrow } });
};

// Get today's shift (any status)
AttendanceSchema.statics.getTodayShift = async function (employeeId: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  return this.findOne({ employeeId, timeIn: { $gte: today, $lt: tomorrow } }).sort({ timeIn: -1 });
};

// Calculate status from workMinutes
AttendanceSchema.statics.calculateStatus = function (workMinutes: number): AttendanceStatus {
  const REQUIRED = 540;
  const TOLERANCE = 5;
  if (workMinutes >= REQUIRED + TOLERANCE) return 'overtime';
  if (workMinutes >= REQUIRED - TOLERANCE) return 'complete';
  return 'undertime';
};

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;