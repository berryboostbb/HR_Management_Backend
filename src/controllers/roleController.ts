import { Request, Response } from "express";
import { roles } from "../config/roles";

export const getRoles = (_req: Request, res: Response) => {
  res.status(200).json(roles);
};
