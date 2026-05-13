export { ISalesRepository } from './ISalesRepository.interface';
export { SalesRepository as MySQLSalesRepository } from './mysql/SalesRepository';
export { SalesRepository as PostgreSQLSalesRepository } from './postgresql/SalesRepository';

// Re-export as default based on database type for backwards compatibility
import { databaseType } from '../../config/db';
import { SalesRepository as MySQLSalesRepository } from './mysql/SalesRepository';
import { SalesRepository as PostgreSQLSalesRepository } from './postgresql/SalesRepository';

const SalesRepository = databaseType === 'postgresql' ? PostgreSQLSalesRepository : MySQLSalesRepository;
export { SalesRepository };
export default SalesRepository;
