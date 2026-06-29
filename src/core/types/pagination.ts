import type {
  PaginatedResult,
  PaginationParams,
} from '@/core/types/pagination.types';

const buildPagination = (
  params: PaginationParams,
  total: number,
): PaginatedResult<never>['pagination'] => ({
  page: params.page,
  limit: params.limit,
  total,
  totalPages: Math.ceil(total / params.limit) || 0,
});

export default { buildPagination };
