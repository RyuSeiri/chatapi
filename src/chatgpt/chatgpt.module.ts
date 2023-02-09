import { Module } from '@nestjs/common';
import { ChatgptService } from './chatgpt.service';
import { ChatgptController } from './chatgpt.controller';
import { ChatgptPoolService } from './chatgpt-pool/chatgpt-pool.service';

@Module({
  providers: [ChatgptService, ChatgptPoolService],
  controllers: [ChatgptController],
})
export class ChatgptModule {}
