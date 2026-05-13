import { Request, Response, NextFunction } from "express";

import { getCustomer } from "../services/payment/paymentService";

export const validateCustomerMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customer = await getCustomer();

    if (!customer) {
      res.status(404).json({ message: "El cliente no existe" });
    } else {
      if (!customer.isTesting) {
        if (new Date(customer.endDate) < new Date()) {
          res
            .status(403)
            .json({ message: "Debe acreditar su pago para continuar" });
          return;
        } else {
          next();
        }
      }
    } 

    next();
  } catch (error) {
    res.status(403).json({ message: "Debe acreditar su pago para continuar" });
  }
};
