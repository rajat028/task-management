import { Injectable, Logger } from '@nestjs/common';
import { UsersRespository } from './users.repository';
import { AuthCredentialsDto } from './dto/auth-credentials';
import { User } from './user.entity';
import {
  InvalidCredentialsException,
  UnexpectedException,
} from '../common/exceptions/custom.exception';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersRepository: UsersRespository,
    private jwtService: JwtService,
  ) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    try {
      const user = await this.usersRepository.createUser(authCredentialsDto);
      this.logger.log(`User signed up successfully: ${user.username}`);
      return user;
    } catch (error) {
      if (error instanceof Error && error.name !== 'HttpException') {
        this.logger.error(
          'Sign up process failed',
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }
      throw error;
    }
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const { username, password } = authCredentialsDto;
    try {
      const user = await this.usersRepository.findOne({ where: { username } });
      if (user && (await bcrypt.compare(password, user.password))) {
        const payload: JwtPayload = { username };
        const accessToken = this.jwtService.sign(payload);
        return { accessToken };
      } else {
        this.logger.warn(`Invalid credentials for user: ${username}`);
        throw new InvalidCredentialsException();
      }
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        throw error;
      }
      this.logger.error(
        'Sign in process failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw new UnexpectedException('Sign in failed');
    }
  }
}
