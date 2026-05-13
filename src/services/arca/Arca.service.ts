import fs from "fs";
const Afip = require("@afipsdk/afip.js");
import { SalesRepository } from "../../repositories";

// Try to read certificate files, but don't fail if they don't exist
let cert = "";
let key = "";

try {
  if (fs.existsSync("BusinessName.csr")) {
    cert = fs.readFileSync("BusinessName.csr", { encoding: "utf8" });
  }
} catch (e) {
  console.warn("Certificate file BusinessName.csr not found, ARCA billing disabled");
}

try {
  if (fs.existsSync("BusinessName.key")) {
    key = fs.readFileSync("BusinessName.key", { encoding: "utf8" });
  }
} catch (e) {
  console.warn("Key file BusinessName.key not found, ARCA billing disabled");
}

const afip = cert && key ? new Afip({ CUIT: "27375614060" /*, production: true*/ }) : null;

interface CartItem {
  product: {
    price: number;
    iva: number;
  };
  qty: number;
}
interface Customer {
  ivaCategory: string;
  fiscalId?: string;
  dni?: string;
}
interface Req {
  cartItems: CartItem[];
  customer: Customer;
  voucher?: number;
}
interface Res {
  send(payload: any): void;
}

interface Alicuota {
  Id: number;
  BaseImp: string;
  Importe: string;
}

export function calcIvaAmounts(items: CartItem[]): { iva21: number; iva10_5: number } {
  return items.reduce(
    (acc, { product: { price, iva }, qty }) => {
      const totalPrice = price * qty;

      if (iva >= 21) {
        const net = totalPrice / 1.21; // extraer precio sin IVA 21%
        acc.iva21 += totalPrice - net;
      } else if (iva > 0) {
        const net = totalPrice / 1.105; // extraer precio sin IVA 10.5%
        acc.iva10_5 += totalPrice - net;
      }
      return acc;
    },
    { iva21: 0, iva10_5: 0 }
  );
}

const getIVAReceptorId = (ivaCategory: string) => {
    /**
     * Condición frente al IVA del receptor
     *
     * 1 = IVA Responsable Inscripto
     * 4 = IVA Sujeto Exento
     * 5 = Consumidor Final
     * 6 = Responsable Monotributo
     * 7 = Sujeto No Categorizado
     * 8 = Proveedor del Exterior
     * 9 = Cliente del Exterior
     * 10 = IVA Liberado – Ley N° 19.640
     * 13 = Monotributista Social
     * 15 = IVA No Alcanzado
     * 16 = Monotributo Trabajador Independiente Promovido
     **/
  switch (ivaCategory) {
    case "Monotributista":
      return 6;
    case "Responsable Inscripto":
      return 1;
    case "Exento":
      return 4;
    case "Consumidor Final":
      return 5;
    default:
      return 5;
  }
};

const postBill = async (req: Req) => {
  // Check if ARCA is configured
  if (!afip) {
    return { error: "ARCA not configured - certificate files not found" };
  }

  const { cartItems, customer, voucher = 0 } = req;

  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  // DocTipo: segun customer.dni o customer.cuit?
  // DocTipo: ver cateogorias posibles
  // CbteDesde
  //              ==> Son iguales. Obtener de la base (#venta fiscal?)
  // CbteHasta
  const type =
    customer.ivaCategory == "Monotributista" ||
    customer.ivaCategory == "Responsable Inscripto"
      ? 1
      : 6;

  const { iva21, iva10_5: iva10 } = calcIvaAmounts(cartItems);
  const total = cartItems.reduce(
    (total, item) => total + item.product.price * item.qty,
    0
  );

  try {
    //Devuelve el número del último comprobante creado para el punto de venta y el tipo de comprobante 6 (Factura B)
    const lastVoucher = voucher != 0 ? voucher : await afip.ElectronicBilling.getLastVoucher(
      process.env.PtoVta,
      type
    );

    const total21 = cartItems.reduce(
      (s, { product: { price, iva }, qty }) =>
        iva >= 21 ? s + price * qty : s,
      0
    );

    const alicuotasIva = [] as Alicuota[];
    if (iva21 > 0)
      alicuotasIva.push({
        Id: 5,
        BaseImp: (total21 - iva21).toFixed(2),
        Importe: iva21.toFixed(2),
      });
    if (iva10 > 0)
      alicuotasIva.push({
        Id: 4,
        BaseImp: (total - total21 - iva10).toFixed(2),
        Importe: iva10.toFixed(2),
      }); 

    let data = {
      CantReg: 1, // Cantidad de comprobantes a registrar
      PtoVta: process.env.PtoVta, // Punto de venta
      CbteTipo: type, // Tipo de comprobante (ver tipos disponibles)
      // 1 Factura A
      // 6 Factura B Para facturas B (CbteDesde distinto a
      //CbteHasta) el campo DocNro deberá ser cero
      //(0) y el campo DocTipo 99
      Concepto: 1, // Concepto del Comprobante: (1)Productos, (2)Servicios, (3)Productos y Servicios
      /**
       * Tipo de documento del comprador
       *
       * Opciones:
       *
       * 80 = CUIT
       * 86 = CUIL
       * 96 = DNI
       * 99 = Consumidor Final
       **/
      DocTipo: type == 1 ? 80 : 99, // Tipo de documento del comprador (99 consumidor final, ver tipos disponibles)
      // 91 Monotributista
      // para clase A tener 80

      CondicionIVAReceptorId: getIVAReceptorId(customer.ivaCategory),
      DocNro:
        customer.ivaCategory == "Consumidor Final" ||
        customer.ivaCategory == "Exento"
          ? 0
          : customer.fiscalId?.replace(/-/g, "")
          ? customer.fiscalId?.replace(/-/g, "")
          : customer.dni, // Número de documento del comprador (0 consumidor final)
      // cbtedesde hasta deben coincidir y es el numero del comprobante emitido
      CbteDesde: lastVoucher + 1, // Número de comprobante o numero del primer comprobante en caso de ser mas de uno
      CbteHasta: lastVoucher + 1, // Número de comprobante o numero del último comprobante en caso de ser mas de uno
      CbteFch: parseInt(date.replace(/-/g, "")), // (Opcional) Fecha del comprobante (yyyymmdd) o fecha actual si es nulo
      ImpTotal: total, // Importe total del comprobante
      ImpTotConc: 0, // Importe neto no gravado
      // Para comprobantes tipo Bienes Usados – Emisor Monotributista este campo corresponde al importe subtotal.
      ImpNeto: (total - iva21 - iva10).toFixed(2), // Importe neto gravado
      // Para comprobantes tipo Bienes Usados – Emisor Monotributista este campo corresponde al importe subtotal.
      ImpOpEx: 0, // Importe exento de IVA.
      // Para comprobantes tipo Bienes Usados – Emisor Monotributista no informo o = 0
      ImpIVA: (Number(iva21) + Number(iva10)).toFixed(2), //Importe total de IVA
      // sumatoria de los importes del arreglo Iva
      ImpTrib: 0, //Importe total de tributos
      MonId: "PES", //Tipo de moneda usada en el comprobante (ver tipos disponibles)('PES' para pesos argentinos)
      MonCotiz: 1, // Cotización de la moneda usada (1 para pesos argentinos)
      Iva: alicuotasIva,
    };
    
    const afipRes = await afip.ElectronicBilling.createVoucher(data);

    //   res["CAE"]; //CAE asignado el comprobante
    //   res["CAEFchVto"]; //Fecha de vencimiento del CAE (yyyy-mm-dd)

    const qrData = {
      ver: 1,
      fecha: parseInt(date.replace(/-/g, "")),
      cuit: process.env.CUIT,
      ptoVta: process.env.PtVta,
      tipoCmp: type,
      nroCmp: lastVoucher + 1,
      importe: 12100,
      moneda: "PES",
      ctz: 1,
      tipoDocRec: type == 1 ? 80 : 99,
      nroDocRec:
        customer.ivaCategory == "Consumidor Final" ||
        customer.ivaCategory == "Exento"
          ? 0
          : customer.fiscalId
          ? customer.fiscalId
          : customer.dni,
      tipoCodAut: "E",
      codAut: afipRes["CAE"],
    };

    return {
      afip: afipRes,
      ptoVenta: process.env.PtoVta,
      nroCbte: lastVoucher + 1,
      qrData: `https://www.afip.gob.ar/fe/qr/?p=${JSON.stringify(qrData)}`,
    };
  } catch (error) {
    console.error({ error: error });
    return null;
  }
};

const sendBill = async (saleId: string) => {
  // Check if ARCA is configured
  if (!afip) {
    return { error: "ARCA not configured - certificate files not found" };
  }

  const salesRepository = new SalesRepository();
  const sale = await salesRepository.getFiscalSaleById(saleId);

  const cartItems = sale.items.map((item: any) => {
    return {
      product: { 
        price: item.itemTotal,
        iva: item.itemIVA,
      },
      qty: item.amount,
    };
  });

  const customer = {
    ivaCategory: sale.customerCategory,
    fiscalId: sale.customerFiscalId,
    dni: sale.customerIdNumber, 
  } 
  
  return postBill({ cartItems, customer });  
};

export const arcaService = {
  postBill,
  sendBill,
};
