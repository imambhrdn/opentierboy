import Tier, {DEFAULT_TIER_TEMPLATE} from "@/models/Tier";
import Item from "@/models/Item";
import LZString from 'lz-string';

const CUSTOM_ITEMS_KEY = 'customItems';

interface EncodedState {
  title?: string;
  tiers: SimplifiedTier[];
}

interface SimplifiedTier {
  i: string; // id
  n: string; // name
  t: SimplifiedItem[]; // items
}

interface SimplifiedItem {
  i: string; // id
  c?: string; // content (for custom items only)
  u?: string; // imageUrl (for custom items only)
}

export interface TierWithSimplifiedItems extends Omit<Tier, 'items'> {
  items: SimplifiedItem[];
}

export class TierCortex {
  private customItemsMap: Map<string, SimplifiedItem> = new Map();
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.initializeCustomItemsMap();
  }

  private initializeCustomItemsMap(): void {
    if (this.customItemsMap.size === 0) {
      const customItems = this.loadCustomItemsFromLocalStorage();
      customItems.forEach(item => this.customItemsMap.set(item.i, item));
    }
  }

  private loadCustomItemsFromLocalStorage(): SimplifiedItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(CUSTOM_ITEMS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading custom items from localStorage:', error);
      return [];
    }
  }

  private saveCustomItemsToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const items = Array.from(this.customItemsMap.values());
      localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving custom items to localStorage:', error);
    }
  }

  public addCustomItems(items: Item[]): void {
    items.forEach(item => {
      const simplifiedItem: SimplifiedItem = {
        i: item.id,
        c: item.content,
        u: item.imageUrl
      };
      this.customItemsMap.set(item.id, simplifiedItem);
    });
    this.saveCustomItemsToLocalStorage();
  }

  public isCustomItem(itemId: string): boolean {
    return this.customItemsMap.has(itemId);
  }

  private resolveItem(itemId: string, content?: string): Item {
    const customItem = this.customItemsMap.get(itemId);

    if (customItem) {
      return {
        id: customItem.i,
        content: customItem.c || content || 'Unknown Item',
        imageUrl: customItem.u || ''
      };
    }

    // Fallback for any non-custom items
    return {
      id: itemId,
      content: content || 'Unknown Item',
      imageUrl: ''
    };
  }

  public getInitialTiers(initialState?: string, initialItemSet?: any): Tier[] {
    if (initialState) {
      const decodedState = this.decodeTierStateFromURL(initialState);
      if (decodedState) {
        return this.restoreItemsFromState(decodedState.tiers);
      }
    }

    const initialTiers: Tier[] = JSON.parse(JSON.stringify(DEFAULT_TIER_TEMPLATE));
    return initialTiers;
  }

  private restoreItemsFromState(simplifiedTiers: SimplifiedTier[]): Tier[] {
    return simplifiedTiers.map(simplifiedTier => ({
      id: simplifiedTier.i,
      name: simplifiedTier.n,
      items: simplifiedTier.t.map(item => this.resolveItem(item.i, item.c)),
      labelPosition: 'left'
    }));
  }

  public encodeTierStateForURL(title: string, tiers: TierWithSimplifiedItems[]): string {
    const state: EncodedState = {
      title,
      tiers: tiers.map(tier => ({
        i: tier.id,
        n: tier.name,
        t: tier.items
      }))
    };

    const jsonString = JSON.stringify(state);
    return (LZString as any).compressToEncodedURIComponent(jsonString);
  }

  public decodeTierStateFromURL(encodedState: string): EncodedState | null {
    try {
      const jsonString = (LZString as any).decompressFromEncodedURIComponent(encodedState);
      if (!jsonString) return null;

      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error decoding tier state:', error);
      return null;
    }
  }

  public getOgSafeImageUrl(url: string): string {
    // Convert WebP to PNG
    if (url.toLowerCase().endsWith('.webp')) {
      url = url.substring(0, url.length - 5) + '.png';
    }

    // Make URL absolute if it's not already
    if (!url.startsWith('http') && url) {
      url = new URL(url, this.baseUrl).toString();
    }

    return url;
  }

  public getOgSafeItem(item: Item | SimplifiedItem): Item {
    // Convert SimplifiedItem to Item if needed
    if ('i' in item) {
      const fullItem = this.resolveItem(item.i, item.c);
      return {
        ...fullItem,
        imageUrl: this.getOgSafeImageUrl(fullItem.imageUrl ?? '')
      };
    }

    // Already an Item
    return {
      ...item,
      imageUrl: this.getOgSafeImageUrl((item as Item).imageUrl ?? '')
    };
  }

  public getAbsoluteUrl(path: string): string {
    if (!path) return '';
    try {
      return new URL(path, this.baseUrl).toString();
    } catch {
      return path;
    }
  }

  public getAssetUrl(path: string): string {
    return this.getAbsoluteUrl(path);
  }

  public getOgTierGradient(index: number, totalTiers: number): string {
    const hue = (index * 360) / totalTiers;
    return `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 30}, 70%, 40%))`;
  }
}