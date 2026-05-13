import { Request, Response, NextFunction } from "express";

import { adaptLogin } from "../adapters/auth/Login.adapter";
import { adaptRefreshToken } from "../adapters/auth/RefreshToken.adapter";
import { adaptRegister } from "../adapters/auth/Register.adapter";

import { loginHandler } from "../handlers/auth/login/login.handler";
import { refreshTokenHandler } from "../handlers/auth/refreshToken/refreshToken.handler";
import { validateStatusHandler } from "../handlers/auth/validateStatus/validateStatus.handler";
import { registerHandler } from "../handlers/auth/register/register.handler";

import { errors } from "../errors";

export const AuthController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = adaptLogin(req);
      const result = await loginHandler(command);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = adaptRegister(req);
      const result = await registerHandler(command);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  refreshToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken, userId } = req.body;
      
      if (!userId) {
        return next(errors.validation("User ID is required"));
      }
      if (!refreshToken) {
        return next(errors.validation("Refresh token is required"));
      }

      const command = adaptRefreshToken(req);
      const result = await refreshTokenHandler(command);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  validateStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await validateStatusHandler();
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};