import { Request } from "express";
import { RefreshTokenCommand } from "../../models/request-response/auth/commands";

/**
 * Simple adapter to transform POST /auth/refreshToken body to command.
 */
export const adaptRefreshToken = (req: Request): RefreshTokenCommand => ({
    refreshToken: req.body.refreshToken,
    userId: req.body.userId,
});
