import mongoose from 'mongoose';

const frequencySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['daily', 'weekdays', 'x_per_week'],
      default: 'daily',
    },
    days: { type: [Number], default: [] }, // 0 = Sunday … 6 = Saturday, for "weekdays"
    targetPerWeek: { type: Number, min: 1, max: 7, default: 3 }, // for "x_per_week"
  },
  { _id: false },
);

const habitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    icon: { type: String, default: '✅' },
    color: { type: String, default: '#4f9d69' },
    frequency: { type: frequencySchema, default: () => ({}) },
    archivedAt: { type: Date, default: null },
    // Cached on write (log toggled, schedule changed) — never recalculated on read.
    stats: {
      currentStreak: { type: Number, default: 0 },
      bestStreak: { type: Number, default: 0 },
      computedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

habitSchema.index({ userId: 1, archivedAt: 1 });

export default mongoose.model('Habit', habitSchema);
