import type { DeviceProfile, DeviceTier } from './device-capabilities.js';

export interface PerformanceProfile {
  name: string;
  tier: DeviceTier;
  settings: {
    // Rendering settings
    maxTextureCache: number;
    frameBufferSize: number;
    enableDoubleBuffering: boolean;
    enableEffectsCaching: boolean;
    
    // Quality settings
    defaultQuality: 'low' | 'medium' | 'high';
    maxPreviewResolution: { width: number; height: number };
    enableHardwareAcceleration: boolean;
    
    // Processing settings
    maxConcurrentEffects: number;
    effectQuality: 'low' | 'medium' | 'high';
    enableBackgroundProcessing: boolean;
    
    // Memory management
    textureCacheStrategy: 'aggressive' | 'balanced' | 'conservative';
    frameCacheSize: number;
    garbageCollectionInterval: number;
    
    // Export settings
    defaultExportResolution: { width: number; height: number };
    maxExportResolution: { width: number; height: number };
    defaultBitrate: number;
    enableHardwareEncoding: boolean;
  };
}

export const PERFORMANCE_PROFILES: Record<DeviceTier, PerformanceProfile> = {
  low: {
    name: 'Low-End Device',
    tier: 'low',
    settings: {
      // Reduced memory usage for low-end devices
      maxTextureCache: 100 * 1024 * 1024, // 100MB
      frameBufferSize: 50 * 1024 * 1024,  // 50MB per frame buffer
      enableDoubleBuffering: false, // Disable to save memory
      enableEffectsCaching: true,
      
      // Lower quality settings
      defaultQuality: 'low',
      maxPreviewResolution: { width: 1280, height: 720 },
      enableHardwareAcceleration: true, // Still try to use hardware
      
      // Reduced processing
      maxConcurrentEffects: 2,
      effectQuality: 'low',
      enableBackgroundProcessing: false, // Disable to reduce CPU load
      
      // Conservative memory management
      textureCacheStrategy: 'conservative',
      frameCacheSize: 10,
      garbageCollectionInterval: 30000, // 30 seconds
      
      // Lower export defaults
      defaultExportResolution: { width: 1280, height: 720 },
      maxExportResolution: { width: 1920, height: 1080 },
      defaultBitrate: 2_000_000, // 2Mbps
      enableHardwareEncoding: true,
    },
  },
  mid: {
    name: 'Mid-Range Device',
    tier: 'mid',
    settings: {
      // Moderate memory usage
      maxTextureCache: 300 * 1024 * 1024, // 300MB
      frameBufferSize: 100 * 1024 * 1024, // 100MB per frame buffer
      enableDoubleBuffering: true,
      enableEffectsCaching: true,
      
      // Balanced quality
      defaultQuality: 'medium',
      maxPreviewResolution: { width: 1920, height: 1080 },
      enableHardwareAcceleration: true,
      
      // Moderate processing
      maxConcurrentEffects: 4,
      effectQuality: 'medium',
      enableBackgroundProcessing: true,
      
      // Balanced memory management
      textureCacheStrategy: 'balanced',
      frameCacheSize: 30,
      garbageCollectionInterval: 60000, // 1 minute
      
      // Standard export defaults
      defaultExportResolution: { width: 1920, height: 1080 },
      maxExportResolution: { width: 2560, height: 1440 },
      defaultBitrate: 5_000_000, // 5Mbps
      enableHardwareEncoding: true,
    },
  },
  high: {
    name: 'High-End Device',
    tier: 'high',
    settings: {
      // High memory usage for better performance
      maxTextureCache: 1024 * 1024 * 1024, // 1GB
      frameBufferSize: 200 * 1024 * 1024, // 200MB per frame buffer
      enableDoubleBuffering: true,
      enableEffectsCaching: true,
      
      // High quality settings
      defaultQuality: 'high',
      maxPreviewResolution: { width: 3840, height: 2160 },
      enableHardwareAcceleration: true,
      
      // High processing capacity
      maxConcurrentEffects: 8,
      effectQuality: 'high',
      enableBackgroundProcessing: true,
      
      // Aggressive memory management for performance
      textureCacheStrategy: 'aggressive',
      frameCacheSize: 100,
      garbageCollectionInterval: 120000, // 2 minutes
      
      // High export defaults
      defaultExportResolution: { width: 1920, height: 1080 },
      maxExportResolution: { width: 3840, height: 2160 },
      defaultBitrate: 10_000_000, // 10Mbps
      enableHardwareEncoding: true,
    },
  },
};

// Specialized profiles for specific hardware configurations
export const SPECIALIZED_PROFILES: Partial<Record<string, PerformanceProfile>> = {
  'amd-athlon-low': {
    name: 'AMD Athlon Low-Power',
    tier: 'low',
    settings: {
      // Very conservative settings for AMD Athlon
      maxTextureCache: 50 * 1024 * 1024, // 50MB
      frameBufferSize: 25 * 1024 * 1024, // 25MB
      enableDoubleBuffering: false,
      enableEffectsCaching: true,
      
      defaultQuality: 'low',
      maxPreviewResolution: { width: 960, height: 540 },
      enableHardwareAcceleration: true,
      
      maxConcurrentEffects: 1,
      effectQuality: 'low',
      enableBackgroundProcessing: false,
      
      textureCacheStrategy: 'conservative',
      frameCacheSize: 5,
      garbageCollectionInterval: 15000, // 15 seconds
      
      defaultExportResolution: { width: 854, height: 480 },
      maxExportResolution: { width: 1280, height: 720 },
      defaultBitrate: 1_000_000, // 1Mbps
      enableHardwareEncoding: false, // May be unstable on some AMD configs
    },
  },
  'intel-low-end': {
    name: 'Intel Low-End Graphics',
    tier: 'low',
    settings: {
      maxTextureCache: 75 * 1024 * 1024, // 75MB
      frameBufferSize: 40 * 1024 * 1024, // 40MB
      enableDoubleBuffering: false,
      enableEffectsCaching: true,
      
      defaultQuality: 'low',
      maxPreviewResolution: { width: 1280, height: 720 },
      enableHardwareAcceleration: true,
      
      maxConcurrentEffects: 2,
      effectQuality: 'low',
      enableBackgroundProcessing: false,
      
      textureCacheStrategy: 'conservative',
      frameCacheSize: 8,
      garbageCollectionInterval: 20000, // 20 seconds
      
      defaultExportResolution: { width: 1280, height: 720 },
      maxExportResolution: { width: 1920, height: 1080 },
      defaultBitrate: 1_500_000, // 1.5Mbps
      enableHardwareEncoding: true,
    },
  },
};

export function getPerformanceProfile(profile: DeviceProfile): PerformanceProfile {
  // Check for specialized profiles first
  const gpuRenderer = profile.gpu.renderer.toLowerCase();
  const cpuInfo = `${profile.platform.os} ${profile.gpu.vendor}`.toLowerCase();
  
  // AMD Athlon specific detection
  if (gpuRenderer.includes('amd athlon') || 
      gpuRenderer.includes('athlon') ||
      cpuInfo.includes('amd athlon') ||
      cpuInfo.includes('athlon silver')) {
    return SPECIALIZED_PROFILES['amd-athlon-low'] || PERFORMANCE_PROFILES.low;
  }
  
  // Intel low-end graphics detection
  if (gpuRenderer.includes('intel hd') ||
      gpuRenderer.includes('intel hd graphics') ||
      gpuRenderer.includes('intel hd 4000') ||
      gpuRenderer.includes('intel hd 5000') ||
      gpuRenderer.includes('intel hd 6000')) {
    return SPECIALIZED_PROFILES['intel-low-end'] || PERFORMANCE_PROFILES.low;
  }
  
  // Fall back to tier-based profiles
  return PERFORMANCE_PROFILES[profile.overallTier];
}

export function optimizeForDevice(profile: DeviceProfile): PerformanceProfile {
  const baseProfile = getPerformanceProfile(profile);
  
  // Additional optimizations based on memory constraints
  if (profile.memory.gb <= 4) {
    // Very low memory systems
    return {
      ...baseProfile,
      settings: {
        ...baseProfile.settings,
        maxTextureCache: Math.min(baseProfile.settings.maxTextureCache, 50 * 1024 * 1024),
        frameCacheSize: Math.min(baseProfile.settings.frameCacheSize, 5),
        enableDoubleBuffering: false,
        enableBackgroundProcessing: false,
      },
    };
  }
  
  if (profile.memory.gb <= 8) {
    // Low to moderate memory systems
    return {
      ...baseProfile,
      settings: {
        ...baseProfile.settings,
        maxTextureCache: Math.min(baseProfile.settings.maxTextureCache, 200 * 1024 * 1024),
        frameCacheSize: Math.min(baseProfile.settings.frameCacheSize, 15),
      },
    };
  }
  
  return baseProfile;
}
