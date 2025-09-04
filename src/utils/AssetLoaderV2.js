// src/utils/AssetLoaderV2.js
// COMPLETE FIXED VERSION - Simple and reliable HDRI loading

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export default class AssetLoaderV2 {
  constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.rgbeLoader = new RGBELoader(this.loadingManager);
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    
    this.assets = new Map();
    this.progressCallback = null;
    this.errorCallback = null;
    
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.failedAssets = 0;
    
    this._setupLoadingManager();
  }

  _setupLoadingManager() {
    this.loadingManager.onProgress = (url, loaded, total) => {
      if (this.progressCallback) {
        const overallProgress = total > 0 ? (loaded / total) * 100 : 0;
        this.progressCallback({
          type: 'item',
          url,
          loaded,
          total,
          progress: overallProgress,
          currentAsset: this._getAssetNameFromUrl(url)
        });
      }
    };

    this.loadingManager.onLoad = () => {
      if (this.progressCallback) {
        this.progressCallback({
          type: 'complete',
          progress: 100,
          message: 'All assets loaded successfully'
        });
      }
    };

    this.loadingManager.onError = (url) => {
      this.failedAssets++;
      console.error('Failed to load asset:', url);
      if (this.errorCallback) {
        this.errorCallback(url, `Failed to load: ${url}`);
      }
      this.progressCallback?.({
        type: 'error',
        url,
        progress: this.getLoadingStats().progress,
        currentAsset: `${this._getAssetNameFromUrl(url)} failed`
      });
    };
  }

  _getAssetNameFromUrl(url) {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const name = filename.split('.')[0];
    
    const friendlyNames = {
      'CrystalWhole': 'Whole Crystal',
      'FacetEmpathy': 'Empathy Facet',
      'FacetNarrative': 'Narrative Facet',
      'FacetCraft': 'Craft Facet',
      'FacetSystem': 'System Facet',
      'FacetLeadership': 'Leadership Facet',
      'FacetExploration': 'Exploration Facet',
      'quartz-normal07': 'Normal Map Texture',
      'prismatic09-low': 'Environment (Low)',
      'prismatic09-medium': 'Environment (Medium)',
      'prismatic09-high': 'Environment (High)'
    };
    
    return friendlyNames[name] || filename;
  }

  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  setErrorCallback(callback) {
    this.errorCallback = callback;
  }

  _xhrLoad(url, responseType, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = responseType;
      xhr.timeout = 15000;

      if (onProgress) {
        xhr.onprogress = onProgress;
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(xhr.response);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error loading asset'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Timeout loading asset'));
      };

      xhr.send();
    });
  }

  async loadGLTF(url, key) {
    try {
      const response = await this._xhrLoad(
        url,
        'arraybuffer',
        (event) => {
          if (event.lengthComputable && this.progressCallback) {
            const progress = (event.loaded / event.total) * 100;
            this.progressCallback({
              type: 'gltf_download',
              key,
              url,
              progress,
              loaded: event.loaded,
              total: event.total,
              currentAsset: `Downloading ${this._getAssetNameFromUrl(url)}`
            });
          }
        }
      );

      return await new Promise((resolve, reject) => {
        this.gltfLoader.parse(
          response,
          '',
          (gltf) => {
            this.assets.set(key, gltf);
            this.loadedAssets++;

            if (this.progressCallback) {
              this.progressCallback({
                type: 'gltf_complete',
                key,
                url,
                progress: 100,
                currentAsset: `${this._getAssetNameFromUrl(url)} loaded`
              });
            }

            resolve(gltf);
          },
          (error) => {
            console.error(`Failed to parse GLTF ${key}:`, error);
            this.failedAssets++;
            reject(error);
          }
        );
      });
    } catch (error) {
      this.failedAssets++;
      if (this.errorCallback) {
        this.errorCallback(url, `Failed to load: ${url}`);
      }
      this.progressCallback?.({
        type: 'error',
        key,
        url,
        progress: this.getLoadingStats().progress,
        currentAsset: `${this._getAssetNameFromUrl(url)} failed`
      });
      throw error;
    }
  }

  async loadTexture(url, key) {
    try {
      const blob = await this._xhrLoad(
        url,
        'blob',
        (event) => {
          if (event.lengthComputable && this.progressCallback) {
            const progress = (event.loaded / event.total) * 100;
            this.progressCallback({
              type: 'texture_download',
              key,
              url,
              progress,
              loaded: event.loaded,
              total: event.total,
              currentAsset: `Loading ${this._getAssetNameFromUrl(url)}`
            });
          }
        }
      );

      const blobUrl = URL.createObjectURL(blob);

      return await new Promise((resolve, reject) => {
        this.textureLoader.load(
          blobUrl,
          (texture) => {
            URL.revokeObjectURL(blobUrl);
            this.assets.set(key, texture);
            this.loadedAssets++;

            if (this.progressCallback) {
              this.progressCallback({
                type: 'texture_complete',
                key,
                url,
                progress: 100,
                currentAsset: `${this._getAssetNameFromUrl(url)} loaded`
              });
            }

            resolve(texture);
          },
          undefined,
          (error) => {
            URL.revokeObjectURL(blobUrl);
            console.error(`Failed to load texture ${key}:`, error);
            this.failedAssets++;
            reject(error);
          }
        );
      });
    } catch (error) {
      this.failedAssets++;
      if (this.errorCallback) {
        this.errorCallback(url, `Failed to load: ${url}`);
      }
      this.progressCallback?.({
        type: 'error',
        key,
        url,
        progress: this.getLoadingStats().progress,
        currentAsset: `${this._getAssetNameFromUrl(url)} failed`
      });
      throw error;
    }
  }

  // COMPLETELY REWRITTEN: Simple, reliable HDRI loading
  async loadHDRI(url, key) {
    console.log(`🌍 Starting simple HDRI load: ${url}`);
    
    return new Promise((resolve, reject) => {
      // Use the THREE.js RGBELoader directly with its built-in loading
      const loader = new RGBELoader();
      loader.setDataType(THREE.FloatType);
      
      // Set a reasonable timeout
      const timeoutId = setTimeout(() => {
        console.error('🌍 HDRI load timed out');
        this.failedAssets++;
        reject(new Error('HDRI load timeout'));
      }, 10000); // 10 second timeout
      
      loader.load(
        url,
        // Success callback
        (texture) => {
          clearTimeout(timeoutId);
          console.log('🌍 HDRI loaded successfully');
          
          // Configure texture
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.flipY = false;
          
          this.assets.set(key, texture);
          this.loadedAssets++;
          
          if (this.progressCallback) {
            this.progressCallback({
              type: 'hdri_complete',
              key,
              url,
              progress: 100,
              currentAsset: `${this._getAssetNameFromUrl(url)} loaded`
            });
          }
          
          resolve(texture);
        },
        // Progress callback
        (progress) => {
          if (this.progressCallback) {
            const percent = progress.loaded && progress.total 
              ? (progress.loaded / progress.total) * 100 
              : 50;
            
            this.progressCallback({
              type: 'hdri_download',
              key,
              url,
              progress: percent,
              loaded: progress.loaded,
              total: progress.total,
              currentAsset: `Loading ${this._getAssetNameFromUrl(url)}`
            });
          }
        },
        // Error callback
        (error) => {
          clearTimeout(timeoutId);
          console.error('🌍 HDRI load failed:', error);
          this.failedAssets++;
          
          if (this.progressCallback) {
            this.progressCallback({
              type: 'error',
              key,
              url,
              progress: this.getLoadingStats().progress,
              currentAsset: `${this._getAssetNameFromUrl(url)} failed`
            });
          }
          
          reject(error);
        }
      );
    });
  }

  async loadAssets(assetList) {
    this.totalAssets = assetList.length;
    this.loadedAssets = 0;
    this.failedAssets = 0;
    
    // Shorter, more reasonable timeout wrapper
    const withTimeout = (promise, asset) => {
      return new Promise(resolve => {
        const timeoutDuration = 15000; // 15 seconds for all assets
        const timer = setTimeout(() => {
          console.error(`Timeout loading asset ${asset.key} after ${timeoutDuration}ms`);
          this.failedAssets++;
          this.progressCallback?.({
            type: 'timeout',
            key: asset.key,
            url: asset.url,
            progress: 100,
            currentAsset: `${this._getAssetNameFromUrl(asset.url)} timed out`
          });
          resolve(null);
        }, timeoutDuration);

        promise
          .then(result => { 
            clearTimeout(timer); 
            resolve(result); 
          })
          .catch(error => {
            clearTimeout(timer);
            console.error(`Failed to load asset ${asset.key}:`, error);
            this.progressCallback?.({
              type: 'error',
              key: asset.key,
              url: asset.url,
              progress: this.getLoadingStats().progress,
              currentAsset: `${this._getAssetNameFromUrl(asset.url)} failed`
            });
            resolve(null);
          });
      });
    };

    const promises = assetList.map(asset => {
      let loaderPromise;
      switch (asset.type) {
        case 'model':
          loaderPromise = this.loadGLTF(asset.url, asset.key);
          break;
        case 'texture':
          loaderPromise = this.loadTexture(asset.url, asset.key);
          break;
        case 'environment':
          loaderPromise = this.loadHDRI(asset.url, asset.key);
          break;
        default:
          loaderPromise = Promise.reject(new Error(`Unknown asset type: ${asset.type}`));
      }
      return withTimeout(loaderPromise, asset);
    });

    try {
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null);
      const failed = results.filter(r => r.status === 'rejected' || r.value === null);
      
      if (import.meta.env.DEV) {
        console.log(`Asset loading complete: ${successful.length}/${this.totalAssets} successful`);
        if (failed.length > 0) {
          console.warn(`${failed.length} assets failed to load`);
        }
      }
      
      return {
        totalAssets: this.totalAssets,
        loadedAssets: successful.length,
        failedAssets: failed.length,
        success: failed.length === 0
      };
      
    } catch (error) {
      console.error('Asset loading failed:', error);
      throw error;
    }
  }

  getAsset(key) {
    return this.assets.get(key);
  }

  hasAsset(key) {
    return this.assets.has(key);
  }

  getAllAssets() {
    return this.assets;
  }

  getLoadingStats() {
    return {
      total: this.totalAssets,
      loaded: this.loadedAssets,
      failed: this.failedAssets,
      progress: this.totalAssets > 0
        ? ((this.loadedAssets + this.failedAssets) / this.totalAssets) * 100
        : 0
    };
  }

  dispose() {
    this.assets.forEach((asset, key) => {
      if (asset && typeof asset.dispose === 'function') {
        asset.dispose();
      }
    });
    this.assets.clear();
    
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.failedAssets = 0;
  }
}