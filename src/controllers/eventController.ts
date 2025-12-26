import { Request, Response } from "express";
import Event from "../models/eventModel";
import {
  createEventSchema,
  updateEventSchema,
} from "../validations/eventValidation";

// Create Event
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { error, value } = createEventSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ message: "Validation error", errors: error.details });

    const event = new Event(value);
    await event.save();
    res.status(201).json({ message: "Event created successfully", event });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// Get All Events
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query as any;
    const query: any = {};

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { heading: { $regex: search, $options: "i" } },
        { overview: { $regex: search, $options: "i" } },
      ];
    }

    const events = await Event.find(query).sort({ date: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// Get Event By ID
export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// Update Event
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateEventSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ message: "Validation error", errors: error.details });

    const event = await Event.findByIdAndUpdate(req.params.id, value, {
      new: true,
    });
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json({ message: "Event updated successfully", event });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// Delete Event
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
