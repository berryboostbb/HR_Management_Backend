import Joi from "joi";
import { Request, Response, NextFunction } from "express";

const objectId = Joi.string().hex().length(24);

export const payrollSchema = Joi.object({
  employeeId: Joi.string().required(),
  employeeName: Joi.string().required(),
  position: Joi.string().allow("").optional(),
  month: Joi.string().trim().required(),
  year: Joi.number().integer().min(2000).max(2100).required(),

  presentDays: Joi.number().min(0).default(0),
  approvedLeaves: Joi.number().min(0).default(0),

  basicSalary: Joi.number().min(0).required(),

  allowances: Joi.object({
    medical: Joi.number().min(0).default(0),
    transport: Joi.number().min(0).default(0),
    others: Joi.number().min(0).default(0),
  }).default({
    medical: 0,
    transport: 0,
    others: 0,
  }),

  deductions: Joi.object({
    pf: Joi.number().min(0).default(0),
    loan: Joi.number().min(0).default(0),
    advanceSalary: Joi.number().min(0).default(0),
    tax: Joi.number().min(0).default(0),
    others: Joi.number().min(0).default(0),
  }).default({
    pf: 0,
    loan: 0,
    advanceSalary: 0,
    tax: 0,
    others: 0,
  }),

  grossSalary: Joi.number().min(0).required(),
  netPay: Joi.number().min(0).required(),

  payrollStatus: Joi.string()
    .valid("Pending", "Processed", "Approved")
    .default("Pending"),

  approvedBy: objectId.optional(),
  isLocked: Joi.boolean().default(false),
  processedAt: Joi.date().optional(),
  salarySlipUrl: Joi.string().uri().optional(),
});

// For approving payroll
export const approvePayrollSchema = Joi.object({
  approvedBy: objectId.required(),
});

// Middleware
export const validateBody =
  (schema: Joi.ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    req.body = value; // ✅ sanitized data
    next();
  };
