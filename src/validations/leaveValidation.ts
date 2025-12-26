import Joi from "joi";
import { Request, Response, NextFunction } from "express";

// Leave application validation
export const leaveApplySchema = Joi.object({
  employeeId: Joi.string().required(),
  employeeName: Joi.string().required(),
  leaveType: Joi.string()
    .valid(
      "Casual Leave",
      "Sick Leave",
      "Earned Leave",
      "Maternity Leave",
      "Unpaid Leave",
      "Annual Leave",
      "Paternity Leave",
      "Compensatory Leave"
    )
    .required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  reason: Joi.string().required(),
});

// Approve/reject leave validation
export const leaveStatusSchema = Joi.object({
  status: Joi.string().valid("Approved", "Rejected").required(),
  approvedBy: Joi.string().required(),
});

// Middleware
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error)
      return res
        .status(400)
        .json({ message: "Validation error", details: error.details });
    next();
  };
};
