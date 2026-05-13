import { arcaService } from "../../../services";
import { SendBillCommand } from "../../../models/request-response/arca/commands";

/**
 * Handler for sending a bill to ARCA.
 */
export const sendBillHandler = async (command: SendBillCommand): Promise<any> => {
    return arcaService.sendBill(command.saleId);
};
