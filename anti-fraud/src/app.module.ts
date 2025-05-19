import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KafkaService } from './services/kafka.service';
import { AntiFraudService } from './services/anti-fraud.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, KafkaService, AntiFraudService],
})
export class AppModule {}
