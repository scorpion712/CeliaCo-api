import { authService } from "../../../services";
import { RegisterCommand } from "../../../models/request-response/auth/commands";

/**
 * Handler for user registration.
 */
export const registerHandler = async (command: RegisterCommand): Promise<any> => {
    return authService.register(command.email, command.password, command.nombre);
};