import { Request } from "express";

export const DashboardController = {
  /**
   * GET /dashboard/info - Get dashboard summary info
   */
  getInfo: async (req: Request, res: any, next: any) => {
    try {
      const { dashboardService } = await import("../services");
      const result = await dashboardService.getDashboardInfo();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
