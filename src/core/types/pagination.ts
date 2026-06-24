import type PaginationTypes from '@/core/types/pagination.types';

const buildPagination = (
  params: PaginationTypes.PaginationParams,
  total: number,
): PaginationTypes.PaginatedResult<never>['pagination'] => ({
  page: params.page,
  limit: params.limit,
  total,
  totalPages: Math.ceil(total / params.limit) || 0,
});

export default { buildPagination };
