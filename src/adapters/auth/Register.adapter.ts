import { Request } from "express";
import { RegisterCommand } from "../../models/request-response/auth/commands";

/**
 * Simple adapter to transform POST /auth/register body to command.
 */
export const adaptRegister = (req: Request): RegisterCommand => ({
    email: req.body.email,
    password: req.body.password,
    nombre: req.body.nombre,
});