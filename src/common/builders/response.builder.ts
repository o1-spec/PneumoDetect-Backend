import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseBuilder {
  buildSuccess<T>(data: T, message?: string) {
    return {
      success: true,
      message: message || 'Operation successful',
      data,
    };
  }

  buildPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number,
  ) {
    return {
      success: true,
      data,
      pagination: {
        total,
        page,
        pageSize,
        pages: Math.ceil(total / pageSize),
      },
    };
  }

  buildError(message: string, code?: string) {
    return {
      success: false,
      message,
      code: code || 'ERROR',
    };
  }
}
