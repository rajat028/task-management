import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationException } from '../exceptions/custom.exception';

export const ValidateInput = createParamDecorator(
  async (dto: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request.body;

    const dtoInstance = plainToClass(dto, body);
    const errors = await validate(dtoInstance);

    if (errors.length > 0) {
      const errorMap = errors.reduce(
        (acc, error: ValidationError) => {
          acc[error.property] = Object.values(error.constraints || {});
          return acc;
        },
        {} as Record<string, string[]>,
      );

      throw new ValidationException('Input validation failed', errorMap);
    }

    return dtoInstance;
  },
);
