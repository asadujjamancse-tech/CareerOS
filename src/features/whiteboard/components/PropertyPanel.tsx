interface Props {
  strokeColor: string
  fillColor: string
  strokeWidth: number
  fontSize: number
  dashed: boolean
  onStrokeColorChange: (v: string) => void
  onFillColorChange: (v: string) => void
  onStrokeWidthChange: (v: number) => void
  onFontSizeChange: (v: number) => void
  onDashedChange: (v: boolean) => void
  background: string
  onBackgroundChange: (v: string) => void
}

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#e2e8f0', '#6b7280',
]

const PRESET_FILLS = [
  '#1e3a5f', '#1a4731', '#451a03', '#450a0a', '#2d1657',
  '#1a3a3a', '#1c2e4a', '#172554', '#1e1e2e', 'transparent',
]

const BG_PRESETS = [
  '#1e1e2e', '#0f0f23', '#0d1117', '#1a1a1a', '#f8f9fa',
]

export function PropertyPanel({
  strokeColor, fillColor, strokeWidth, fontSize, dashed,
  onStrokeColorChange, onFillColorChange, onStrokeWidthChange, onFontSizeChange, onDashedChange,
  background, onBackgroundChange,
}: Props) {
  return (
    <div className="w-48 shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-y-auto">
      <div className="p-2 border-b border-zinc-800">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Style</p>
      </div>

      <div className="p-2 space-y-3 text-xs">
        {/* Stroke */}
        <div>
          <label className="block text-zinc-500 mb-1 text-[10px]">Stroke Color</label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={strokeColor}
              onChange={e => onStrokeColorChange(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
            <div className="flex flex-wrap gap-0.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  style={{ background: c }}
                  onClick={() => onStrokeColorChange(c)}
                  className="w-4 h-4 rounded-sm border border-black/20 transition-transform hover:scale-110"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Fill */}
        <div>
          <label className="block text-zinc-500 mb-1 text-[10px]">Fill Color</label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={fillColor === 'transparent' ? '#000000' : fillColor}
              onChange={e => onFillColorChange(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
            <div className="flex flex-wrap gap-0.5">
              {PRESET_FILLS.map(c => (
                <button
                  key={c}
                  type="button"
                  style={{ background: c === 'transparent' ? undefined : c }}
                  onClick={() => onFillColorChange(c)}
                  className="w-4 h-4 rounded-sm border border-zinc-600 transition-transform hover:scale-110 text-[8px] text-zinc-500"
                >
                  {c === 'transparent' ? '∅' : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stroke width */}
        <div>
          <label className="block text-zinc-500 mb-1 text-[10px]">Stroke Width: {strokeWidth}px</label>
          <input
            type="range"
            min="1"
            max="12"
            value={strokeWidth}
            onChange={e => onStrokeWidthChange(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        {/* Font size */}
        <div>
          <label className="block text-zinc-500 mb-1 text-[10px]">Font Size: {fontSize}px</label>
          <input
            type="range"
            min="8"
            max="48"
            value={fontSize}
            onChange={e => onFontSizeChange(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        {/* Dashed */}
        <div className="flex items-center justify-between">
          <label className="text-zinc-400 text-[10px]">Dashed</label>
          <button
            type="button"
            onClick={() => onDashedChange(!dashed)}
            className={`w-9 h-5 rounded-full transition-colors ${dashed ? 'bg-blue-600' : 'bg-zinc-700'}`}
          >
            <span
              className={`block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mx-0.5 ${dashed ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
        </div>

        <div className="border-t border-zinc-800 pt-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Canvas</p>

          <label className="block text-zinc-500 mb-1 text-[10px]">Background</label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={background}
              onChange={e => onBackgroundChange(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
            <div className="flex flex-wrap gap-0.5">
              {BG_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  style={{ background: c, border: background === c ? '2px solid #3b82f6' : '1px solid #4a4a6a' }}
                  onClick={() => onBackgroundChange(c)}
                  className="w-4 h-4 rounded-sm transition-transform hover:scale-110"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
