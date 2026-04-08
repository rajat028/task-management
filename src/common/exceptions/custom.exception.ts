import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export class DuplicateUserException extends ConflictException {
  constructor(username: string) {
    super(`User with username "${username}" already exists`);
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid username or password');
  }
}

export class TaskNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Task with ID "${id}" not found`);
  }
}

export class DatabaseException extends InternalServerErrorException {
  constructor(message: string = 'Database operation failed') {
    super(message);
  }
}

export class ValidationException extends BadRequestException {
  constructor(
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export class UnexpectedException extends InternalServerErrorException {
  constructor(message: string = 'An unexpected error occurred') {
    super(message);
  }
}
