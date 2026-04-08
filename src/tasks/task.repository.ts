import { Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource, EntityTarget } from 'typeorm';
import { Task, TaskStatus } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { DatabaseErrorUtil } from '../common/utils/database-error.util';
import { User } from 'src/auth/user.entity';

@Injectable()
export class TaskRepository extends Repository<Task> {
  private readonly logger = new Logger(TaskRepository.name);

  constructor(private dataSource: DataSource) {
    super(Task as EntityTarget<Task>, dataSource.createEntityManager());
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;
    const task = this.create({
      title,
      description,
      status: TaskStatus.OPEN,
      user: user,
    });

    try {
      const savedTask = await this.save(task);
      this.logger.debug(`Task created successfully: ${savedTask.id}`);
      return savedTask;
    } catch (error) {
      this.logger.error(
        'Failed to create task',
        error instanceof Error ? error.stack : String(error),
      );
      DatabaseErrorUtil.handleError(error, 'TaskRepository.createTask');
    }
  }

  async getTasksByUser(
    filterDto: GetTasksFilterDto,
    user: User,
  ): Promise<Task[]> {
    const { status, search } = filterDto;

    try {
      const query = this.createQueryBuilder('task');
      query.where('task.userId = :userId', { userId: user.id });

      if (status) {
        query.andWhere('task.status = :status', { status });
      }

      if (search) {
        query.andWhere(
          '(LOWER(task.title) LIKE :search OR LOWER(task.description) LIKE :search)',
          { search: `%${search.toLowerCase()}%` },
        );
      }

      const tasks = await query.getMany();
      this.logger.debug(
        `Retrieved ${tasks.length} tasks for user ${user.username} with filters`,
      );
      return tasks;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve tasks for user: ${user.username}`,
        error instanceof Error ? error.stack : String(error),
      );
      DatabaseErrorUtil.handleError(error, 'TaskRepository.getTasksByUser');
    }
  }

  async getTasks(filterDto: GetTasksFilterDto): Promise<Task[]> {
    const { status, search } = filterDto;

    try {
      const query = this.createQueryBuilder('task');

      if (status) {
        query.andWhere('task.status = :status', { status });
      }

      if (search) {
        query.andWhere(
          '(LOWER(task.title) LIKE :search OR LOWER(task.description) LIKE :search)',
          { search: `%${search.toLowerCase()}%` },
        );
      }

      const tasks = await query.getMany();
      this.logger.debug(`Retrieved ${tasks.length} tasks with filters`);
      return tasks;
    } catch (error) {
      this.logger.error(
        'Failed to retrieve tasks',
        error instanceof Error ? error.stack : String(error),
      );
      DatabaseErrorUtil.handleError(error, 'TaskRepository.getTasks');
    }
  }
}
