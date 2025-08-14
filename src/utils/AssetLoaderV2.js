// src/utils/AssetLoaderV2.js
// FIXED: Real GLTF loading progress with accurate progress tracking

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
      // This gets called for each individual asset
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
      // Notify progress callback so progress reflects this failure
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
    
    // Convert filenames to friendly names
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

  async loadGLTF(url, key) {
    return new Promise((resolve, reject) => {
      // Use a custom progress tracking approach for GLTF
      let lastProgress = 0;
      
      // Create XHR to track actual download progress
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.timeout = 15000;
      
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          if (this.progressCallback && progress > lastProgress) {
            this.progressCallback({
              type: 'gltf_download',
              key,
              url,
              progress,
              loaded: event.loaded,
              total: event.total,
              currentAsset: `Downloading ${this._getAssetNameFromUrl(url)}`
            });
            lastProgress = progress;
          }
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          // Now parse the GLTF data
          if (this.progressCallback) {
            this.progressCallback({
              type: 'gltf_parse',
              key,
              url,
              progress: 100,
              currentAsset: `Parsing ${this._getAssetNameFromUrl(url)}`
            });
          }
          
          // Use GLTFLoader to parse the downloaded data
          this.gltfLoader.parse(
            xhr.response,
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
              this.progressCallback?.({
                type: 'error',
                key,
                url,
                progress: this.getLoadingStats().progress,
                currentAsset: `${this._getAssetNameFromUrl(url)} failed`
              });
              reject(error);
            }
          );
        } else {
          const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
          console.error(`Failed to download GLTF ${key}:`, error);
          this.failedAssets++;
          this.progressCallback?.({
            type: 'error',
            key,
            url,
            progress: this.getLoadingStats().progress,
            currentAsset: `${this._getAssetNameFromUrl(url)} failed`
          });
          reject(error);
        }
      };

      xhr.onerror = () => {
        const error = new Error('Network error downloading GLTF');
        console.error(`Network error loading GLTF ${key}:`, error);
        this.failedAssets++;
        this.progressCallback?.({
          type: 'error',
          key,
          url,
          progress: this.getLoadingStats().progress,
          currentAsset: `${this._getAssetNameFromUrl(url)} failed`
        });
        reject(error);
      };

      xhr.ontimeout = () => {
        const error = new Error('Timeout downloading GLTF');
        console.error(`Timeout loading GLTF ${key}:`, error);
        this.failedAssets++;
        this.progressCallback?.({
          type: 'error',
          key,
          url,
          progress: this.getLoadingStats().progress,
          currentAsset: `${this._getAssetNameFromUrl(url)} failed`
        });
        reject(error);
      };

      xhr.send();
    });
  }

  async loadTexture(url, key) {
    return new Promise((resolve, reject) => {
      // Track texture loading progress using XHR
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'blob';
      xhr.timeout = 15000;
      
      xhr.onprogress = (event) => {
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
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const blob = xhr.response;
          const blobUrl = URL.createObjectURL(blob);
          
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
              this.progressCallback?.({
                type: 'error',
                key,
                url,
                progress: this.getLoadingStats().progress,
                currentAsset: `${this._getAssetNameFromUrl(url)} failed`
              });
              reject(error);
            }
          );
        } else {
          const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
          console.error(`Failed to download texture ${key}:`, error);
          this.failedAssets++;
          this.progressCallback?.({
            type: 'error',
            key,
            url,
            progress: this.getLoadingStats().progress,
            currentAsset: `${this._getAssetNameFromUrl(url)} failed`
          });
          reject(error);
        }
      };

      xhr.onerror = () => {
        const error = new Error('Network error downloading texture');
        console.error(`Network error loading texture ${key}:`, error);
        this.failedAssets++;
        this.progressCallback?.({
          type: 'error',
          key,
          url,
          progress: this.getLoadingStats().progress,
          currentAsset: `${this._getAssetNameFromUrl(url)} failed`
        });
        reject(error);
      };

      xhr.ontimeout = () => {
        const error = new Error('Timeout downloading texture');
        console.error(`Timeout loading texture ${key}:`, error);
        this.failedAssets++;
        this.progressCallback?.({
          type: 'error',
          key,
          url,
          progress: this.getLoadingStats().progress,
          currentAsset: `${this._getAssetNameFromUrl(url)} failed`
        });
        reject(error);
      };

      xhr.send();
    });
  }

  async loadHDRI(url, key) {
    return new Promise((resolve, reject) => {
      // Track HDRI loading progress
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.timeout = 15000;
      
      xhr.onprogress = (event) => {
        if (event.lengthComputable && this.progressCallback) {
          const progress = (event.loaded / event.total) * 100;
          this.progressCallback({
            type: 'hdri_download',
            key,
            url,
            progress,
            loaded: event.loaded,
            total: event.total,
            currentAsset: `Loading ${this._getAssetNameFromUrl(url)}`
          });
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          // Parse the HDRI data
          if (this.progressCallback) {
            this.progressCallback({
              type: 'hdri_parse',
              key,
              url,
              progress: 100,
              currentAsset: `Processing ${this._getAssetNameFromUrl(url)}`
            });
          }
          
          this.rgbeLoader.parse(xhr.response, (texture) => {
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
          });
        } else {
          const error = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
          console.error(`Failed to download HDRI ${key}:`, error);
          this.failedAssets++;
          this.progressCallback?.({
            type: 'error',
            key,
            url,
            progress: this.getLoadingStats().progress,
            currentAsset: `${this._getAssetNameFromUrl(url)} failed`
          });
          reject(error);
        }
      };

      xhr.onerror = () => {
        const error = new Error('Network error downloading HDRI');
        console.error(`Network error loading HDRI ${key}:`, error);
        this.failedAssets++;
        this.progressCallback?.({
          type: 'error',
          key,
          url,
          progress: this.getLoadingStats().progress,
          currentAsset: `${this._getAssetNameFromUrl(url)} failed`
        });
        reject(error);
      };

      xhr.ontimeout = () => {
        const error = new Error('Timeout downloading HDRI');
        console.error(`Timeout loading HDRI ${key}:`, error);
        this.failedAssets++;
        this.progressCallback?.({
          type: 'error',
          key,
          url,
          progress: this.getLoadingStats().progress,
          currentAsset: `${this._getAssetNameFromUrl(url)} failed`
        });
        reject(error);
      };

      xhr.send();
    });
  }

  async loadAssets(assetList) {
    this.totalAssets = assetList.length;
    this.loadedAssets = 0;
    this.failedAssets = 0;
    
    // Helper to prevent hanging requests – force-settle after timeout
    const withTimeout = (promise, asset) => {
      return new Promise(resolve => {
        const timer = setTimeout(() => {
          console.error(`Timeout loading asset ${asset.key}`);
          this.failedAssets++;
          // Notify progress callback so UI can update
          this.progressCallback?.({
            type: 'timeout',
            key: asset.key,
            url: asset.url,
            progress: 100,
            currentAsset: `${this._getAssetNameFromUrl(asset.url)} failed`
          });
          resolve(null);
        }, 15000);

        promise
          .then(result => { clearTimeout(timer); resolve(result); })
          .catch(error => {
            clearTimeout(timer);
            console.error(`Failed to load asset ${asset.key}:`, error);
            // Notify progress callback so UI can update
            this.progressCallback?.({
              type: 'error',
              key: asset.key,
              url: asset.url,
              progress: this.getLoadingStats().progress,
              currentAsset: `${this._getAssetNameFromUrl(asset.url)} failed`
            });
            // Don't reject – continue loading other assets
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
      // Count both successful and failed attempts toward completion so progress reaches 100%
      progress: this.totalAssets > 0
        ? ((this.loadedAssets + this.failedAssets) / this.totalAssets) * 100
        : 0
    };
  }

  dispose() {
    // Clean up assets
    this.assets.forEach((asset, key) => {
      if (asset && typeof asset.dispose === 'function') {
        asset.dispose();
      }
    });
    this.assets.clear();
    
    // Reset counters
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.failedAssets = 0;
  }
}