import { Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource, EntityTarget } from 'typeorm';
import { User } from './user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials';
import { DuplicateUserException } from '../common/exceptions/custom.exception';
import { DatabaseErrorUtil } from '../common/utils/database-error.util';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersRespository extends Repository<User> {
  private readonly logger = new Logger(UsersRespository.name);

  constructor(private dataSource: DataSource) {
    super(User as EntityTarget<User>, dataSource.createEntityManager());
  }

  async createUser(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    const { username, password } = authCredentialsDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = this.create({ username, password: hashedPassword });

    try {
      const savedUser = await this.save(user);
      this.logger.debug(`User created successfully: ${username}`);
      return savedUser;
    } catch (error) {
      if (DatabaseErrorUtil.isUniqueConstraintError(error)) {
        this.logger.warn(`Duplicate user registration attempt: ${username}`);
        throw new DuplicateUserException(username);
      }
      this.logger.error(
        `Failed to create user: ${username}`,
        error instanceof Error ? error.stack : String(error),
      );
      DatabaseErrorUtil.handleError(error, 'UsersRepository.createUser');
    }
  }
}
