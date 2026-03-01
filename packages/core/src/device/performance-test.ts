import { getDeviceProfile, getCodecRecommendations, getResolutionRecommendations } from './device-capabilities.js';
import { optimizeForDevice } from './performance-profiles.js';

export interface PerformanceTestResult {
  deviceProfile: any;
  performanceProfile: any;
  codecRecommendations: any[];
  resolutionRecommendations: any[];
  testResults: {
    webgpuSupport: boolean;
    hardwareAcceleration: boolean;
    memoryEstimate: string;
    recommendedSettings: any;
  };
  optimizations: {
    forAmdAthlon: boolean;
    forLowEnd: boolean;
    customProfile: string;
  };
}

export async function runPerformanceTest(): Promise<PerformanceTestResult> {
  console.log('[Performance Test] Starting device performance analysis...');
  
  // Get device profile
  const deviceProfile = await getDeviceProfile();
  console.log('[Performance Test] Device profile:', deviceProfile);
  
  // Get performance profile
  const performanceProfile = optimizeForDevice(deviceProfile);
  console.log('[Performance Test] Performance profile:', performanceProfile);
  
  // Get recommendations
  const codecRecommendations = getCodecRecommendations(deviceProfile, { width: 1920, height: 1080 });
  const resolutionRecommendations = getResolutionRecommendations(deviceProfile);
  
  // Test WebGPU support
  const webgpuSupport = typeof navigator !== 'undefined' && 'gpu' in navigator;
  
  // Test hardware acceleration
  const hardwareAcceleration = performanceProfile.settings.enableHardwareAcceleration;
  
  // Memory estimate
  const memoryEstimate = `${deviceProfile.memory.gb}GB RAM, ${performanceProfile.settings.maxTextureCache / 1024 / 1024}MB texture cache`;
  
  // Recommended settings
  const recommendedSettings = {
    quality: performanceProfile.settings.defaultQuality,
    resolution: performanceProfile.settings.defaultExportResolution,
    bitrate: performanceProfile.settings.defaultBitrate,
    maxEffects: performanceProfile.settings.maxConcurrentEffects,
  };
  
  // Detect specific optimizations
  const gpuRenderer = deviceProfile.gpu.renderer.toLowerCase();
  const isAmdAthlon = gpuRenderer.includes('amd athlon') || 
                     gpuRenderer.includes('athlon') ||
                     gpuRenderer.includes('athlon silver');
  
  const forAmdAthlon = isAmdAthlon || performanceProfile.name.includes('AMD Athlon');
  const forLowEnd = deviceProfile.overallTier === 'low' || deviceProfile.memory.gb <= 4;
  const customProfile = forAmdAthlon ? 'AMD Athlon Low-Power' : 
                       forLowEnd ? 'Low-End Device' : 
                       performanceProfile.name;
  
  const result: PerformanceTestResult = {
    deviceProfile,
    performanceProfile,
    codecRecommendations,
    resolutionRecommendations,
    testResults: {
      webgpuSupport,
      hardwareAcceleration,
      memoryEstimate,
      recommendedSettings,
    },
    optimizations: {
      forAmdAthlon,
      forLowEnd,
      customProfile,
    },
  };
  
  console.log('[Performance Test] Analysis complete:', result);
  return result;
}

export function generatePerformanceReport(result: PerformanceTestResult): string {
  const lines: string[] = [];
  
  lines.push('# OpenReel Performance Analysis Report');
  lines.push('');
  lines.push('## Device Information');
  lines.push(`- **CPU**: ${result.deviceProfile.cpu.cores} cores (${result.deviceProfile.cpu.tier} tier)`);
  lines.push(`- **Memory**: ${result.deviceProfile.memory.gb}GB (${result.deviceProfile.memory.tier} tier)`);
  lines.push(`- **GPU**: ${result.deviceProfile.gpu.renderer}`);
  lines.push(`- **Platform**: ${result.deviceProfile.platform.os} with ${result.deviceProfile.platform.browser}`);
  lines.push(`- **Overall Tier**: ${result.deviceProfile.overallTier}`);
  lines.push('');
  
  lines.push('## Performance Profile');
  lines.push(`- **Profile**: ${result.performanceProfile.name}`);
  lines.push(`- **Quality**: ${result.performanceProfile.settings.defaultQuality}`);
  lines.push(`- **Max Texture Cache**: ${result.performanceProfile.settings.maxTextureCache / 1024 / 1024}MB`);
  lines.push(`- **Frame Buffer Size**: ${result.performanceProfile.settings.frameBufferSize / 1024 / 1024}MB`);
  lines.push(`- **Double Buffering**: ${result.performanceProfile.settings.enableDoubleBuffering ? 'Enabled' : 'Disabled'}`);
  lines.push(`- **Max Concurrent Effects**: ${result.performanceProfile.settings.maxConcurrentEffects}`);
  lines.push(`- **Hardware Acceleration**: ${result.performanceProfile.settings.enableHardwareAcceleration ? 'Enabled' : 'Disabled'}`);
  lines.push('');
  
  lines.push('## Optimizations Applied');
  if (result.optimizations.forAmdAthlon) {
    lines.push('✅ **AMD Athlon Optimizations**: Specialized profile for AMD Athlon processors');
    lines.push('   - Reduced texture cache to prevent memory issues');
    lines.push('   - Disabled double buffering to save memory');
    lines.push('   - Limited concurrent effects to 1');
    lines.push('   - Lower preview resolution (960x540)');
  }
  
  if (result.optimizations.forLowEnd) {
    lines.push('✅ **Low-End Device Optimizations**: Conservative settings for better performance');
    lines.push('   - Conservative memory management');
    lines.push('   - Reduced effect quality');
    lines.push('   - Disabled background processing');
  }
  
  if (!result.optimizations.forAmdAthlon && !result.optimizations.forLowEnd) {
    lines.push('✅ **Standard Performance**: Using balanced settings for this device');
  }
  lines.push('');
  
  lines.push('## Recommended Export Settings');
  lines.push(`- **Resolution**: ${result.testResults.recommendedSettings.resolution.width}x${result.testResults.recommendedSettings.resolution.height}`);
  lines.push(`- **Quality**: ${result.testResults.recommendedSettings.quality}`);
  lines.push(`- **Bitrate**: ${result.testResults.recommendedSettings.bitrate / 1000000}Mbps`);
  lines.push(`- **Max Effects**: ${result.testResults.recommendedSettings.maxEffects}`);
  lines.push('');
  
  lines.push('## Codec Recommendations');
  result.codecRecommendations.forEach((codec, index) => {
    const status = codec.recommended ? '✅ Recommended' : '⚠️ Available';
    lines.push(`${index + 1}. **${codec.label}** - ${status}`);
    lines.push(`   - Speed: ${codec.speedRating}, Quality: ${codec.qualityRating}`);
    lines.push(`   - ${codec.reason}`);
  });
  lines.push('');
  
  lines.push('## Resolution Recommendations');
  result.resolutionRecommendations.forEach((res, index) => {
    const status = res.recommended ? '✅ Recommended' : '⚠️ Available';
    lines.push(`${index + 1}. **${res.label}** (${res.width}x${res.height}) - ${status}`);
    if (res.warning) {
      lines.push(`   - ⚠️ ${res.warning}`);
    }
  });
  lines.push('');
  
  lines.push('## System Capabilities');
  lines.push(`- **WebGPU Support**: ${result.testResults.webgpuSupport ? '✅ Available' : '❌ Not Available'}`);
  lines.push(`- **Hardware Acceleration**: ${result.testResults.hardwareAcceleration ? '✅ Enabled' : '❌ Disabled'}`);
  lines.push(`- **Memory Estimate**: ${result.testResults.memoryEstimate}`);
  lines.push('');
  
  lines.push('---');
  lines.push('*Report generated by OpenReel Performance Analyzer*');
  
  return lines.join('\n');
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  (window as any).openReelPerformanceTest = {
    runTest: runPerformanceTest,
    generateReport: generatePerformanceReport,
  };
}
