import { Test, TestingModule } from '@nestjs/testing';
import { ChatgptPoolService } from './chatgpt-pool.service';

describe('ChatgptPoolService', () => {
  let service: ChatgptPoolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatgptPoolService],
    }).compile();

    service = module.get<ChatgptPoolService>(ChatgptPoolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
