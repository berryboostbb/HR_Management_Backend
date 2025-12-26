import Joi from "joi";
import { Request, Response, NextFunction } from "express";

/* =======================
   CHECK-IN VALIDATION
======================= */
export const checkInSchema = Joi.object({
  employeeId: Joi.string().required(),
  employeeName: Joi.string().required(), // ✅ ADDED
  employeeRole: Joi.string()
    .valid("Admin", "Office Staff", "Field Staff", "HR") // ✅ FIXED
    .required(),

  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional(),
  }).required(),
}).options({ allowUnknown: false });

/* =======================
   CHECK-OUT VALIDATION
======================= */
export const checkOutSchema = Joi.object({
  employeeId: Joi.string().required(),

  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
    address: Joi.string().optional(),
  }).required(),
}).options({ allowUnknown: false });

/* =======================
   EDIT ATTENDANCE VALIDATION
======================= */
export const editAttendanceSchema = Joi.object({
  status: Joi.string().valid(
    "Present",
    "Late",
    "Absent",
    "Half-day",
    "On Leave"
  ),

  checkIn: Joi.object({
    time: Joi.date(),
    location: Joi.object({
      lat: Joi.number(),
      lng: Joi.number(),
      address: Joi.string().optional(),
    }),
  }),

  checkOut: Joi.object({
    time: Joi.date(),
    location: Joi.object({
      lat: Joi.number(),
      lng: Joi.number(),
      address: Joi.string().optional(),
    }),
  }),

  employeeRole: Joi.string().valid(
    "Admin",
    "Office Staff",
    "Field Staff",
    "HR"
  ),

  reason: Joi.string().min(3).max(250),
})
  .min(1) // ✅ At least one field must be updated
  .options({ allowUnknown: false });

/* =======================
   VALIDATION MIDDLEWARE
======================= */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, // ✅ removes extra keys safely
    });

    if (error) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    next();
  };
};
