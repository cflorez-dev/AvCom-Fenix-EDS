/**
 * Mosaic Cards V2 Store - Singleton service
 * 
 * Stores information about all mosaic-cards-v2 instances and their cards.
 * This allows any component to access card data by groupId.
 * 
 * @example
 * import { getMosaicStore } from './blocks/mosaic-cards-v2/mosaic-cards-v2.store.js';
 * 
 * const store = getMosaicStore();
 * const groupData = store.getGroup('my-group-id');
 * console.log(groupData.cards); // Array of card objects
 */

class MosaicCardsV2Store {
  constructor() {
    if (MosaicCardsV2Store.instance) {
      return MosaicCardsV2Store.instance;
    }

    this.groups = new Map();
    MosaicCardsV2Store.instance = this;
  }

  /**
   * Register a mosaic-cards-v2 group with its cards
   * @param {string} groupId - The group identifier
   * @param {Object} data - Group data
   * @param {Array} data.cards - Array of card objects
   * @param {Object} data.metadata - Additional metadata (config, sections, etc.)
   */
  registerGroup(groupId, data) {
    if (!groupId) {
      console.warn('MosaicCardsV2Store: Cannot register group without groupId');
      return;
    }

    if (!data || !data.cards) {
      console.warn(`MosaicCardsV2Store: Cannot register group "${groupId}" without cards data`);
      return;
    }

    // CRITICAL: Only register ONCE - ignore subsequent calls to prevent duplication
    if (this.groups.has(groupId)) {
      // eslint-disable-next-line no-console
      console.log(`[STORE] registerGroup("${groupId}") SKIPPED - already registered with ${this.groups.get(groupId).cards.length} cards`);
      return;
    }

    // CRITICAL: Store a FROZEN COPY of cards to prevent any external mutations
    const cardsCopy = [...(data.cards || [])];
    Object.freeze(cardsCopy); // Prevent push/pop/splice etc.

    const groupData = {
      groupId,
      cards: cardsCopy,
      metadata: data.metadata || {},
      registeredAt: new Date().toISOString(),
    };

    this.groups.set(groupId, groupData);
  }

  /**
   * Get data for a specific group
   * @param {string} groupId - The group identifier
   * @returns {Object|null} Group data or null if not found
   */
  getGroup(groupId) {
    return this.groups.get(groupId) || null;
  }

  /**
   * Check if a group exists in the store
   * @param {string} groupId - The group identifier
   * @returns {boolean}
   */
  hasGroup(groupId) {
    return this.groups.has(groupId);
  }

  /**
   * Get all registered groups
   * @returns {Array} Array of all group data objects
   */
  getAllGroups() {
    return Array.from(this.groups.values());
  }

  /**
   * Get all group IDs
   * @returns {Array<string>} Array of group IDs
   */
  getAllGroupIds() {
    return Array.from(this.groups.keys());
  }

  /**
   * Get cards from a specific group
   * @param {string} groupId - The group identifier
   * @returns {Array} Array of cards or empty array if group not found (returns a copy)
   */
  getCards(groupId) {
    const group = this.getGroup(groupId);
    // eslint-disable-next-line no-console
    console.log(`[STORE] getCards("${groupId}") returning ${group ? group.cards.length : 0} cards (internal array)`);
    // ALWAYS return a deep copy to prevent mutations
    return group ? group.cards.map(card => ({ ...card })) : [];
  }

  /**
   * Get total count of cards across all groups
   * @returns {number} Total card count
   */
  getTotalCardCount() {
    let total = 0;
    this.groups.forEach((group) => {
      total += group.cards.length;
    });
    return total;
  }

  /**
   * Clear a specific group from the store
   * @param {string} groupId - The group identifier
   * @returns {boolean} True if group was removed, false if not found
   */
  clearGroup(groupId) {
    return this.groups.delete(groupId);
  }

  /**
   * Clear all groups from the store
   */
  clearAll() {
    this.groups.clear();
  }

  /**
   * Get store statistics
   * @returns {Object} Store statistics
   */
  getStats() {
    return {
      totalGroups: this.groups.size,
      totalCards: this.getTotalCardCount(),
      groupIds: this.getAllGroupIds(),
    };
  }
}

// Singleton instance
let storeInstance = null;

/**
 * Get the singleton instance of MosaicCardsV2Store
 * @returns {MosaicCardsV2Store} Store instance
 */
export function getMosaicStore() {
  if (!storeInstance) {
    storeInstance = new MosaicCardsV2Store();
  }
  return storeInstance;
}

/**
 * Helper function to register a group (shorthand)
 * @param {string} groupId - The group identifier
 * @param {Array} cards - Array of card objects
 * @param {Object} metadata - Optional metadata
 */
export function registerMosaicGroup(groupId, cards, metadata = {}) {
  const store = getMosaicStore();
  store.registerGroup(groupId, { cards, metadata });
}

/**
 * Helper function to get cards for a group (shorthand)
 * @param {string} groupId - The group identifier
 * @returns {Array} Array of cards
 */
export function getMosaicCards(groupId) {
  const store = getMosaicStore();
  return store.getCards(groupId);
}
