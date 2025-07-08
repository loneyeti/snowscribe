"use server";

import { AIVendorFactory, ModelConfig, AIVendorAdapter, Chat, ChatResponse } from "snowgander";
import type { AIModel } from "@/lib/types";
import { getAIModelById } from "./aiModels";
import { getAIVendorById } from "./aiVendors";

// Example: Load keys from environment variables
if (process.env.OPENAI_API_KEY) {
  AIVendorFactory.setVendorConfig("openai", {
    apiKey: process.env.OPENAI_API_KEY,
  });
  // Also configure 'openai-image' if using DALL-E via OpenAIImageAdapter
  AIVendorFactory.setVendorConfig("openai-image", {
    apiKey: process.env.OPENAI_API_KEY,
  });
}

if (process.env.ANTHROPIC_API_KEY) {
  AIVendorFactory.setVendorConfig("anthropic", {
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

if (process.env.GOOGLE_API_KEY) {
  AIVendorFactory.setVendorConfig("google", {
    apiKey: process.env.GOOGLE_API_KEY,
  });
}

if (process.env.OPENROUTER_API_KEY) {
  AIVendorFactory.setVendorConfig("openrouter", {
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

export async function createModelConfig(model: AIModel): Promise<ModelConfig> {
  const modelConfig: ModelConfig = {
    apiName: model.api_name,
    isThinking: model.is_thinking,
    isVision: model.is_vision,
    isImageGeneration: model.is_image_generation,
    inputTokenCost: model.input_token_cost_micros ?? undefined,
    outputTokenCost: model.output_token_cost_micros ?? undefined,
  };
  return modelConfig;
}

export async function createChatClient(model: AIModel, modelConfig: ModelConfig, vendorName: string): Promise<AIVendorAdapter | null> {
  if (process.env.OPENAI_API_KEY) {
    AIVendorFactory.setVendorConfig("openai", {
      apiKey: process.env.OPENAI_API_KEY,
    });
    // Also configure 'openai-image' if using DALL-E via OpenAIImageAdapter
    AIVendorFactory.setVendorConfig("openai-image", {
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    AIVendorFactory.setVendorConfig("anthropic", {
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  if (process.env.GOOGLE_API_KEY) {
    AIVendorFactory.setVendorConfig("google", {
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }
  
  if (process.env.OPENROUTER_API_KEY) {
    AIVendorFactory.setVendorConfig("openrouter", {
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }
  try {
    const adapter: AIVendorAdapter = AIVendorFactory.getAdapter(
      vendorName,
      modelConfig // Pass the config for the specific model
    );
    // Now you can use the 'adapter' instance!
    return adapter;
  } catch (error) {
    console.error("Failed to get adapter:", error);
    return null;
  } 
}

export async function getModelVendorNameByModel(model: AIModel): Promise<string | null> {
  const vendor = await getAIVendorById(model.vendor_id);
  if (!vendor) {
    return null;
  }
  return vendor.name;
}


export async function chat(modelId: string, messages: ChatResponse[], prompt: string, systemPrompt: string) {
    const model = await getAIModelById(modelId);
    if (!model) {
      throw new Error("Model not found");
    }
    const modelConfig = createModelConfig(model); 
    const vendorName = await getModelVendorNameByModel(model);
    if (!vendorName) {
      throw new Error("Vendor not found");
    }
    const adapter = await createChatClient(model, await modelConfig, vendorName);
    if (!adapter) {
      throw new Error("Adapter not found");
    }
    // --- Prepare the Chat Object (Manage this state in your app) ---
const currentChat: Chat = {
    model: (await modelConfig).apiName, // The model being used
    responseHistory: messages,
    prompt: prompt, // The user's latest input
    systemPrompt: systemPrompt, // Sets the AI's persona
    maxTokens: 16000, // Limit response length for this turn
    visionUrl: null, // Set to an image URL for vision models
    budgetTokens: null, // Set > 0 to enable 'thinking' mode if supported
    imageURL: null, // Set to an image URL for image models
  };
  const response = await adapter.sendChat(currentChat);
  return response;
}