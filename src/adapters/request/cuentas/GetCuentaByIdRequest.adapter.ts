import { Request } from "express";

export interface GetCuentaByIdCommand {
  id: string;
}

export const adaptGetCuentaById = (req: Request): GetCuentaByIdCommand => {
  return {
    id: req.params.id as string,
  };
};
