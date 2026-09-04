import OpenAI from 'openai';

export default class OpenAiClient {
  private readonly openai: OpenAI;

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey ?? env.OPENAI_TOKEN ?? '',
    });
  }

  async embed({ input }: { input: string }): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input,
      encoding_format: 'float',
    });
    return response.data[0]?.embedding ?? [];
  }

  // Add more endpoint methods here as needed
}
