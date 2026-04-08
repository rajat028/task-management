import { DatabaseException } from '../exceptions/custom.exception';

export class DatabaseErrorUtil {
  static handleError(error: any, context: string): never {
    console.log(
      'DatabaseErrorUtil - Full error object:',
      JSON.stringify(error, null, 2),
    );

    if (error.code === '23505') {
      const match = error.detail?.match(/Key \((.*?)\)=/);
      const field = match ? match[1] : 'field';
      throw new DatabaseException(
        `Duplicate entry for ${field}. This ${field} already exists.`,
      );
    }

    if (error.code === '23503') {
      throw new DatabaseException(
        'Foreign key constraint violated. Referenced record does not exist.',
      );
    }

    if (error.code === '23502') {
      throw new DatabaseException(
        'Required field missing or null value provided.',
      );
    }

    if (error instanceof Error && error.message.includes('connection')) {
      throw new DatabaseException(
        'Database connection failed. Please try again later.',
      );
    }

    // Check for duplicate key errors in message
    if (error.message?.includes('duplicate key value')) {
      throw new DatabaseException(
        'Duplicate entry detected. This value already exists.',
      );
    }

    throw new DatabaseException(
      `Database operation failed in ${context}. ${error?.message || 'Unknown error'}`,
    );
  }

  static isUniqueConstraintError(error: any): boolean {
    return (
      error.code === '23505' || error.message?.includes('duplicate key value')
    );
  }

  static isForeignKeyError(error: any): boolean {
    return error.code === '23503';
  }
}
