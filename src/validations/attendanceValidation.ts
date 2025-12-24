import Joi from "joi";
import { Request, Response, NextFunction } from "express";

// Check-In Validation
export const checkInSchema = Joi.object({
  employeeId: Joi.string().required(),
  employeeRole: Joi.string().valid("Office", "Field").required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).required(),
});

// Check-Out Validation
export const checkOutSchema = Joi.object({
  employeeId: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).required(),
});

// Edit Attendance Validation
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
    }),
  }),
  checkOut: Joi.object({
    time: Joi.date(),
    location: Joi.object({
      lat: Joi.number(),
      lng: Joi.number(),
    }),
  }),
  reason: Joi.string(),
});

// Middleware to validate request body
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation error", details: error.details });
    }
    next();
  };
};
