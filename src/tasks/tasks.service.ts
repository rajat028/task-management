import { Injectable, Logger } from '@nestjs/common';
import { Task, TaskStatus } from './task.model';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskRepository } from './task.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import {
  TaskNotFoundException,
  DatabaseException,
} from '../common/exceptions/custom.exception';
import { DatabaseErrorUtil } from '../common/utils/database-error.util';
import { User } from 'src/auth/user.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private taskRepository: TaskRepository) {}

  async getTasks(filterDto: GetTasksFilterDto): Promise<Task[]> {
    try {
      return await this.taskRepository.getTasks(filterDto);
    } catch (error) {
      this.logger.error(
        'Failed to retrieve tasks',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async getTasksByUser(
    filterDto: GetTasksFilterDto,
    user: User,
  ): Promise<Task[]> {
    try {
      return await this.taskRepository.getTasksByUser(filterDto, user);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve tasks for user: ${user.username}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    try {
      const task = await this.taskRepository.createTask(createTaskDto, user);
      this.logger.log(`Task created: ${task.id}`);
      return task;
    } catch (error) {
      this.logger.error(
        'Failed to create task',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async getTaskById(id: string, user: User): Promise<Task> {
    try {
      const task = await this.taskRepository.findOne({ where: { id, user } });
      if (!task) {
        this.logger.warn(`Task not found: ${id}`);
        throw new TaskNotFoundException(id);
      }
      return task;
    } catch (error) {
      if (error instanceof TaskNotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to retrieve task: ${id} for user: ${user.username}`,
        error instanceof Error ? error.stack : String(error),
      );
      DatabaseErrorUtil.handleError(error, 'TasksService.getTaskById');
    }
  }

  async deleteTask(id: string, user: User): Promise<void> {
    try {
      await this.getTaskById(id, user);
      const result = await this.taskRepository.delete({ id, user });
      if (result.affected === 0) {
        this.logger.warn(
          `Failed to delete task: ${id} for user: ${user.username}`,
        );
        throw new TaskNotFoundException(id);
      }
      this.logger.log(`Task deleted: ${id} for user: ${user.username}`);
    } catch (error) {
      if (error instanceof TaskNotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete task: ${id} for user: ${user.username}`,
        error instanceof Error ? error.stack : String(error),
      );
      DatabaseErrorUtil.handleError(error, 'TasksService.deleteTask');
    }
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    try {
      const task = await this.getTaskById(id, user);
      task.status = status;
      const updatedTask = await this.taskRepository.save(task);
      this.logger.log(`Task status updated: ${id} to ${status}`);
      return updatedTask;
    } catch (error) {
      if (error instanceof TaskNotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to update task status: ${id} for user: ${user.username}`,
        error instanceof Error ? error.stack : String(error),
      );
      DatabaseErrorUtil.handleError(error, 'TasksService.updateTaskStatus');
    }
  }

  async updateTask(
    id: string,
    title: string,
    description: string,
    user: User,
  ): Promise<Task> {
    try {
      const task = await this.getTaskById(id, user);
      task.title = title;
      task.description = description;
      const updatedTask = await this.taskRepository.save(task);
      this.logger.log(`Task updated: ${id}`);
      return updatedTask;
    } catch (error) {
      if (error instanceof TaskNotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to update task: ${id} for user: ${user.username}`,
        error instanceof Error ? error.stack : String(error),
      );
      DatabaseErrorUtil.handleError(error, 'TasksService.updateTask');
    }
  }
}
