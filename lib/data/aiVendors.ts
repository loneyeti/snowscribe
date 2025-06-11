"use server";
import type { AIVendor } from '../types';
import type { AIVendorFormData } from '../schemas/aiVendor.schema';
import * as aiVendorService from '../services/aiVendorService';

export async function getAIVendors(): Promise<AIVendor[]> {
    return aiVendorService.getAIVendors();
}

export async function getAIVendorById(vendorId: string): Promise<AIVendor | null> {
    return aiVendorService.getAIVendorById(vendorId);
}

export async function createAIVendor(vendorData: AIVendorFormData): Promise<AIVendor> {
    return aiVendorService.createAIVendor(vendorData);
}

export async function updateAIVendor(vendorId: string, vendorData: Partial<AIVendorFormData>): Promise<AIVendor> {
    return aiVendorService.updateAIVendor(vendorId, vendorData);
}

export async function deleteAIVendor(vendorId: string): Promise<void> {
    await aiVendorService.deleteAIVendor(vendorId);
}
