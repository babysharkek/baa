import type { Effect } from "../types/timeline";
import type { Renderer, RendererConfig, RenderLayer } from "./renderer-factory";
import { WebGPURenderer } from "./webgpu-renderer-impl.js";
import { Canvas2DFallbackRenderer } from "./canvas2d-fallback-renderer.js";
import { getDeviceProfile } from "../device/device-capabilities.js";
import { optimizeForDevice, type PerformanceProfile } from "../device/performance-profiles.js";

export interface AdaptiveRendererConfig extends RendererConfig {
  enableAdaptivePerformance?: boolean;
  fallbackToCanvas2D?: boolean;
}

export class AdaptiveRenderer implements Renderer {
  readonly type = "adaptive" as const;

  private primaryRenderer: Renderer | null = null;
  private fallbackRenderer: Renderer | null = null;
  private config: AdaptiveRendererConfig;
  private deviceProfile: any = null;
  private performanceProfile: PerformanceProfile | null = null;
  private isUsingFallback = false;

  constructor(config: AdaptiveRendererConfig) {
    this.config = {
      enableAdaptivePerformance: true,
      fallbackToCanvas2D: true,
      ...config,
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Get device and performance profiles
      this.deviceProfile = await getDeviceProfile();
      this.performanceProfile = optimizeForDevice(this.deviceProfile);

      console.log(`[AdaptiveRenderer] Device tier: ${this.deviceProfile.overallTier}`);
      console.log(`[AdaptiveRenderer] Performance profile: ${this.performanceProfile.name}`);

      // Try WebGPU first
      if (this.config.enableAdaptivePerformance) {
        this.primaryRenderer = new WebGPURenderer({
          ...this.config,
          maxTextureCache: this.performanceProfile.settings.maxTextureCache,
        });
        
        const webgpuSuccess = await this.primaryRenderer.initialize();
        if (webgpuSuccess) {
          console.log("[AdaptiveRenderer] Using WebGPU renderer");
          return true;
        }

        console.warn("[AdaptiveRenderer] WebGPU initialization failed");
      }

      // Fallback to Canvas2D if enabled
      if (this.config.fallbackToCanvas2D) {
        this.fallbackRenderer = new Canvas2DFallbackRenderer(this.config);
        const canvasSuccess = await this.fallbackRenderer.initialize();
        if (canvasSuccess) {
          this.primaryRenderer = this.fallbackRenderer;
          this.isUsingFallback = true;
          console.log("[AdaptiveRenderer] Using Canvas2D fallback renderer");
          return true;
        }
      }

      console.error("[AdaptiveRenderer] All renderer initialization failed");
      return false;
    } catch (error) {
      console.error("[AdaptiveRenderer] Initialization error:", error);
      return false;
    }
  }

  isSupported(): boolean {
    return this.primaryRenderer?.isSupported() ?? false;
  }

  destroy(): void {
    this.primaryRenderer?.destroy();
    this.fallbackRenderer?.destroy();
    this.primaryRenderer = null;
    this.fallbackRenderer = null;
  }

  beginFrame(): void {
    this.primaryRenderer?.beginFrame();
  }

  renderLayer(layer: RenderLayer): void {
    if (!this.primaryRenderer) return;

    // Apply performance optimizations for low-end devices
    const optimizedLayer = this.optimizeLayerForDevice(layer);
    this.primaryRenderer.renderLayer(optimizedLayer);
  }

  async endFrame(): Promise<ImageBitmap> {
    if (!this.primaryRenderer) {
      throw new Error("No renderer available");
    }
    return this.primaryRenderer.endFrame();
  }

  createTextureFromImage(image: ImageBitmap): any {
    if (!this.primaryRenderer) {
      throw new Error("No renderer available");
    }
    return this.primaryRenderer.createTextureFromImage(image);
  }

  releaseTexture(texture: any): void {
    this.primaryRenderer?.releaseTexture(texture);
  }

  applyEffects(texture: any, effects: Effect[]): any {
    if (!this.primaryRenderer) return texture;

    // Limit effects based on performance profile
    const optimizedEffects = this.optimizeEffectsForDevice(effects);
    return this.primaryRenderer.applyEffects(texture, optimizedEffects);
  }

  resize(width: number, height: number): void {
    this.primaryRenderer?.resize(width, height);
  }

  getDevice(): any {
    return this.primaryRenderer?.getDevice() ?? null;
  }

  getMemoryUsage(): number {
    return this.primaryRenderer?.getMemoryUsage() ?? 0;
  }

  onDeviceLost(callback: () => void): void {
    this.primaryRenderer?.onDeviceLost(callback);
  }

  async recreateDevice(): Promise<boolean> {
    if (!this.primaryRenderer) return false;
    return this.primaryRenderer.recreateDevice();
  }

  getRendererType(): string {
    if (this.isUsingFallback) {
      return "canvas2d";
    }
    return this.primaryRenderer?.type ?? "unknown";
  }

  getPerformanceInfo(): {
    rendererType: string;
    deviceTier: string;
    performanceProfile: string;
    isUsingFallback: boolean;
  } {
    return {
      rendererType: this.getRendererType(),
      deviceTier: this.deviceProfile?.overallTier ?? "unknown",
      performanceProfile: this.performanceProfile?.name ?? "unknown",
      isUsingFallback: this.isUsingFallback,
    };
  }

  private optimizeLayerForDevice(layer: RenderLayer): RenderLayer {
    if (!this.performanceProfile) return layer;

    // For low-end devices, reduce effect complexity
    if (this.performanceProfile.tier === "low") {
      return {
        ...layer,
        effects: this.optimizeEffectsForDevice(layer.effects),
      };
    }

    return layer;
  }

  private optimizeEffectsForDevice(effects: Effect[]): Effect[] {
    if (!this.performanceProfile) return effects;

    const maxEffects = this.performanceProfile.settings.maxConcurrentEffects;
    const effectQuality = this.performanceProfile.settings.effectQuality;

    // Limit number of effects
    let optimizedEffects = effects.slice(0, maxEffects);

    // Adjust effect quality for low-end devices
    if (effectQuality === "low") {
      optimizedEffects = optimizedEffects.map(effect => ({
        ...effect,
        params: {
          ...effect.params,
          // Reduce effect intensity or complexity
          quality: "low",
        },
      }));
    }

    return optimizedEffects;
  }

  async switchRenderer(rendererType: "webgpu" | "canvas2d"): Promise<boolean> {
    if (rendererType === "webgpu" && !this.isUsingFallback) {
      return true; // Already using WebGPU
    }

    if (rendererType === "canvas2d" && this.isUsingFallback) {
      return true; // Already using Canvas2D
    }

    // Attempt to switch renderers
    console.log(`[AdaptiveRenderer] Switching to ${rendererType}`);
    
    if (rendererType === "webgpu" && this.fallbackRenderer) {
      const webgpuRenderer = new WebGPURenderer({
        ...this.config,
        maxTextureCache: this.performanceProfile?.settings.maxTextureCache,
      });
      
      const success = await webgpuRenderer.initialize();
      if (success) {
        this.primaryRenderer = webgpuRenderer;
        this.isUsingFallback = false;
        console.log("[AdaptiveRenderer] Successfully switched to WebGPU");
        return true;
      }
    }

    console.warn(`[AdaptiveRenderer] Failed to switch to ${rendererType}`);
    return false;
  }
}
