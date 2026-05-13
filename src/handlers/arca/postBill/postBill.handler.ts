import { arcaService } from "../../../services";
import { PostBillCommand } from "../../../models/request-response/arca/commands";

/**
 * Handler for posting a bill to ARCA.
 */
export const postBillHandler = async (command: PostBillCommand): Promise<any> => {
    return arcaService.postBill(command);
};
