import { Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Client, logger } from 'camunda-external-task-client-js';

const config = { baseUrl: 'https://caa5-2408-8340-1420-f1a0-6191-5b1c-df69-6348.ngrok-free.app/engine-rest', use: logger, asyncResponseTimeout: 10000 };
const client = new Client(config);

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  configure(consumer) {
    console.log(1)
    client.subscribe('payment-retrieval', async function ({ task, taskService }) {
      // Put your business logic here
      console.log(666)
      // Get a process variable
      const amount = task.variables.get('amount');
      const item = task.variables.get('item');

      console.log(`Charging credit card with an amount of ${amount}€ for the item '${item}'...`);



      // Complete the task
      await taskService.complete(task);
    });
  }
}
