import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQRSession extends Document {
  employeeId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

const QRSessionSchema = new Schema<IQRSession>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true,
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry time is required'],
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically delete expired tokens after 1 hour
QRSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

// Static method to validate and consume token
QRSessionSchema.statics.validateAndConsume = async function (token: string) {
  const session = await this.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() },
  }).populate('employeeId');

  if (!session) {
    return null;
  }

  // Mark as used
  session.used = true;
  session.usedAt = new Date();
  await session.save();

  return session;
};

// Static method to invalidate all tokens for an employee
QRSessionSchema.statics.invalidateAllForEmployee = async function (employeeId: string) {
  await this.updateMany(
    { employeeId, used: false },
    { used: true, usedAt: new Date() }
  );
};

const QRSession: Model<IQRSession> =
  mongoose.models.QRSession || mongoose.model<IQRSession>('QRSession', QRSessionSchema);

export default QRSession;
