import Tables from '@/database/tables';

namespace TableTypes {
  export type TableName = (typeof Tables)[keyof typeof Tables];
}

export default TableTypes;
