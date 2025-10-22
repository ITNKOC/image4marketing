import { delay } from './utils';

interface GenerateImagesParams {
  imageUrl: string;
  stylePrompt?: string;
}

interface GeneratedImageResult {
  id: string;
  url: string;
  prompt: string;
}

/**
 * AI Client - Supporte plusieurs providers (NanoBanana, Replicate, Stability AI)
 * S'active automatiquement si AI_API_KEY n'est pas défini (mode MOCK)
 */
export async function generateImages(
  params: GenerateImagesParams
): Promise<GeneratedImageResult[]> {
  const hasApiKey = process.env.AI_API_KEY && process.env.AI_API_KEY.length > 0;

  if (!hasApiKey) {
    console.log('[AI Client] Mode MOCK activé - Génération d\'images factices');
    return generateMockImages(params);
  }

  const provider = process.env.AI_API_PROVIDER ?? 'replicate';
  console.log(`[AI Client] Utilisation du provider: ${provider}`);

  switch (provider) {
    case 'nanobanana':
      return generateWithNanoBanana(params);
    case 'replicate':
      return generateWithReplicate(params);
    case 'stability':
      return generateWithStabilityAI(params);
    default:
      console.warn(`[AI Client] Provider inconnu: ${provider}, fallback sur mock`);
      return generateMockImages(params);
  }
}

/**
 * Génère 4 images mockées avec des URLs Unsplash
 */
async function generateMockImages(
  params: GenerateImagesParams
): Promise<GeneratedImageResult[]> {
  // Simule un délai d'API
  await delay(1500);

  const basePrompt = `Professional food marketing photography, commercial quality, bright natural lighting, minimalist background, menu-ready presentation, photorealistic, 8K`;

  const variations = [
    'on elegant wooden table surface',
    'with modern monochrome background',
    'with fresh ingredients scattered artfully',
    'with restaurant ambiance blur background',
  ];

  // Images mockées de haute qualité (Unsplash food photography)
  const mockImageIds = [
    'Yn0l7uwBrpw', // Food on wooden table
    'jpkfc5_d-DI', // Food minimalist
    'N_Y88TWmGwA', // Food with ingredients
    'MQUqbmszGGM', // Food bokeh
  ];

  return variations.map((variation, index) => ({
    id: `mock-${Date.now()}-${index}`,
    url: `https://images.unsplash.com/photo-${mockImageIds[index]}?w=800&q=80`,
    prompt: `${basePrompt} ${variation}`,
  }));
}

/**
 * Génération via NanoBanana API
 */
async function generateWithNanoBanana(
  params: GenerateImagesParams
): Promise<GeneratedImageResult[]> {
  const basePrompt = buildBasePrompt(params.stylePrompt);
  const variations = getPromptVariations(basePrompt);

  try {
    const responses = await Promise.all(
      variations.map(async (prompt, index) => {
        const response = await fetch('https://api.nanobanana.com/v1/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.AI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            image: params.imageUrl,
            width: 1024,
            height: 1024,
          }),
        });

        if (!response.ok) {
          throw new Error(`NanoBanana API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          id: `nb-${Date.now()}-${index}`,
          url: data.output?.[0] ?? '',
          prompt,
        };
      })
    );

    return responses;
  } catch (error) {
    console.error('[AI Client] Erreur NanoBanana:', error);
    throw error;
  }
}

/**
 * Génération via Replicate API
 */
async function generateWithReplicate(
  params: GenerateImagesParams
): Promise<GeneratedImageResult[]> {
  const basePrompt = buildBasePrompt(params.stylePrompt);
  const variations = getPromptVariations(basePrompt);

  try {
    const responses = await Promise.all(
      variations.map(async (prompt, index) => {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${process.env.AI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: 'stability-ai/sdxl:latest',
            input: {
              prompt,
              image: params.imageUrl,
              num_outputs: 1,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Replicate API error: ${response.statusText}`);
        }

        const prediction = await response.json();

        // Attendre que la prédiction soit complétée
        let result = prediction;
        while (result.status === 'starting' || result.status === 'processing') {
          await delay(1000);
          const statusResponse = await fetch(
            `https://api.replicate.com/v1/predictions/${result.id}`,
            {
              headers: {
                'Authorization': `Token ${process.env.AI_API_KEY}`,
              },
            }
          );
          result = await statusResponse.json();
        }

        return {
          id: `rep-${Date.now()}-${index}`,
          url: result.output?.[0] ?? '',
          prompt,
        };
      })
    );

    return responses;
  } catch (error) {
    console.error('[AI Client] Erreur Replicate:', error);
    throw error;
  }
}

/**
 * Génération via Stability AI API
 */
async function generateWithStabilityAI(
  params: GenerateImagesParams
): Promise<GeneratedImageResult[]> {
  const basePrompt = buildBasePrompt(params.stylePrompt);
  const variations = getPromptVariations(basePrompt);

  try {
    const responses = await Promise.all(
      variations.map(async (prompt, index) => {
        const response = await fetch(
          'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.AI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text_prompts: [{ text: prompt, weight: 1 }],
              init_image: params.imageUrl,
              cfg_scale: 7,
              samples: 1,
              steps: 30,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Stability AI error: ${response.statusText}`);
        }

        const data = await response.json();
        const base64Image = data.artifacts?.[0]?.base64;
        const imageUrl = base64Image ? `data:image/png;base64,${base64Image}` : '';

        return {
          id: `stb-${Date.now()}-${index}`,
          url: imageUrl,
          prompt,
        };
      })
    );

    return responses;
  } catch (error) {
    console.error('[AI Client] Erreur Stability AI:', error);
    throw error;
  }
}

/**
 * Construit le prompt de base
 */
function buildBasePrompt(stylePrompt?: string): string {
  const base = 'Professional food marketing photography, commercial quality, bright natural lighting, minimalist background, menu-ready presentation, photorealistic, 8K';
  return stylePrompt ? `${base}, ${stylePrompt}` : base;
}

/**
 * Génère les 4 variations de prompts
 */
function getPromptVariations(basePrompt: string): string[] {
  return [
    `${basePrompt} on elegant wooden table surface`,
    `${basePrompt} with modern monochrome background`,
    `${basePrompt} with fresh ingredients scattered artfully`,
    `${basePrompt} with restaurant ambiance blur background`,
  ];
}

/**
 * Régénère une image avec un nouveau prompt
 */
export async function regenerateImage(
  originalPrompt: string,
  userPrompt: string
): Promise<GeneratedImageResult> {
  const hasApiKey = process.env.AI_API_KEY && process.env.AI_API_KEY.length > 0;

  if (!hasApiKey) {
    // Mode mock
    await delay(1200);
    const mockImageId = 'tAKXap853rY';
    return {
      id: `regen-${Date.now()}`,
      url: `https://images.unsplash.com/photo-${mockImageId}?w=800&q=80`,
      prompt: `${originalPrompt} + ${userPrompt}`,
    };
  }

  const provider = process.env.AI_API_PROVIDER ?? 'replicate';
  const combinedPrompt = `${originalPrompt}, ${userPrompt}`;

  // Pour la régénération, on fait un seul appel avec le prompt combiné
  const result = await generateImages({
    imageUrl: '', // L'URL sera fournie par l'API route
    stylePrompt: combinedPrompt,
  });

  return result[0] ?? {
    id: `regen-${Date.now()}`,
    url: '',
    prompt: combinedPrompt,
  };
}
