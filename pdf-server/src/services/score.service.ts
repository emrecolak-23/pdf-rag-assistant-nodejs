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

    const pipeline = this.redis.redisClient.multi();
    pipeline.hIncrBy('llm_scores_values', llm, score);
    pipeline.hIncrBy('llm_scores_count', llm, 1);
    pipeline.hIncrBy('retriever_scores_values', retriever, score);
    pipeline.hIncrBy('retriever_scores_count', retriever, 1);
    pipeline.hIncrBy('memory_scores_values', memory, score);
    pipeline.hIncrBy('memory_scores_count', memory, 1);
    pipeline.exec();
  }

  async getScores(): Promise<ComponentScores> {
    const available: Record<string, Set<string>> = {
      llm: new Set(this.llmFactory.getAvailableOptions()),
      retriever: new Set(this.retrieverFactory.getAvailableOptions()),
      memory: new Set(this.memoryFactory.getAvailableOptions())
    };

    const componentScores: ComponentScores = { llm: {}, retriever: {}, memory: {} };

    for (const type of Object.keys(componentScores) as Array<keyof ComponentScores>) {
      const values = await this.redis.redisClient.hGetAll(`${type}_scores_values`);
      const counts = await this.redis.redisClient.hGetAll(`${type}_scores_count`);

      for (const name of Object.keys(values)) {
        if (!available[type].has(name)) continue;
        const totalCount = parseInt(counts[name] || '0', 10);
        componentScores[type][name] = totalCount > 0 ? parseFloat(values[name] || '0') / totalCount : 0;
      }
    }

    return componentScores;
  }
}
