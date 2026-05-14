import { TicketInfo } from "../../models";

let SystemReceiptPrinter = require("@point-of-sale/system-receipt-printer");
let ReceiptPrinterEncoder = require("@point-of-sale/receipt-printer-encoder");

const receiptPrinter = new SystemReceiptPrinter({
  name: "POS58",
});
let encoder = new ReceiptPrinterEncoder();

const zeroPad = (num: number | string, places: number) =>
  String(num).padStart(places, "0");

export const formatDateToHours = (dateString: string) => {
  const date = new Date(dateString);

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};
export class PrinterService {
  async printTicket(ticket: TicketInfo) {
    const fecha = ticket.date.toLocaleDateString("es-ES");
    const hora = formatDateToHours(ticket.date.toISOString());
    const nroVenta = ticket.arcaData ? `${zeroPad(ticket.arcaData.ptoVenta, 3)}-${zeroPad(
      ticket.arcaData.nroVenta,
      8
    )}` : '';

    const printer = new SystemReceiptPrinter({
      name: "POS58",
    });

    printer.addEventListener("connected", async () => {
      console.log("Connected to printer");

      encoder
        .newline()
        .width(1)
        .line(" ------------------------------ ")
        .height(2)
        .text("Don Mario - Cnel. Vidal")
        .newline()
        .newline()
        .width(1)
        .height(1)
        .line("Ibáñez Narela Yazmín")
        .line("CUIT nro 27-37561406-0")
        .line("Ingresos brutos 27-37561406-0")
        .line("Sarmiento 106 Cnel. Vidal (7174) - Bs As")
        .line("Inicio de Act.: 01/05/2023")
        .line("IVA Responsable inscripto")
        .size("normal")
        .newline()
        .line("--------------------------------")
        .newline()
        .newline();

      switch (ticket.customer.category) {
        case "Responsable Inscripto":
        case "Monotributista":
          encoder
            .line("Tique FACTURA A")
            .line(`Nro venta ${nroVenta}`)
            .line(`Fecha: ${fecha} Hora: ${hora}`)
            .newline()
            .text(`Cliente: ${ticket.customer.name}`)
            .newline()
            .text(`CUIT: ${ticket.customer.cuit}`)
            .newline()
            .text(`Categoria: ${ticket.customer.category}`)
            .newline()
            .line(" ------------------------------ ")
            .newline();
          break;
        case "Exento":
          encoder
            .line("A EXENTO")
            .line(`P.V. Nro: ${zeroPad(process.env.PtoVta as string, 3)}`)
            .line(`Nro. T. ${ticket.customer.cuit}`)
            .newline()
            .line(`Fecha: ${fecha} Hora: ${hora}`)
            .newline()
            .line(" ------------------------------ ")
            .newline();
          break;
        case "Consumidor Final":
          encoder
            .line("A CONSUMIDOR FINAL")
            .line(`P.V. Nro: ${zeroPad(process.env.PtoVta as string, 3)}`)
            .line(`Nro. T. ${ticket.customer.cuit}`)
            .newline()
            .line(`Fecha: ${fecha} Hora: ${hora}`)
            .newline()
            .line(" ------------------------------ ")
            .newline();
          break;
        default:
          break;
      }

      const LINE_WIDTH = 32;
      const COL1 = 4; // Cant
      const COL3 = 4; // IVA
      const COL4 = 8; // Total
      const COL2 = LINE_WIDTH - (COL1 + COL3 + COL4 + 3);

      function padRight(str: string, len: number) {
        return str.length > len
          ? str.slice(0, len)
          : str + " ".repeat(len - str.length);
      }
      function padLeft(str: string, len: number) {
        return str.length > len
          ? str.slice(0, len)
          : " ".repeat(len - str.length) + str;
      }

      encoder
        .text(
          padRight("Cant", COL1) +
            " " +
            padRight("Descripción", COL2) +
            " " +
            padRight("IVA", COL3) +
            " " +
            padLeft("Total", COL4)
        )
        .line(" ------------------------------ ");

      ticket.items.forEach((item) => {
        const qty =
          item.qty % 1 === 0 ? item.qty.toString() : item.qty.toFixed(2);
        const desc = item.description;
        const iva = `${item.ivaPct}%`;
        const total = `$${item.total.toFixed(2)}`;

        encoder
          .text(
            padRight(qty, COL1) +
              " " +
              padRight(desc, COL2) +
              " " +
              padRight(iva, COL3) +
              " " +
              padLeft(total, COL4)
          )
          .newline();
      });
      const subtotal = ticket.items.reduce((s, i) => s + i.total, 0);
      const totalIva = ticket.totalIva;

      encoder
        .newline()
        .text(
          padRight("SUBTOTAL:", LINE_WIDTH - 12) +
            padLeft(`$${subtotal.toFixed(2)}`, 8)
        )
        .newline()
        .text(
          padRight("TOTAL IVA:", LINE_WIDTH - 12) +
            padLeft(`$${totalIva.toFixed(2)}`, 8)
        )
        .newline()
        .text(
          padRight("TOTAL:", LINE_WIDTH - 12) +
            padLeft(`$${subtotal.toFixed(2)}`, 8)
        )
        .newline();

      if (ticket.arcaData) 
        encoder.qrcode(`${ticket.arcaData.qrData}`).cut();

      await printer.print(encoder.encode());
      await printer.disconnect();
    });

    printer.addEventListener("disconnected", () => {
      console.log("Disconnected from printer");
    });

    printer.connect();
  }
}
