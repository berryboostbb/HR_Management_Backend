import Joi from "joi";

export const createEventSchema = Joi.object({
  coverImage: Joi.string().uri().required().messages({
    "string.empty": "Cover image is required",
    "string.uri": "Cover image must be a valid URL",
  }),
  date: Joi.date().required().messages({
    "any.required": "Date is required",
    "date.base": "Date must be valid",
  }),
  heading: Joi.string().min(5).max(100).required().messages({
    "string.empty": "Heading is required",
    "string.min": "Heading must be at least 5 characters",
    "string.max": "Heading can't exceed 100 characters",
  }),
  overview: Joi.string().required().messages({
    "string.empty": "Overview is required",
  }),
  category: Joi.string().required(),
});

export const updateEventSchema = createEventSchema.fork(
  ["coverImage", "date", "heading", "overview", "category"],
  (field) => field.optional()
);
