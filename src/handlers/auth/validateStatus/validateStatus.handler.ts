import { getCustomer } from "../../../services/payment/paymentService";

/**
 * Handler for validating status.
 */
export const validateStatusHandler = async (): Promise<any> => {
    return getCustomer();
};
