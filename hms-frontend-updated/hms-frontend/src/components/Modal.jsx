import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-md",
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${width} max-h-[85dvh] flex flex-col bg-white rounded-xl border border-line shadow-xl overflow-hidden`}
      >
        {/* Header - fixed */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-soft hover:bg-paper-dim transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body - scrolls, takes remaining space */}
        <div className="p-5 overflow-y-auto min-h-0 flex-1">{children}</div>

        {/* Footer - fixed, only renders if provided */}
        {footer && (
          <div className="px-5 py-4 border-t border-line shrink-0 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
