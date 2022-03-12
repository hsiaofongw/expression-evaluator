import { Controller, Ip, Logger, Post } from '@nestjs/common';
import { AppService } from 'src/app.service';

@Controller('session')
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(private appService: AppService) {}

  @Post()
  createSession(@Ip() ip: string) {
    this.logger.log(`Session Creation Request, ip: ${ip}`);

    return this.appService.createSession();
  }
}
