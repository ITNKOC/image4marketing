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

interface SocialMediaPostResult {
  title: string;
  caption: string;
  hashtags: string[];
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
 * Détecte le type MIME d'une image depuis son URL
 */
function detectMimeType(url: string): string {
  // Si c'est une data URL, extraire le type MIME
  if (url.startsWith('data:')) {
    const mimeMatch = url.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    if (mimeMatch && mimeMatch[1]) {
      return mimeMatch[1];
    }
  }

  // Sinon, détecter depuis l'extension du fichier
  if (url.includes('.png') || url.includes('image/png')) {
    return 'image/png';
  }
  if (url.includes('.webp') || url.includes('image/webp')) {
    return 'image/webp';
  }
  if (url.includes('.gif') || url.includes('image/gif')) {
    return 'image/gif';
  }

  // Par défaut, JPEG
  return 'image/jpeg';
}

/**
 * Convertit une URL d'image en base64
 */
async function urlToBase64(url: string): Promise<string> {
  try {
    // Si l'URL est déjà en base64 (data URL), extraire juste la partie base64
    if (url.startsWith('data:')) {
      const base64Match = url.match(/^data:image\/[a-zA-Z+]+;base64,(.+)$/);
      if (base64Match && base64Match[1]) {
        return base64Match[1];
      }
    }

    // Sinon, télécharger l'image depuis l'URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error('[AI Client] Erreur conversion base64:', error);
    throw error;
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

  const basePrompt = buildBasePrompt(params.stylePrompt);

  // Images mockées de haute qualité (Unsplash food photography)
  // Chaque image correspond à un cas d'usage spécifique
  const mockData = [
    {
      id: 'Yn0l7uwBrpw', // E-commerce: clean white background
      description: 'E-commerce product photo'
    },
    {
      id: 'jpkfc5_d-DI', // Delivery: centered dish neutral background
      description: 'Delivery app menu photo'
    },
    {
      id: 'N_Y88TWmGwA', // Social Media: vibrant with ingredients
      description: 'Social media marketing post'
    },
    {
      id: 'MQUqbmszGGM', // Hero: dramatic with bokeh
      description: 'Hero banner image'
    },
  ];

  return mockData.map((mock, index) => ({
    id: `mock-${Date.now()}-${index}`,
    url: `https://images.unsplash.com/photo-${mock.id}?w=800&q=80`,
    prompt: `${basePrompt}, ${mock.description}`,
  }));
}

/**
 * Génération via NanoBanana API (Google Gemini 2.5 Flash Image)
 */
async function generateWithNanoBanana(
  params: GenerateImagesParams
): Promise<GeneratedImageResult[]> {
  const basePrompt = buildBasePrompt(params.stylePrompt);
  const variations = getPromptVariations(basePrompt);

  try {
    // Convertir l'image URL en base64
    const imageBase64 = await urlToBase64(params.imageUrl);
    const mimeType = detectMimeType(params.imageUrl);

    // Générer les images séquentiellement pour éviter rate limiting
    const responses: GeneratedImageResult[] = [];

    for (let index = 0; index < variations.length; index++) {
      const prompt = variations[index];

      if (!prompt) {
        console.error(`[AI Client] Prompt manquant pour l'index ${index}`);
        continue; // Skip cette itération si le prompt est undefined
      }

      // Délai entre les requêtes (sauf pour la première)
      if (index > 0) {
        await delay(1500); // 1.5 secondes entre chaque requête
      }

      try {
        const response = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
          {
            method: 'POST',
            headers: {
              'x-goog-api-key': process.env.AI_API_KEY ?? '',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: imageBase64,
                    },
                  },
                ],
              }],
              generationConfig: {
                responseModalities: ['Image'],  // CRUCIAL: Indique qu'on veut une image en sortie
                imageConfig: {
                  aspectRatio: '1:1',
                },
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log(`[AI Client] Réponse Gemini pour image ${index + 1}:`, JSON.stringify(data).substring(0, 200));

        // Extraire l'image générée depuis la réponse Gemini
        // L'API peut retourner inlineData (camelCase) ou inline_data (snake_case)
        const imagePart = data.candidates?.[0]?.content?.parts?.find(
          (part: any) => part.inlineData || part.inline_data
        );
        const generatedImage = imagePart?.inlineData?.data || imagePart?.inline_data?.data;

        if (!generatedImage) {
          console.error('[AI Client] Structure de la réponse:', JSON.stringify(data, null, 2));
          throw new Error('Aucune image générée dans la réponse');
        }

        responses.push({
          id: `nb-${Date.now()}-${index}`,
          url: `data:image/jpeg;base64,${generatedImage}`,
          prompt,
        });

        console.log(`[AI Client] Image ${index + 1}/4 générée avec succès`);

      } catch (imageError) {
        console.error(`[AI Client] Erreur pour l'image ${index + 1}:`, imageError);
        throw imageError;
      }
    }

    return responses;
  } catch (error) {
    console.error('[AI Client] Erreur NanoBanana/Gemini:', error);
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
  const base = 'Professional food photography, award-winning quality, shot with Hasselblad camera, ISO 100, professional color grading, clean sharp focus, photorealistic, 8K resolution';
  return stylePrompt ? `${base}, ${stylePrompt}` : base;
}

/**
 * Génère les 4 variations de prompts optimisées pour différents cas d'usage
 * Spécifique au Restaurant Di Menna - Cuisine italienne authentique
 */
function getPromptVariations(basePrompt: string): string[] {
  return [
    // 1. E-commerce / Site web de vente - IMAGE PARFAITE CATALOGUE
    `Transform this food photo into a PERFECT e-commerce product image: ${basePrompt}, Restaurant Di Menna authentic Italian cuisine, PROFESSIONAL RETOUCHING AND ENHANCEMENT, perfect color correction and grading, enhanced vibrant colors while keeping natural look, improved lighting and contrast, sharpened details and textures, removed any imperfections, food styling perfection, centered composition on PURE CLEAN WHITE BACKGROUND (RGB 255,255,255), top-down 45-degree hero angle, soft diffused professional studio lighting with subtle rim light, ZERO shadows on background, crystal clear focus on the dish, enhanced steam or freshness effects if applicable, garnishes perfectly placed, drizzles and sauces artfully arranged, Italian presentation elevated to magazine cover quality, commercial photography standards, catalogue-ready perfection, high-end product photography, Michelin-star plating aesthetics, make this image ABSOLUTELY PERFECT for selling online`,

    // 2. Plateformes de livraison (Uber Eats, DoorDash, Skip) - VUE D'EN HAUT PROFESSIONNELLE
    `Transform this into a STUNNING delivery app menu photo: ${basePrompt}, Restaurant Di Menna Italian dish, DIRECTLY OVERHEAD FLAT LAY shot (perfect 90-degree bird's eye view from top), professional food photography styling, BEAUTIFUL PREMIUM BACKGROUND (choose one: rustic weathered wood table, elegant dark wood planks, white marble surface with subtle veining, textured slate board, warm terracotta surface), the dish perfectly centered and styled, landscape 5:4 format optimized for Uber Eats DoorDash Skip, vibrant appetizing colors that pop on mobile screens, professional food styling with complementary props (fresh Italian herbs like basil, Italian ingredients scattered artfully, linen napkin, rustic cutlery), soft natural window lighting from side creating gentle shadows, NO HARSH SHADOWS, enhanced colors and contrast for mobile viewing, moisture and freshness visible, garnishes perfectly placed, Italian authenticity, 50+ years culinary tradition, mouth-watering presentation optimized for maximum orders, NO TEXT NO LOGOS NO BORDERS, restaurant-quality professional food photography that converts viewers to customers`,

    // 3. Marketing Social Media (Instagram, Facebook) - Pour DI MENNA
    `${basePrompt}, Restaurant Di Menna Montreal Saint-Leonard, Instagram-worthy social media post for authentic Italian restaurant, vibrant bold colors with high contrast, natural candid Italian food styling, human element with hands reaching for delicious Italian food, warm inviting atmosphere, textured rustic backdrop evoking Italian trattoria, engaging composition with negative space for text overlay, trendy flat-lay or overhead shot, family restaurant ambiance since 1971, visually striking for maximum engagement, shareable content that stops the scroll, Montreal foodie scene, Italian culinary excellence`,

    // 4. Hero Image (Page d'accueil/Landing page) - SANS TEXTE, IMAGE PURE
    `Transform this into a CINEMATIC HERO IMAGE: ${basePrompt}, Restaurant Di Menna hero banner photography, ULTRA WIDE landscape 16:9 cinematic format, PROFESSIONAL RESTAURANT EDITORIAL PHOTOGRAPHY, absolutely NO TEXT NO LOGOS NO WORDS NO OVERLAYS - pure visual image only, stunning Italian dish as the hero focal point, DRAMATIC CINEMATIC LIGHTING with beautiful depth and dimension, warm golden hour glow or moody atmospheric lighting, Italian restaurant ambiance with softly blurred bokeh background (warm lighting, rustic wooden tables, wine bottles, Italian decor barely visible), artful composition with rule of thirds, the dish positioned to leave ample negative space for future text placement, rich saturated colors with professional color grading, film-like quality, depth of field creating beautiful bokeh, steam or motion blur if applicable, storytelling visual that evokes Italian family tradition warmth comfort and appetite, Michelin guide photography quality, James Beard award-winning food photography aesthetic, Franco Di Menna's 50-year legacy captured in one perfect image, premium quality that represents culinary excellence, magazine cover worthy, website header perfection, pure unadulterated food beauty without any text elements`
  ];
}

/**
 * Informations sur le restaurant DI MENNA
 */
const RESTAURANT_INFO = {
  name: 'Restaurant Di Menna',
  location: '6313 Rue Jarry Est, Saint-Léonard, Montréal',
  phone: '(514) 326-4200',
  founded: '1971',
  specialty: 'Cuisine italienne authentique et l\'une des meilleures pizzas de Montréal',
  description: 'Restaurant italien familial depuis plus de 50 ans, reconnu pour sa pizza authentique, ses plats italiens traditionnels (lasagna, veau, arancini), et son ambiance chaleureuse avec bar à cocktails.',
  founder: 'Franco Di Menna',
  website: 'dimenna.com'
};

/**
 * Génère un texte de publication pour les réseaux sociaux basé sur l'ANALYSE VISUELLE de l'image
 */
export async function generateSocialMediaPost(
  imageUrl: string
): Promise<SocialMediaPostResult> {
  const hasApiKey = process.env.AI_API_KEY && process.env.AI_API_KEY.length > 0;

  if (!hasApiKey) {
    // Mode mock
    await delay(1000);
    return {
      title: `Découvrez nos délices italiens chez ${RESTAURANT_INFO.name}! 🍕`,
      caption: `Une expérience culinaire authentique vous attend au cœur de Montréal! Depuis ${RESTAURANT_INFO.founded}, nous perpétuons la tradition italienne avec passion. Venez savourer nos plats faits maison et découvrir pourquoi nous servons l'une des meilleures pizzas en ville!\n\n📍 ${RESTAURANT_INFO.location}\n📞 ${RESTAURANT_INFO.phone}`,
      hashtags: ['DiMenna', 'MontrealFood', 'ItalianCuisine', 'PizzaLovers', 'StLeonard', 'MTLEats', 'FoodiesMTL']
    };
  }

  try {
    // Étape 1: Analyser l'image pour identifier le plat
    console.log('[AI Client] Analyse de l\'image pour génération de texte...');
    const imageBase64 = await urlToBase64(imageUrl);
    const mimeType = detectMimeType(imageUrl);

    const analysisPrompt = `Analyse cette photo de nourriture du Restaurant Di Menna (cuisine italienne authentique depuis 1971).

DÉCRIS en détail et avec précision:
1. Quel est le PLAT PRINCIPAL visible? (ex: pizza, pasta carbonara, salade César, lasagna, veau parmigiana, arancini, etc.)
2. Quels INGRÉDIENTS visibles vois-tu?
3. Quels DÉTAILS VISUELS rendent ce plat appétissant? (couleurs, textures, présentation)
4. Quelle ÉMOTION ou AMBIANCE se dégage de l'image?

Sois PRÉCIS et DESCRIPTIF. Réponds en 3-4 phrases courtes.`;

    const analysisResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': process.env.AI_API_KEY ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: analysisPrompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      throw new Error(`Gemini API error during analysis (${analysisResponse.status}): ${errorText}`);
    }

    const analysisData = await analysisResponse.json();
    const imageAnalysis = analysisData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!imageAnalysis) {
      throw new Error('Pas d\'analyse d\'image générée');
    }

    console.log('[AI Client] Analyse de l\'image:', imageAnalysis);

    // Étape 2: Générer le texte de publication basé sur l'analyse
    const textPrompt = `Tu es un expert en marketing des réseaux sociaux pour restaurants.

**CONTEXTE DU RESTAURANT:**
- Nom: ${RESTAURANT_INFO.name}
- Localisation: ${RESTAURANT_INFO.location}
- Téléphone: ${RESTAURANT_INFO.phone}
- Spécialité: ${RESTAURANT_INFO.specialty}
- Histoire: ${RESTAURANT_INFO.description}

**ANALYSE DE L'IMAGE:**
${imageAnalysis}

**CONSIGNES STRICTES:**
Génère une publication Instagram/Facebook engageante et professionnelle qui:

1. TITRE (max 60 caractères):
   - Doit parler SPÉCIFIQUEMENT du plat visible dans l'image
   - Utilise un emoji pertinent au plat (🥗 pour salade, 🍝 pour pasta, 🍕 pour pizza, 🍖 pour viande, etc.)
   - Accrocheur et enthousiaste

2. TEXTE de publication (150-200 mots):
   - COMMENCE par parler du PLAT SPÉCIFIQUE dans l'image (pas générique!)
   - Décris ce qui le rend spécial au Restaurant Di Menna
   - Évoque l'authenticité italienne et la tradition depuis 1971
   - Crée une connexion émotionnelle et l'envie
   - Inclus naturellement: 📍 ${RESTAURANT_INFO.location} et 📞 ${RESTAURANT_INFO.phone}
   - Termine avec un appel à l'action (réservation, visite, commande)
   - Ton chaleureux et authentique

3. HASHTAGS (8-10):
   - Adaptés au PLAT SPÉCIFIQUE (ex: #PastaMTL, #SaladLovers, #MTLPizza, etc.)
   - Mix de populaires et locaux
   - Inclus: #DiMenna, #MontrealFood, #ItalianCuisine, #StLeonard, #MTLEats

Format de réponse STRICTEMENT en JSON:
{
  "title": "le titre ici",
  "caption": "le texte complet de la publication ici",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}

IMPORTANT:
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après
- Sois SPÉCIFIQUE au plat dans l'image, pas générique!`;

    const textResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': process.env.AI_API_KEY ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: textPrompt }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      throw new Error(`Gemini API error during text generation (${textResponse.status}): ${errorText}`);
    }

    const textData = await textResponse.json();
    const textContent = textData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('Pas de texte généré dans la réponse');
    }

    // Extraire le JSON de la réponse
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format de réponse invalide');
    }

    const result = JSON.parse(jsonMatch[0]);

    console.log('[AI Client] Texte généré avec succès basé sur l\'analyse de l\'image');

    return {
      title: result.title || '',
      caption: result.caption || '',
      hashtags: result.hashtags || [],
    };
  } catch (error) {
    console.error('[AI Client] Erreur génération texte social media:', error);
    // Fallback en cas d'erreur
    return {
      title: `Cuisine italienne authentique chez ${RESTAURANT_INFO.name}! 🇮🇹`,
      caption: `Une expérience culinaire authentique vous attend au cœur de Montréal! Depuis ${RESTAURANT_INFO.founded}, nous perpétuons la tradition italienne avec passion.\n\n📍 ${RESTAURANT_INFO.location}\n📞 ${RESTAURANT_INFO.phone}`,
      hashtags: ['DiMenna', 'MontrealFood', 'ItalianCuisine', 'StLeonard', 'MTLEats', 'FoodiesMTL', 'MTLRestaurants']
    };
  }
}

/**
 * Régénère une image avec un nouveau prompt
 */
export async function regenerateImage(
  imageUrl: string,
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
  console.log(`[AI Client] Régénération avec provider: ${provider}`);

  const combinedPrompt = `${originalPrompt}, ${userPrompt}`;

  // Régénération basée sur l'image existante
  switch (provider) {
    case 'nanobanana':
      return await regenerateWithNanoBanana(imageUrl, combinedPrompt);
    case 'replicate':
    case 'stability':
    default:
      // Pour Replicate/Stability, on utilise la fonction generateImages existante
      const result = await generateImages({
        imageUrl,
        stylePrompt: combinedPrompt,
      });
      return result[0] ?? {
        id: `regen-${Date.now()}`,
        url: '',
        prompt: combinedPrompt,
      };
  }
}

/**
 * Régénération spécifique pour NanoBanana/Gemini
 */
async function regenerateWithNanoBanana(
  imageUrl: string,
  prompt: string
): Promise<GeneratedImageResult> {
  try {
    // Convertir l'image URL en base64
    const imageBase64 = await urlToBase64(imageUrl);
    const mimeType = detectMimeType(imageUrl);

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': process.env.AI_API_KEY ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          }],
          generationConfig: {
            responseModalities: ['Image'],
            imageConfig: {
              aspectRatio: '1:1',
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('[AI Client] Réponse Gemini régénération:', JSON.stringify(data).substring(0, 200));

    // Extraire l'image générée
    const imagePart = data.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData || part.inline_data
    );
    const generatedImage = imagePart?.inlineData?.data || imagePart?.inline_data?.data;

    if (!generatedImage) {
      console.error('[AI Client] Structure de la réponse:', JSON.stringify(data, null, 2));
      throw new Error('Aucune image générée dans la réponse');
    }

    return {
      id: `regen-${Date.now()}`,
      url: `data:image/jpeg;base64,${generatedImage}`,
      prompt,
    };
  } catch (error) {
    console.error('[AI Client] Erreur régénération NanoBanana:', error);
    throw error;
  }
}
