import { Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { Client, logger } from 'camunda-external-task-client-js';
// 8
import * as ZB from 'zeebe-node';

// const config = { baseUrl: 'https://caa5-2408-8340-1420-f1a0-6191-5b1c-df69-6348.ngrok-free.app/engine-rest', use: logger, asyncResponseTimeout: 10000 };
// const client = new Client(config);

// 8
const zbc = new ZB.ZBClient({
  camundaCloud: {
    clusterId: 'd748db5f-f16e-4e50-9f85-c38423a8b8e0',
    clientId: 'hElxlz4k5mDNhbdCCTLWPpQ2ko8XEbBH',
    clientSecret: 'OQE24Q93o-BTYkfdg79QB.-Iyd_RAZoOkTcbxI4KyLe8Bie4kfbd98P52e~pN~Rt',
  },
  onReady: () => console.log('Connected'),
  onConnectionError() {
    console.log('Disconnected')
  },
});
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  configure(consumer) {
    // client.subscribe('payment-retrieval', async function ({ task, taskService }) {
    //   // Put your business logic here
    //   console.log(666)
    //   // Get a process variable
    //   const amount = task.variables.get('amount');
    //   const item = task.variables.get('item');
    //   console.log(`Charging credit card with an amount of ${amount}€ for the item '${item}'...`);
    //   // Complete the task
    //   await taskService.complete(task);
    // });

    // 8 
    const worker = zbc.createWorker({
      // Define the task type that this worker will process
      taskType: 'get-customer-record',
      // Define the task handler to process incoming jobs
      taskHandler: job => {
        // Log the job variables for debugging purposes
        console.log(job.variables);

        // Check if the customerId variable is missing and return an error if so
        if (!job.variables.customerId) {
          return job.error('NO_CUSTID', 'Missing customerId in process variables');
        }

        // Add logic to retrieve the customer record from the database here
        // ...

        // Complete the job with the 'customerRecordExists' variable set to true
        return job.complete({
          customerRecordExists: true
        });
      }
    });
  }
}
