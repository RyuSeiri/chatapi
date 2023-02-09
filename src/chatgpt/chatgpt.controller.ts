import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Put,
  Headers,
} from '@nestjs/common';
import { ChatgptService } from './chatgpt.service';
// TODO: Add Tennet support
const TENANT_ID = 'chatapi';
@Controller('chatgpt')
export class ChatgptController {
  constructor(private readonly chatgptService: ChatgptService) {}
  @Post('/account')
  async createChatgptAccount(@Body() createCatDto: any) {
    return this.chatgptService.createChatGPTAccount(createCatDto);
  }
  @Get('/account')
  async getChatgptAccount() {
    return await this.chatgptService.getAllChatGPT();
  }
  @Delete('/account/:email')
  async deleteChatgptAccount(@Param('email') id: string) {
    return await this.chatgptService.deleteChatGPTAccount(id);
  }
  @Put('/account/:email')
  async updateChatgptAccount(
    @Param('email') id: string,
    @Body() updateCatDto: any
  ) {
    return await this.chatgptService.updateChatGPTAccount(id, updateCatDto);
  }
  @Post('/sendMessage')
  async sendChatGPTMessage(
    @Headers() headers: Record<string, string>,
    @Body() messageDto: any
  ) {
    const tenantId = TENANT_ID;
    const { userId } = headers;
    const { message } = messageDto;
    return await this.chatgptService.sendChatGPTMessage(message, {
      tenantId,
      sessionId: userId,
    });
  }
  @Post('/message')
  async getChatGPTMessage(
    @Body() messageDto: any,
    @Headers() headers: Record<string, string>
  ) {
    const { message } = messageDto;
    return await this.chatgptService.sendChatGPTMessageOnetime(message);
  }
  @Post('/message/:sessionId')
  async getChatGPTMessageBySessionId(
    @Param('sessionId') sessionId: string,
    @Body() messageDto: any
  ) {
    const { message } = messageDto;
    return await this.chatgptService.sendChatGPTMessage(message, {
      tenantId: TENANT_ID,
      sessionId: sessionId,
    });
  }
  @Delete('/message/:sessionId')
  async deleteChatGPTMessage(@Param('sessionId') sessionId: string) {
    return await this.chatgptService.resetSession(sessionId, TENANT_ID);
  }
}
