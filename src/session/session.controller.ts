import { Controller, Post } from '@nestjs/common';
import { AppService } from 'src/app.service';

@Controller('session')
export class SessionController {
  constructor(private appService: AppService) {}

  @Post()
  createSession() {
    return { sessionId: this.appService.createSession() };
  }
}
