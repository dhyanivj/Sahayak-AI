import React from 'react';
import {
  X,
  History,
  Trash2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { ScannedRecord, SahayakMode } from '../types';

interface ScannedHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ScannedRecord[];
  onSelectRecord: (record: ScannedRecord) => void;
  onClearHistory: () => void;
}

export const ScannedHistoryModal: React.FC<ScannedHistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onSelectRecord,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="scan-history-title">
      <div className="bg-white border border-neutral-200 rounded-md w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded border border-neutral-200 bg-neutral-50 text-neutral-900 flex items-center justify-center shrink-0">
              <History className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 id="scan-history-title" className="text-sm font-semibold text-neutral-900">
                Past Items You Checked
              </h3>
              <p className="text-xs text-neutral-500">
                {records.length} item{records.length === 1 ? '' : 's'} saved on this device
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="h-8 px-2.5 rounded-md border border-neutral-200 hover:border-red-500 text-neutral-600 hover:text-red-600 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Clear scanned history"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-7 h-7 rounded border border-neutral-200 hover:border-neutral-900 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
              title="Close history"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
          {records.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs">
              <History className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <h4 className="text-neutral-900 font-semibold text-sm">
                No past items saved yet
              </h4>
              <p className="text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Bills, medicine bottles, letters, and questions you check will appear here so you can review them anytime.
              </p>
            </div>
          ) : (
            records.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-neutral-200 hover:border-neutral-900 rounded-md p-3.5 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded object-cover border border-neutral-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded border border-neutral-200 bg-neutral-50 flex items-center justify-center text-xs font-semibold text-neutral-600 shrink-0">
                      Photo
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {item.is_urgent_or_scam ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-600 text-white">
                          Caution: Scam / Risk
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-800">
                          Safe
                        </span>
                      )}
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{item.timestamp}</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-neutral-900 truncate">
                      {item.headline}
                    </h4>

                    <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                      {item.payload.voice_readout}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectRecord(item);
                      onClose();
                    }}
                    className="h-8 px-3 rounded-md bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-5 py-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>Private and saved on your device only</span>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-900 font-medium hover:underline cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
