// Test setup file
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock next/font
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'font-inter' }),
  Cactus_Classical_Serif: () => ({ className: 'font-cactus-serif' }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: vi.fn(),
}));
