import { Request } from "express";
import { LoginCommand } from "../../models/request-response/auth/commands";

/**
 * Simple adapter to transform POST /auth/login body to command.
 */
export const adaptLogin = (req: Request): LoginCommand => ({
    email: req.body.email,
    password: req.body.password,
});
