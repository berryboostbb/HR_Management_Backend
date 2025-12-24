import Joi from "joi";
import { Request, Response, NextFunction } from "express";

// Validation for registering an admin
export const registerAdminSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  image: Joi.string().required(),
  password: Joi.string().min(6).required(),
  designation: Joi.string().required(),
  employeeRole: Joi.string()
    .valid("Admin", "Office Staff", "Field Staff", "HR")
    .required(),
  department: Joi.string().required(),
  joiningDate: Joi.date().required(),
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
  DOB: Joi.date().required(),
  employeeStatus: Joi.string().required(),
  leaveEntitlements: Joi.array().items(Joi.string()).required(),
});

// Validation for login
export const loginAdminSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Validation for updating an admin
export const updateAdminSchema = Joi.object({
  name: Joi.string().min(3).max(50),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  image: Joi.string(),
  designation: Joi.string(),
  employeeRole: Joi.string().valid(
    "Admin",
    "Office Staff",
    "Field Staff",
    "HR"
  ),
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
  leaveEntitlements: Joi.array().items(Joi.string()),
});
