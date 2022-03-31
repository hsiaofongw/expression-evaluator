import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { stdin, stdout } from 'process';
import {
  ExpressionNodeSerialize,
  MinimalNodeSerialize,
} from './translate/serialize';
import { INestApplication } from '@nestjs/common';
import { Command } from 'commander';
import { Transform } from 'stream';
import { createReadStream } from 'fs';
import { PipelineFactoryService } from './pipeline/pipeline-factory.service';

/** 入口函数 */
async function bootstrap() {
  const program = new Command();

  program.name('node dist/main').description('表达式求值器').version('2.0.0');

  program
    .command('evaluate <expr>')
    .description('对一个表达式求值，并且将求值结果序列化之后打印到标准输出。')
    .action(async (exprString: string) => {
      const app = await NestFactory.create(AppModule, { logger: false });
      const pipeline = app.get(PipelineFactoryService).makeEvaluatePipeline();
      const miminalSerialize = new MinimalNodeSerialize();
      pipeline.output.pipe(miminalSerialize).pipe(stdout);
      pipeline.input.write(exprString);
      pipeline.input.write('\n'); // 刷新一下缓冲区
    });

  program
    .command('run <scriptFileName>')
    .description('执行一个脚本文件，并且将求值结果（如果有）打印到标准输出。')
    .action(async (scriptFileName: string) => {
      const app = await NestFactory.create(AppModule, { logger: false });

      const evaluatePipeline = app
        .get(PipelineFactoryService)
        .makeEvaluatePipeline();
      const miminalSerialize = new MinimalNodeSerialize();

      evaluatePipeline.output.pipe(miminalSerialize).pipe(stdout);

      createReadStream(scriptFileName, { encoding: 'utf-8' }).pipe(
        evaluatePipeline.input,
      );
    });

  program
    .command('repl', { isDefault: true })
    .description('启动一个 REPL 你问一句我答一句交互环境')
    .action(async () => {
      const app = await NestFactory.create(AppModule);
      console.clear();
      startREPL(app);
    });

  program
    .command('server')
    .description('启动一个 Server 实例')
    .option('-p, --port <portNumber>', '指定端口号', '3000')
    .action(async (str: { port: string }) => {
      const app = await NestFactory.create(AppModule);
      const portNum = parseInt(str.port, 10);
      app.enableCors();
      await app.listen(portNum);
    });

  program.parse();
}
bootstrap();

/** 开始 REPL */
async function startREPL(app: INestApplication) {
  const evaluatePipeLineTerminals = app
    .get(PipelineFactoryService)
    .makeEvaluatePipeline();

  const serialize = new ExpressionNodeSerialize();

  // 将输出连接到标准序列化 Transform 实例, 再将序列化的输出连接到标准输出
  evaluatePipeLineTerminals.output.pipe(serialize).pipe(stdout);

  // 将标准输入连接到求值管线的入口端
  stdin
    .pipe(
      new Transform({
        objectMode: true,
        transform(chunk: Buffer, encoding, cb) {
          this.push(chunk.toString('utf-8'));
          cb();
        },
      }),
    )
    .pipe(evaluatePipeLineTerminals.input);

  // 提示用户可以开始输入了
  const currentSeqNum = 0;
  const promptContentFn = (seqNum: number) => `In[${seqNum}]:= `;
  stdout.write(promptContentFn(currentSeqNum));
}
