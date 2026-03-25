const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["operator", "supervisor", "manager"]),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const startRunSchema = z.object({
  lineId: z.string().min(1),
  plannedProductionTimeMinutes: z.number().int().positive(),
  targetRatePerMinute: z.number().nonnegative(),
  shiftId: z.string().optional().default(""),
});

const stopRunSchema = z.object({
  runId: z.string().min(1),
});

const downtimeCreateSchema = z.object({
  runId: z.string().min(1),
  durationMinutes: z.number().nonnegative(),
  reason: z.enum(["breakdown", "changeover", "material_wait", "planned_stop"]),
  note: z.string().optional().default(""),
  occurredAt: z.string().datetime().optional(),
});

const qualityCreateSchema = z.object({
  runId: z.string().min(1),
  rejectedUnits: z.number().int().nonnegative(),
  defectReason: z.string().min(1),
  occurredAt: z.string().datetime().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  startRunSchema,
  stopRunSchema,
  downtimeCreateSchema,
  qualityCreateSchema,
};
