import { injectable, singleton } from 'tsyringe';
import { Redis } from '@pdf/loaders/redis';

export type ComponentScores = Record<string, Record<string, number>>;

@injectable()
@singleton()
export class ScoreService {
  constructor(private readonly redis: Redis) {}

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
    const aggregate = async (valuesKey: string, countKey: string) => {
      const values = await this.redis.redisClient.hGetAll(valuesKey);
      const counts = await this.redis.redisClient.hGetAll(countKey);

      const result: Record<string, number> = {};
      for (const name of Object.keys(values)) {
        const totalScore = parseFloat(values[name] || '0');
        const totalCount = parseInt(counts[name] || '0', 10);
        result[name] = totalCount > 0 ? totalScore / totalCount : 0;
      }
      return result;
    };

    return {
      llm: await aggregate('llm_scores_values', 'llm_scores_count'),
      retriever: await aggregate('retriever_scores_values', 'retriever_scores_count'),
      memory: await aggregate('memory_scores_values', 'memory_scores_count')
    };
  }
}
