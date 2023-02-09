import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ChatgptPoolService } from './chatgpt-pool/chatgpt-pool.service';
import { Cron } from '@nestjs/schedule';
import { AppConfig } from 'src/configs/config.interface';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class ChatgptService {
  logger = new Logger('ChatgptService');
  enableMessageRecord = false;
  constructor(
    private prismaService: PrismaService,
    private chatgptPoolService: ChatgptPoolService,
    private configService: ConfigService
  ) {
    const { enableMessageRecord } =
      this.configService.get<AppConfig>('appConfig');
    this.enableMessageRecord = enableMessageRecord;
    (async () => {
      await this.stopAllChatGPTInstances();
      await this.startAllDownAccount();
    })();
  }
  async createChatGPTAccount(account: {
    email: string;
    password: string;
    isGoogleLogin?: boolean;
    isMicrosoftLogin?: boolean;
  }) {
    return this.prismaService.chatGPTAccount.create({
      data: account,
    });
  }
  async deleteChatGPTAccount(email: string) {
    this.chatgptPoolService.deleteChatGPTInstanceByEmail(email);
    return this.prismaService.chatGPTAccount.delete({
      where: { email },
    });
  }
  async updateChatGPTAccount(
    email: string,
    account: {
      email: string;
      password: string;
      isGoogleLogin?: boolean;
      isMicrosoftLogin?: boolean;
      // User can only stop the chatgpt account
      status?: 'Stopped';
    }
  ) {
    this.chatgptPoolService.deleteChatGPTInstanceByEmail(email);
    const chatgptAccount = await this.prismaService.chatGPTAccount.update({
      where: { email },
      data: { ...account, status: 'Down' },
    });
    if (account.status === 'Stopped') {
      return this.prismaService.chatGPTAccount.update({
        where: { email },
        data: { status: 'Stopped' },
      });
    }
    // TODO: add queue support
    this.chatgptPoolService.initChatGPTInstance(account);
    return chatgptAccount;
  }
  async getChatGPTAccount(email: string) {
    const chatGPTAccount = await this.prismaService.chatGPTAccount.findUnique({
      where: { email },
      select: {
        email: true,
        isGoogleLogin: true,
        isMicrosoftLogin: true,
        status: true,
      },
    });
    return chatGPTAccount;
  }
  async getAllChatGPT() {
    return this.prismaService.chatGPTAccount.findMany({
      select: {
        email: true,
        isGoogleLogin: true,
        isMicrosoftLogin: true,
        status: true,
      },
    });
  }
  async getCurrentActiveChatGPT() {
    const account = await this.prismaService.chatGPTAccount.findMany({
      where: { status: 'Running' },
      select: {
        email: true,
      },
    });
    const email = account[Math.floor(Math.random() * account.length)].email;
    return email;
  }
  // Send Chatgpt Message via ChatgptPoolService
  async sendChatGPTMessage(
    message: string,
    opts?: {
      sessionId?: string;
      tenantId: string;
    }
  ) {
    let email: string;
    const { sessionId, tenantId } = opts;
    const conversation = await this.prismaService.chatGPTConversation.findFirst(
      {
        where: { sessionId, tenantId },
      }
    );
    if (!conversation) {
      email = await this.getCurrentActiveChatGPT();
    } else {
      email = conversation.email;
    }
    // Send Message
    this.logger.debug(`Send message to ${email}: ${message}`);
    try {
      const messageResult = await this.chatgptPoolService.sendMessage(message, {
        email: email,
        conversationId: conversation?.conversationId,
        parentMessageId: conversation?.messageId,
      });
      if (!messageResult) {
        this.logger.error(`Send message to ${email} failed`);
        return {
          conversationId: null,
          messageId: null,
          message: null,
        };
      }
      // Save conversation info
      await this.prismaService.chatGPTConversation.upsert({
        where: { tenantId_sessionId: { sessionId, tenantId } },
        create: {
          sessionId,
          email,
          conversationId: messageResult.conversationId,
          messageId: messageResult.messageId,
          tenantId,
        },
        update: {
          email,
          conversationId: messageResult.conversationId,
          messageId: messageResult.messageId,
        },
      });
      if (this.enableMessageRecord) {
        await this.recordChatGPTMessage({
          message,
          chatGPTResponse: messageResult,
        });
      }
      return messageResult;
    } catch (e) {
      // Update Email status
      await this.chatGPTExceptionHandle({
        email,
        exception: e,
      });
      throw e;
    }
  }
  async sendChatGPTMessageOnetime(message: string) {
    const email = await this.getCurrentActiveChatGPT();
    this.logger.debug(`Send message to ${email}: ${message}`);
    try {
      const messageResult = await this.chatgptPoolService.sendMessage(message, {
        email: email,
      });
      if (!messageResult) {
        this.logger.error(`Send message to ${email} failed`);
        return {
          conversationId: null,
          messageId: null,
          message: null,
        };
      }
      if (this.enableMessageRecord) {
        await this.recordChatGPTMessage({
          message,
          chatGPTResponse: messageResult,
        });
      }
      return messageResult;
    } catch (e) {
      // Update Email status
      await this.chatGPTExceptionHandle({
        email,
        exception: e,
      });
      throw e;
    }
  }
  async recordChatGPTMessage({
    message,
    chatGPTResponse,
  }: {
    message: string;
    chatGPTResponse: {
      response: string;
      conversationId: string;
      messageId: string;
    };
  }) {
    const { response, conversationId, messageId } = chatGPTResponse;
    try {
      await this.prismaService.chatGPTMessageResult.create({
        data: {
          message,
          response,
          conversationId,
          messageId,
        },
      });
    } catch (e) {
      this.logger.error(`Record message failed: ${e}`);
    }
  }
  async startChatgptInstance(email: string) {
    // As Lock
    const account = await this.prismaService.chatGPTAccount.findFirst({
      where: { AND: [{ email }, { status: 'Down' }] },
    });
    if (!account) {
      this.logger.error(`Account ${email} is not down`);
      return;
    }
    this.logger.debug(`Start account ${account.email}`);
    await this.prismaService.chatGPTAccount.update({
      where: { email: account.email },
      data: { status: 'Starting' },
    });
    try {
      await this.chatgptPoolService.initChatGPTInstance(account);
      await this.prismaService.chatGPTAccount.update({
        where: { email: account.email },
        data: { status: 'Running' },
      });
    } catch (err) {
      this.logger.error(`Error starting account ${account.email}: ${err}`);
      await this.prismaService.chatGPTAccount.update({
        where: { email: account.email },
        data: { status: 'Error' },
      });
    }
  }
  async stopAllChatGPTInstances() {
    this.logger.debug('Stop all chatgpt instances');
    const accounts = await this.prismaService.chatGPTAccount.findMany({
      where: {
        OR: [
          { status: 'Running' },
          {
            status: 'Starting',
          },
          {
            status: 'Error',
          },
          {
            status: 'Overload',
          },
        ],
      },
      select: {
        email: true,
      },
    });
    console.log(`Found ${accounts.length} running accounts`);
    for (const account of accounts) {
      this.chatgptPoolService.deleteChatGPTInstanceByEmail(account.email);
      await this.prismaService.chatGPTAccount.update({
        where: { email: account.email },
        data: { status: 'Down' },
      });
    }
    this.logger.debug(`Found ${accounts.length} running accounts`);
  }
  async resetSession(sessionId: string, tenantId: string) {
    this.logger.debug(`Reset conversation ${sessionId}`);
    const conversation = await this.prismaService.chatGPTConversation.delete({
      where: {
        tenantId_sessionId: { sessionId, tenantId },
      },
    });
    if (!conversation) {
      this.logger.error(`Conversation ${sessionId} not found`);
      return {};
    } else {
      this.logger.debug(`Conversation ${sessionId} deleted`);
      return conversation;
    }
  }
  @Cron('1 * * * * *')
  async startAllDownAccount() {
    this.logger.debug('Start all down account');
    const accounts = await this.prismaService.chatGPTAccount.findMany({
      where: { status: 'Down' },
      select: {
        email: true,
      },
      take: 1,
    });
    this.logger.debug(`Found ${accounts.length} down accounts`);
    for (const account of accounts) {
      await this.startChatgptInstance(account.email);
    }
  }
  // Update account status to Running
  @Cron('1 * * * * *')
  async heartbeat() {
    const emails = Array.from(this.chatgptPoolService.accounts);
    // update db account status
    this.logger.debug(`Update account status: ${emails}`);
    // Update For updatetime
    await this.prismaService.chatGPTAccount.updateMany({
      where: { email: { in: emails }, status: 'Running' },
      data: { updatedAt: new Date(), status: 'Running' },
    });
    // Update For overload 1h
    await this.prismaService.chatGPTAccount.updateMany({
      where: {
        email: { in: emails },
        status: 'Overload',
        updatedAt: { lt: new Date(new Date().getTime() - 1000 * 60 * 60) },
      },
      data: { updatedAt: new Date(), status: 'Running' },
    });
  }
  async chatGPTExceptionHandle({
    exception,
    email,
  }: {
    exception: Error & {
      statusCode: number;
      statusText: string;
    };
    email: string;
  }): Promise<void> {
    switch (true) {
      case exception.message.includes('Only one message at a time.'):
        this.logger.error(`Account ${email} is busy`);
        break;
      case exception.message.includes('1h'):
        this.logger.error(`Account ${email} is overload 1h`);
        break;
      case exception.statusCode === 429:
        // await this.prismaService.chatGPTAccount.update({
        //   where: { email },
        //   data: { status: 'Overload' },
        // });
        this.logger.error(`Account ${email} is busy`);
        break;
      default:
        this.logger.error(
          `Account ${email} is error, ${exception.message} ${exception.statusCode} ${exception.statusText}`
        );
        break;
    }
  }
}
