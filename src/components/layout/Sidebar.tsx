import { PANEL_GROUPS } from "../../lib/constants";

interface SidebarProps {
  activePanel: string;
  onSelectPanel: (panel: string) => void;
}

export function Sidebar({ activePanel, onSelectPanel }: SidebarProps) {
  return (
    <aside className="flex w-52 flex-col border-r border-gray-800 bg-gray-900">
      <div className="border-b border-gray-800 p-4">
        <h1 className="text-lg font-bold text-white">iDotMatrix</h1>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {PANEL_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            <h2 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {group.label}
            </h2>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectPanel(item.id)}
                className={`w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
                  activePanel === item.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
