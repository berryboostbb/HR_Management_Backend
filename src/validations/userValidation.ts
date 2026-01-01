import Joi from "joi";
import { Request, Response, NextFunction } from "express";

const leaveEntitlementsSchema = Joi.object({
  casualLeave: Joi.object({
    total: Joi.number().default(0),
    consumed: Joi.number().default(0),
  }),
  sickLeave: Joi.object({
    total: Joi.number().default(0),
    consumed: Joi.number().default(0),
  }),
  annualLeave: Joi.object({
    total: Joi.number().default(0),
    consumed: Joi.number().default(0),
  }),
  maternityLeave: Joi.object({
    total: Joi.number().default(0),
    consumed: Joi.number().default(0),
  }),
  paternityLeave: Joi.object({
    total: Joi.number().default(0),
    consumed: Joi.number().default(0),
  }),
});

export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  image: Joi.string().required(),
  phoneNumber: Joi.string().messages({
    "string.pattern.base": "Phone number must be 10-15 digits",
  }),
  password: Joi.string().min(6).required(),
  role: Joi.string().required(),
  employeeType: Joi.string().trim().required(),
  department: Joi.string().required(),
  joiningDate: Joi.date().required(),
  DOB: Joi.date().required(),
  employeeStatus: Joi.string().required(),
  gender: Joi.string().valid("Male", "Female", "Other").required(),
  salaryStructure: Joi.object({
    basic: Joi.number().required(),
    incentive: Joi.object({
      flue: Joi.number().default(0),
      medical: Joi.number().default(0),
      others: Joi.number().default(0),
      deductions: Joi.number().default(0),
    }).required(),
    tax: Joi.number().default(0),
  }).required(),
  loanPF: Joi.object({
    loan: Joi.number().default(0),
    pf: Joi.number().default(0),
  }).required(),
  leaveEntitlements: leaveEntitlementsSchema.required(),
});

// Validation for login
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Validation for updating an admin
export const updateUserSchema = Joi.object({
  name: Joi.string().min(3).max(50),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  gender: Joi.string(),
  phoneNumber: Joi.string().messages({
    "string.pattern.base": "Phone number must be 10-15 digits",
  }),

  image: Joi.string(),
  role: Joi.string(),

  employeeType: Joi.string().valid("Office Staff", "Field Staff", "Admin"),

  department: Joi.string(),
  joiningDate: Joi.date(),

  salaryStructure: Joi.object({
    basic: Joi.number(),
    incentive: Joi.object({
      flue: Joi.number(),
      medical: Joi.number(),
      others: Joi.number(),
      deductions: Joi.number(),
    }),
    tax: Joi.number(),
  }),

  loanPF: Joi.object({
    loan: Joi.number(),
    pf: Joi.number(),
  }),

  DOB: Joi.date(),
  employeeStatus: Joi.string(),

  leaveEntitlements: leaveEntitlementsSchema,
});
