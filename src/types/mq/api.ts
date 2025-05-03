export interface PaginationQuery {
  pageNo: number
  pageSize: number
}

export interface PaginationResult<T> {
  pageNum: number
  pageSize: number
  total: number
  items: T[]
}

export interface QueryTimeRange {
  begin: number
  end: number
} 