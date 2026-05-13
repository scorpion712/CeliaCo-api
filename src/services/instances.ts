import {
  SalesRepository,
  CustomersRepository,
  SaleDetailsRepository,
  ProductsRepository,
  CuentasCorrientesRepository,
} from "../repositories";
import { SalesService, CustomersService, SaleDetailsService, ProductsService, DashboardService } from "../services";
import { CuentaCorrienteService } from "./cuentas/CuentaCorriente.service";

const salesRepository = new SalesRepository();
const customersRepository = new CustomersRepository();
const saleDetailsRepository = new SaleDetailsRepository();
const productsRepository = new ProductsRepository();
const cuentasCorrientesRepository = new CuentasCorrientesRepository();

export const salesService = new SalesService(salesRepository);
export const customersService = new CustomersService(customersRepository);
export const saleDetailsService = new SaleDetailsService(saleDetailsRepository);
export const productsService = new ProductsService(productsRepository);
export const dashboardService = new DashboardService();
export const cuentaCorrienteService = new CuentaCorrienteService(cuentasCorrientesRepository);
