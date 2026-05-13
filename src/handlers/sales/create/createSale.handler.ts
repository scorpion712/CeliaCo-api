import {
  salesService,
  saleDetailsService,
  productsService,
  cuentaCorrienteService,
} from "../../../services";
import { CreateSaleCommand } from "../../../models/request-response/sales/commands";
import { SaleType, CreateSaleRequest, SalesCartItem } from "../../../models";

export interface CreateSaleResult {
  saleId: string;
  ventaCuentaId?: string;
}

/**
 * Handler for creating a sale.
 * - If customerId is provided → sale to a specific client
 * - If customerId is NOT provided → sale to "Consumidor Final"
 * Supports SaleType.Cuenta for credit/fiado sales.
 */
export const createSaleHandler = async (
  command: CreateSaleCommand,
): Promise<CreateSaleResult> => {
  // ============================================================
  // VALIDACIÓN DE STOCK ANTES DE PROCESAR LA VENTA
  // ============================================================
  for (const item of command.cartItems) {
    if (item.id) {
      // Obtener producto para validar stock
      const products = await productsService.getProducts({ limit: 1, offset: 0 });
      const product = products.data.find((p: any) => p.id === item.id);
      
      if (product) {
        const currentStock = (product as any).stock ?? 0;
        const requestedQty = item.quantity || 0;
        const stockMandatory = (product as any).stockMandatory ?? false;
        const allowSaleWithoutStock = (product as any).allowSaleWithoutStock ?? false;
        
        // Validar stock
        if (currentStock < requestedQty) {
          // Si el stock es menor al solicitado
          if (stockMandatory && !allowSaleWithoutStock) {
            // Producto requiere stock suficiente para vender
            const error = new Error(
              `Stock insuficiente para "${item.name || item.id}". ` +
              `Disponible: ${currentStock}, Solicitado: ${requestedQty}`
            );
            (error as any).code = 'INSUFFICIENT_STOCK';
            (error as any).productId = item.id;
            (error as any).available = currentStock;
            (error as any).requested = requestedQty;
            throw error;
          }
          // Si allowSaleWithoutStock = true, permitir la venta aunque no haya stock
        }
      }
    }
  }
  
  // ============================================================
  // CONTINUAR CON LA CREACIÓN DE LA VENTA
  // ============================================================
  // customerId is optional - if not provided, it's a "Consumidor Final" sale
  const customerId = command.customerId ?? null;

  // Transform arcaData to match required types if present
  let arcaDataFormatted: CreateSaleRequest["arcaData"];
  if (command.arcaData) {
    arcaDataFormatted = {
      cae: command.arcaData.cae ?? "",
      afip: command.arcaData.afip ?? { CAE: "", CAEFchVto: "" },
      nroCbte: command.arcaData.nroCbte ?? 0,
      ptoVenta: command.arcaData.ptoVenta ?? "",
      qrData: command.arcaData.qrData ?? "",
    };
  }

  // Create sale
  const createSaleRequest: CreateSaleRequest = {
    total: command.total,
    type: command.type,
    cartItems: command.cartItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      iva: item.iva,
      total: item.total,
    })),
    customerId,
    arcaData: arcaDataFormatted,
    iva: command.iva,
  };

  const saleId = await salesService.createSale(createSaleRequest);

  // Create sale details
  const saleDetails: Omit<SalesCartItem, "id">[] = command.cartItems.map(
    (item: any) => {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseInt(item.quantity) || 0;
      const ivaPct = item.iva ?? (itemPrice * itemQuantity * 0.21);
      return {
        saleId,
        description: item.name,
        qty: item.quantity,
        total: item.total,
        ivaPct,
      };
    },
  );

  await saleDetailsService.createSaleDetail(saleDetails as SalesCartItem[]);

  // Actualizar el stock de cada producto
  for (const item of command.cartItems) {
    if (item.id) {
      try {
        await productsService.updateStock(item.id, item.quantity, "subtract");
      } catch (error) {
        console.error(
          `Error al actualizar stock del producto ${item.id}:`,
          error,
        );
      }
    }
  }

  // Handle SaleType.Cuenta - create venta a cuenta
  let ventaCuentaId: string | undefined;
  if (command.type === SaleType.Cuenta && customerId) {
    try {
      // Get or create the cuenta corriente for the customer
      const cuenta = await cuentaCorrienteService.getOrCreateCuenta(customerId);
      
      // Create the venta a cuenta
      const ventaCuenta = await cuentaCorrienteService.createVentaCuenta(
        cuenta.id,
        saleId,
        command.total
      );
      
      ventaCuentaId = ventaCuenta.id;
    } catch (error: any) {
      console.error('[Sale] Error al crear venta a cuenta:', error?.message || error);
      // Don't fail the sale, just log the error
    }
  }

  return { saleId, ventaCuentaId };
};
