import { inject, injectable, singleton } from 'tsyringe';
import { Redis } from '@pdf/loaders/redis';
import { LLMFactory } from '@pdf/strategies/llm/llm.factory';
import { MemoryFactory } from '@pdf/strategies/memory/memory.factory';
import { RetrieverFactory } from '@pdf/strategies/retriever/retriever.factory';

export type ComponentScores = Record<string, Record<string, number>>;

@injectable()
@singleton()
export class ScoreService {
  constructor(
    private readonly redis: Redis,
    @inject(LLMFactory) private readonly llmFactory: LLMFactory,
    @inject(MemoryFactory) private readonly memoryFactory: MemoryFactory,
    @inject(RetrieverFactory) private readonly retrieverFactory: RetrieverFactory
  ) {}

  recordScore(score: number, llm: string, retriever: string, memory: string): void {
    score = Math.min(Math.max(score, 0), 1);

    this.redis.redisClient.hIncrBy('llm_scores_values', llm, score);
    this.redis.redisClient.hIncrBy('llm_scores_count', llm, 1);
    this.redis.redisClient.hIncrBy('retriever_scores_values', retriever, score);
    this.redis.redisClient.hIncrBy('retriever_scores_count', retriever, 1);
    this.redis.redisClient.hIncrBy('memory_scores_values', memory, score);
    this.redis.redisClient.hIncrBy('memory_scores_count', memory, 1);
  }

  async getScores(): Promise<ComponentScores> {
    const availableLlms = new Set(this.llmFactory.getAvailableOptions());
    const availableMemories = new Set(this.memoryFactory.getAvailableOptions());
    const availableRetrievers = new Set(this.retrieverFactory.getAvailableOptions());

    const aggregate = async (
      valuesKey: string,
      countKey: string,
      allowedNames: Set<string>
    ) => {
      const values = await this.redis.redisClient.hGetAll(valuesKey);
      const counts = await this.redis.redisClient.hGetAll(countKey);

      const result: Record<string, number> = {};
      for (const name of Object.keys(values)) {
        if (!allowedNames.has(name)) continue;
        const totalScore = parseFloat(values[name] || '0');
        const totalCount = parseInt(counts[name] || '0', 10);
        result[name] = totalCount > 0 ? totalScore / totalCount : 0;
      }
      return result;
    };

    return {
      llm: await aggregate('llm_scores_values', 'llm_scores_count', availableLlms),
      retriever: await aggregate(
        'retriever_scores_values',
        'retriever_scores_count',
        availableRetrievers
      ),
      memory: await aggregate('memory_scores_values', 'memory_scores_count', availableMemories)
    };
  }
}
