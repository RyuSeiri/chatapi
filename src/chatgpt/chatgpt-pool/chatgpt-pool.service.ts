import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import type { SendMessageOptions, ChatGPTAPIBrowser } from 'chatgpt';
import type { ChatgptConfig } from 'src/configs/config.interface';
import retry from 'async-retry';
@Injectable()
export class ChatgptPoolService {
  chatgptConfig: ChatgptConfig;
  chatgptPool: Map<string, ChatGPTAPIBrowser> = new Map();
  // Record the conversation between user email
  logger = new Logger('ChatgptPoolService');
  lockMap: Map<string, boolean> = new Map();
  constructor(private configService: ConfigService) {
    this.chatgptConfig = this.configService.get<ChatgptConfig>('chatgpt');
  }
  // Create new Chatgpt instance
  async initChatGPTInstance(opts: {
    email: string;
    password: string;
    debug?: boolean;
    isGoogleLogin?: boolean;
    isMicrosoftLogin?: boolean;
  }) {
    if (this.chatgptPool.has(opts.email)) {
      return;
    }
    const { ChatGPTAPIBrowser } = await import('chatgpt');
    const chatgpt = new ChatGPTAPIBrowser({
      ...opts,
      ...this.chatgptConfig,
      userDataDir: this.chatgptConfig.userDataDir
        ? `${this.chatgptConfig.userDataDir}/${opts.email}`
        : undefined,
    });
    await retry(
      async (_: any, num: number) => {
        try {
          await chatgpt.initSession();
          return chatgpt;
        } catch (e) {
          this.logger.error(
            `ChatGPT ${opts.email} initSession error: ${e.message}, retry ${num} times`
          );
          chatgpt.closeSession();
          this.logger.debug(e.stack);
          throw e;
        }
      },
      {
        retries: 3,
      }
    );
    this.chatgptPool.set(opts.email, chatgpt);
    return chatgpt;
  }
  get accounts() {
    return this.chatgptPool.keys();
  }
  get poolIsEmpty() {
    return this.chatgptPool.size === 0;
  }
  getChatGPTInstanceByEmail(email?: string) {
    if (!email) {
      return;
    }
    return this.chatgptPool.get(email);
  }
  deleteChatGPTInstanceByEmail(email: string) {
    return this.chatgptPool.delete(email);
  }
  refreshChatGPTInstanceByEmail(email: string) {
    const chatgpt = this.chatgptPool.get(email);
    if (chatgpt) {
      chatgpt.refreshSession();
    }
  }
  async lockSendMessage(email: string) {
    // try get lock
    const lockMap = this.lockMap;
    if (lockMap.has(email)) {
      // try await 30s
      for (let i = 0; i < 30; i++) {
        if (!lockMap.has(email)) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      if (lockMap.has(email)) {
        throw new Error('Too many requests');
      }
    }
    lockMap.set(email, true);
    const locker = setTimeout(() => {
      lockMap.delete(email);
    }, 30000);
    function unlock() {
      clearTimeout(locker);
      lockMap.delete(email);
    }
    return {
      locker,
      unlock,
    };
  }
  async sendMessage(
    message: string,
    options?: SendMessageOptions & { email?: string }
  ) {
    const { unlock } = await this.lockSendMessage(options.email);
    const chatGPT = this.getChatGPTInstanceByEmail(options.email);
    if (!chatGPT) {
      const error = new Error('ChatGPT instance not found');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      error.statusCode = 404;
      unlock();
      throw error;
    }
    const response = await chatGPT.sendMessage(message, options);
    unlock();
    // Unlock
    return response;
  }
}
