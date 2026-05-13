import { Request } from "express";

// Adapters
import { adaptCreateCustomer } from "../adapters/customers/CreateCustomer.adapter";
import { adaptGetCustomers } from "../adapters/customers/GetCustomers.adapter";
import { adaptGetCustomerById } from "../adapters/customers/GetCustomerById.adapter";
import { adaptUpdateCustomer } from "../adapters/customers/UpdateCustomer.adapter";
import { adaptDeleteCustomer } from "../adapters/customers/DeleteCustomer.adapter";
import { adaptActivateCustomer } from "../adapters/customers/ActivateCustomer.adapter";

// Handlers (business logic)
import { createCustomerHandler } from "../handlers/customers/create/createCustomer.handler";
import { getCustomersHandler } from "../handlers/customers/get/getCustomers.handler";
import { getCustomerByIdHandler } from "../handlers/customers/getById/getCustomerById.handler";
import { updateCustomerHandler } from "../handlers/customers/update/updateCustomer.handler";
import { deleteCustomerHandler } from "../handlers/customers/delete/deleteCustomer.handler";
import { activateCustomerHandler } from "../handlers/customers/activate/activateCustomer.handler";

export const CustomersController = {
  /**
   * POST /customers - Create a new customer
   */
  createCustomer: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptCreateCustomer(req);
      const result = await createCustomerHandler(command);
      res.status(200).json(result.id);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /customers - List customers with filters
   */
  getCustomers: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptGetCustomers(req);
      const result = await getCustomersHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /customers/:id - Get a customer by ID
   */
  getCustomerById: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptGetCustomerById(req);
      const result = await getCustomerByIdHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /customers/:id - Update a customer
   */
  updateCustomer: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptUpdateCustomer(req);
      const result = await updateCustomerHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /customers/:id - Delete (soft delete) a customer
   */
  deleteCustomer: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptDeleteCustomer(req);
      await deleteCustomerHandler(command);
      res.status(200).json();
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /customers/:id/activate - Activate a customer
   */
  activateCustomer: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptActivateCustomer(req);
      await activateCustomerHandler(command);
      res.status(200).json();
    } catch (error) {
      next(error);
    }
  },
};
