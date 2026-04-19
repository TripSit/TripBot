import { OpenRouterModelsResponse } from '@discord/utils/ai';

async function getOpenRouterModels() {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
  });

  // Always check for HTTP errors before parsing
  if (!response.ok) {
    throw new Error(`OpenRouter API failed with status: ${response.status}`);
  }

  // Extract the JSON and cast it to your new type
  const result = (await response.json()) as OpenRouterModelsResponse;

  // Filter down to the multimodal models
  let models = result.data.filter(model => {
    const arch = model.architecture;

    // Some models might not have an architecture block defined
    if (!arch) return false;

    // Safely check the arrays using optional chaining
    const acceptsText = arch.input_modalities?.includes('text');
    const acceptsImage = arch.input_modalities?.includes('image');
    const outputsText = arch.output_modalities?.includes('text');
    // const outputsImage = arch.output_modalities?.includes('image');

    // Only return true if it meets all three criteria
    return acceptsText && acceptsImage && outputsText;
  });

  // Filter only google models
  // models = models.filter(model => model.id.startsWith('google/'));

  // Filter only free models
  models = models.filter(model => model.id.includes(':free'));

  console.log(`\n✅ Found ${models.length} text+image -> text+image models:\n`);

  // Sort by cost
  models.sort((a, b) => {
    const costA = +a.pricing.prompt || 0;
    const costB = +b.pricing.prompt || 0;
    return costA - costB;
  });

  // Print them out nicely
  models.forEach(model => {
    console.log(`• ID: ${model.id}`);
    console.log(`  Name: ${model.name}`);
    console.log(`  Modality string: ${model.architecture?.modality}\n`);
    console.log(`  Prompt cost: $${model.pricing.prompt} per 1K tokens`);
  });

  // log.debug(F, `Response: ${JSON.stringify(result, null, 2)}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // The models are returned inside the 'data' array
  return result.data;
}

if (require.main === module) {
  (async () => {
    try {
      await getOpenRouterModels();
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
    }
  })();
}
