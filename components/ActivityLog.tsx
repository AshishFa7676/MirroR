
import React from 'react';
import { LogEntry, LogType } from '../types';

interface ActivityLogProps {
  logs: LogEntry[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  const getTypeColor = (type: LogType) => {
    switch (type) {
      // Fix: Map missing TASK_COMPLETED_VERIFIED/UNVERIFIED to QUIZ_SUCCESS
      case LogType.QUIZ_SUCCESS:
        return 'text-green-500 border-green-900';
      // Fix: Map missing TASK_ABORTED to CONTRACT_BREACHED and include QUIZ_FAILURE in red
      case LogType.CONTRACT_BREACHED:
      case LogType.QUIZ_FAILURE:
        return 'text-red-500 border-red-900';
      // Fix: Map missing TASK_PAUSED_INTERROGATION to SOCRATIC_INTERROGATION and include GHOSTING_DETECTED in yellow
      case LogType.SOCRATIC_INTERROGATION:
      case LogType.GHOSTING_DETECTED:
        return 'text-yellow-500 border-yellow-900';
      default: return 'text-gray-400 border-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-gray-800 p-4 overflow-hidden">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">
        The Registry (Immutable Record)
      </h2>
      <div className="overflow-y-auto flex-1 space-y-3 pr-2">
        {sortedLogs.length === 0 && (
          <div className="text-gray-600 text-sm italic text-center pt-10">No actions recorded. Existence is currently theoretical.</div>
        )}
        {sortedLogs.map((log) => (
          <div key={log.id} className={`border-l-2 pl-3 py-1 ${getTypeColor(log.type)}`}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[10px] font-mono opacity-60">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[10px] font-bold uppercase">{log.type.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-sm font-mono text-gray-300 whitespace-pre-wrap">{log.content}</p>
            {log.metadata && log.metadata.feedback && (
                <div className="mt-2 text-xs text-red-400 italic border-l border-red-900 pl-2">
                    " {log.metadata.feedback} "
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
