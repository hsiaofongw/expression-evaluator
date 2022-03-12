import { Body, Controller, Ip, Logger, Post } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { PublicInputObjectDto } from 'src/dtos/input-output-dto';

@Controller('evaluate')
export class EvaluateController {
  private readonly logger = new Logger(EvaluateController.name);

  constructor(private appService: AppService) {}

  @Post()
  evaluate(@Body() exprIn: PublicInputObjectDto, @Ip() ip: string) {
    this.logger.log(
      `Expr Evaluation Request, ip: ${ip}, input: ${JSON.stringify(exprIn)}`,
    );
    return this.appService.evaluate(exprIn);
  }
}
