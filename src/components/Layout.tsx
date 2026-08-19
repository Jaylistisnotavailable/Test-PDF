// client/src/components/Layout.tsx

export const Toolbar = () => (
  <div className="flex flex-col items-center gap-3">
    <button className="p-2 rounded hover:bg-gray-100" title="选择">🖱️</button>
    <button className="p-2 rounded hover:bg-gray-100" title="矩形">⬜</button>
    <button className="p-2 rounded hover:bg-gray-100" title="圆形">⭕</button>
  </div>
);

export const Canvas = () => (
  <div className="w-full h-full bg-white shadow-lg rounded-lg flex items-center justify-center text-gray-400">
    PDF 画布区域
  </div>
);

export const RightPanel = () => (
  <div>
    <h3 className="font-semibold text-sm mb-4">图层</h3>
    <div className="text-sm text-gray-500">暂无图层</div>
  </div>
);
