import { authService } from "../../../services";
import { LoginCommand } from "../../../models/request-response/auth/commands";

/**
 * Handler for user login.
 */
export const loginHandler = async (command: LoginCommand): Promise<any> => {
    return authService.login(command.email, command.password);
};
