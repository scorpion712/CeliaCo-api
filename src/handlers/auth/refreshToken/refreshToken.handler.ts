import { authService } from "../../../services";
import { RefreshTokenCommand } from "../../../models/request-response/auth/commands";

/**
 * Handler for refreshing token.
 */
export const refreshTokenHandler = async (command: RefreshTokenCommand): Promise<any> => {
    return authService.refreshToken(command.refreshToken, command.userId);
};
