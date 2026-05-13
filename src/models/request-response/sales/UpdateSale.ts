export type UpdateSaleRequest = {
  id: string;
  arcaData: {
    afip: { CAE: string; CAEFchVto: string };
    ptoVenta: string;
    nroCbte: number;
    qrData: string;
  };
};

export type UpdateSaleResponse = {
  id: string;
};
