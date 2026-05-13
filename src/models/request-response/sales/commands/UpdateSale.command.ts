export interface UpdateSaleCommand {
  id: string;
  arcaData: {
    afip: { CAE: string; CAEFchVto: string };
    ptoVenta: string;
    nroCbte: number;
    qrData: string;
  };
}
