import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Tag Store
 * Manages service tags with persistence
 */
export const useTagStore = create(
    persist(
        (set, get) => ({
            // State
            tags: [],

            // Actions
            addTag: (tag) => {
                const newTag = {
                    id: tag.id || Date.now().toString(),
                    name: tag.name,
                    color: tag.color,
                    createdAt: tag.createdAt || new Date().toISOString(),
                };
                set((state) => ({
                    tags: [...state.tags, newTag],
                }));
            },

            updateTag: (tagId, updates) => {
                set((state) => ({
                    tags: state.tags.map((tag) =>
                        tag.id === tagId ? { ...tag, ...updates } : tag
                    ),
                }));
            },

            deleteTag: (tagId) => {
                set((state) => ({
                    tags: state.tags.filter((tag) => tag.id !== tagId),
                }));
            },

            setTags: (tags) => {
                set({ tags });
            },

            getTagById: (tagId) => {
                return get().tags.find((tag) => tag.id === tagId);
            },

            getTagByName: (name) => {
                return get().tags.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
            },
        }),
        {
            name: 'dallal-tags',
            version: 1,
        }
    )
);
