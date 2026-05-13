export const adaptGetSalesSummary = (response: any) => {
    return response.map((row: any) => {
        return {
            sector: row.category,
            total: row.sales_count,
        };
    });
}