import React, { useState } from 'react';
import { X, Tag as TagIcon, Check, Sparkles } from 'lucide-react';
import { useTracker } from '../../context/TrackerContext';

const PRESET_PALETTES = [
  { name: 'Rose Quartz', color: '#FB7185' },
  { name: 'Sakura Pink', color: '#EC4899' },
  { name: 'Lavender Mist', color: '#A855F7' },
  { name: 'Lilac Dream', color: '#C084FC' },
  { name: 'Mint Matcha', color: '#10B981' },
  { name: 'Soft Sky', color: '#38BDF8' },
  { name: 'Peach Glow', color: '#F59E0B' },
  { name: 'Coral Blossom', color: '#F43F5E' },
  { name: 'Butter Cream', color: '#EAB308' },
  { name: 'Teal Oasis', color: '#14B8A6' },
];

export const CreateTagModal: React.FC = () => {
  const { isCreateTagOpen, setIsCreateTagOpen, createTag } = useTracker();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_PALETTES[0].color);
  const [customColor, setCustomColor] = useState('');

  if (!isCreateTagOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const color = customColor.trim() || selectedColor;
    await createTag(name.trim(), color);
    setName('');
    setCustomColor('');
    setIsCreateTagOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel bg-white/95 dark:bg-zinc-900/95 rounded-3xl p-5 md:p-6 shadow-2xl border border-pink-200/80 dark:border-pink-800/60 relative">
        {/* Close Button */}
        <button
          onClick={() => setIsCreateTagOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-pink-100/50 dark:hover:bg-zinc-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-2xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-300">
            <TagIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-heading">
              Create New Tag 🌸
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Categorize your NEET subjects, topics, and routines
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tag Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Tag Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Botany 🌿, Organic Chem, Mock Practice..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/90 border border-pink-200 dark:border-pink-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50"
              autoFocus
            />
          </div>

          {/* Color Palette Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
              Select Tag Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_PALETTES.map((palette) => {
                const isSelected = !customColor && selectedColor === palette.color;
                return (
                  <button
                    key={palette.color}
                    type="button"
                    title={palette.name}
                    onClick={() => {
                      setSelectedColor(palette.color);
                      setCustomColor('');
                    }}
                    className={`h-9 rounded-2xl flex items-center justify-center transition-all shadow-xs active:scale-95 ${
                      isSelected ? 'ring-3 ring-pink-400 ring-offset-2 dark:ring-offset-zinc-900 scale-105' : 'hover:opacity-85'
                    }`}
                    style={{ backgroundColor: palette.color }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Preview Chip */}
            <div className="mt-3 flex items-center justify-between p-2.5 rounded-2xl bg-pink-50/60 dark:bg-zinc-800/60 border border-pink-100 dark:border-pink-900/40">
              <span className="text-xs text-slate-500 dark:text-slate-400">Tag Preview:</span>
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border shadow-xs"
                style={{
                  backgroundColor: `${customColor || selectedColor}18`,
                  borderColor: `${customColor || selectedColor}50`,
                  color: customColor || selectedColor,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: customColor || selectedColor }}
                />
                {name.trim() || 'Sample Tag'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-pink-100 dark:border-pink-900/40">
            <button
              type="button"
              onClick={() => setIsCreateTagOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 rounded-xl shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Save Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
