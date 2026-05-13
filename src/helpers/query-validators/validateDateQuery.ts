export const validateDatesQuery = (params: {
  startDate: string;
  endDate: string;
}) => { 
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  
  if (params.startDate) {
    startDate = new Date(params.startDate);
    if (isNaN(startDate.getTime())) {
      throw new Error('El formato de la fecha de inicio no es válido');
    }
  }

  if (params.endDate) {
    endDate = new Date(params.endDate);
    if (isNaN(endDate.getTime())) {
      throw new Error('El formato de la fecha de fin no es válido');
    }
  }
  
  if (startDate && endDate && startDate > endDate) {
    throw new Error('La fecha de inicio no puede ser posterior a la de fin');
  }

  return {
    startDate: startDate,
    endDate: endDate
  };
};
