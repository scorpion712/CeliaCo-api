import { Request } from "express";

// Adapters
import { adaptCreateSale } from "../adapters/sales/CreateSale.adapter";
import { adaptGetSales } from "../adapters/sales/GetSales.adapter";
import { adaptGetSaleById } from "../adapters/sales/GetSaleById.adapter";
import { adaptUpdateSale } from "../adapters/sales/UpdateSale.adapter";
import { adaptDeleteSale } from "../adapters/sales/DeleteSale.adapter";
import { validateDatesQuery } from "../helpers";

// Handlers (business logic)
import { createSaleHandler } from "../handlers/sales/create/createSale.handler";
import { getSalesHandler } from "../handlers/sales/get/getSales.handler";
import { getSaleByIdHandler } from "../handlers/sales/getById/getSaleById.handler";
import { updateSaleHandler } from "../handlers/sales/update/updateSale.handler";
import { deleteSaleHandler } from "../handlers/sales/delete/deleteSale.handler";
import { getSalesSummaryHandler, GetSalesSummaryCommand } from "../handlers/sales/getSummary/getSalesSummary.handler";
import { salesService } from "../services/instances";

export const SalesController = {
  /**
   * POST /sales - Create a new sale
   */
  createSale: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptCreateSale(req);
      const result = await createSaleHandler(command);
      res.status(200).json({ id: result.saleId });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /sales - List sales with filters
   */
  getSales: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptGetSales(req);
      
      const result = await getSalesHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /sales/summary - Get sales summary
   */
  getSalesSummary: async (req: Request, res: any, next: any) => {
    try {
      const dates = validateDatesQuery({
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });

      const command: GetSalesSummaryCommand = {
        initDate: dates.startDate,
        endDate: dates.endDate,
      };

      const result = await getSalesSummaryHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /sales/:id - Get a sale by ID
   */
  getSaleById: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptGetSaleById(req);
      const result = await getSaleByIdHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /sales/:id - Update a sale
   */
  updateSale: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptUpdateSale(req);
      const result = await updateSaleHandler(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /sales/:id - Delete a sale
   */
  deleteSale: async (req: Request, res: any, next: any) => {
    try {
      const command = adaptDeleteSale(req);
      await deleteSaleHandler(command);
      res.status(200).json();
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /sales/diarias - Get daily sales by type
   */
  getDailySalesByType: async (req: Request, res: any, next: any) => {
    try {
      const date = req.query.fecha as string | undefined;
      const result = await salesService.getDailySalesByType(date);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
