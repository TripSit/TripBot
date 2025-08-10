/* eslint-disable no-console */
import { createOpenRouter, LanguageModelV2Prompt, OpenRouterUsageAccounting } from '@openrouter/ai-sdk-provider';
import { ModelInfo } from '../aiTypes';

const F = f(__filename);

export class OpenRouterClient {
  static async chat({
    prompt,
    model = 'google/gemini-2.0-flash-001',
    max_tokens = 1000,
  }: {
    prompt: LanguageModelV2Prompt;
    model?: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  }): Promise<{ content: string; reasoning: string | undefined; usage: OpenRouterUsageAccounting | undefined }> {
    const provider = createOpenRouter({
      apiKey: env.OPENROUTER_KEY ?? '',
      baseURL: 'https://openrouter.ai/api/v1',
      compatibility: 'strict',
    });

    const chatModel = provider.chat(model, {
      usage: {
        include: true,
      },
    });

    try {
      const result = await chatModel.doGenerate({
        prompt,
        maxOutputTokens: max_tokens,
        temperature: 1.5,
        topP: 1,
        presencePenalty: 0,
        frequencyPenalty: 0,
      });

      const textParts = result.content.filter(p => p.type === 'text') as Array<{
        type: 'text';
        text: string;
      }>;
      const content = textParts.map(p => p.text).join('') || 'No response';

      const reasoningPart = result.content.find(p => p.type === 'reasoning') as
        | { type: 'reasoning'; text: string }
        | undefined;

      return { content, reasoning: reasoningPart?.text, usage: result.providerMetadata?.openrouter.usage };
    } catch (error) {
      log.error(F, `error: ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
  }
}

export async function getModels(): Promise<void> {
  console.log('Getting models');
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    method: 'GET',

    headers: {},
  });

  const body = (await response.json()) as { data: ModelInfo[] };

  // Print a list of model IDs and their cost per token, sorted by most expensive to cheapest
  const sortedModels = body.data.toSorted((a, b) => {
    const aCost = parseFloat(a.pricing.prompt) + parseFloat(a.pricing.completion);
    const bCost = parseFloat(b.pricing.prompt) + parseFloat(b.pricing.completion);
    return bCost - aCost;
  });

  // Print the google models and their cost per token, sorted by most expensive to cheapest
  const googleModels = sortedModels.filter(model => model.id.includes('google'));
  console.log(
    JSON.stringify(
      googleModels.map(model => ({
        id: model.id,
        cost: model.pricing.prompt + model.pricing.completion,
      })),
      null,
      2,
    ),
  );
}
