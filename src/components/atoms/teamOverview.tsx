import React from 'react';
import RadarChart from './radarChart';
import { Users } from 'lucide-react';

const memberColors = [
  { fill: 'rgba(99, 102, 241, 0.2)', stroke: '#6366f1' },
  { fill: 'rgba(6, 182, 212, 0.2)', stroke: '#06b6d4' },
  { fill: 'rgba(245, 158, 11, 0.2)', stroke: '#f59e0b' },
  { fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10b981' },
  { fill: 'rgba(236, 72, 153, 0.2)', stroke: '#ec4899' },
  { fill: 'rgba(139, 92, 246, 0.2)', stroke: '#8b5cf6' },
  { fill: 'rgba(244, 63, 94, 0.2)', stroke: '#f43f5e' },
  { fill: 'rgba(34, 197, 94, 0.2)', stroke: '#22c55e' }
];

export default function TeamOverview({ members }) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Users className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">No team members yet</p>
        <p className="text-sm">Add members to see the team overview</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member, index) => (
          <div 
            key={member.id}
            className="bg-white rounded-2xl border border-slate-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: memberColors[index % memberColors.length].stroke }}
              />
              <div>
                <h3 className="font-semibold text-slate-800">{member.name}</h3>
                {member.role && (
                  <p className="text-xs text-slate-500">{member.role}</p>
                )}
              </div>
            </div>
            <div className="flex justify-center">
              <RadarChart
                currentLevels={member.currentLevels}
                goalLevels={member.goalLevels}
                selfAssessmentLevels={member.selfAssessmentLevels}
                size={200}
                showLabels={false}
                showLegend={false}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Team Legend</h3>
        <div className="flex flex-wrap gap-4">
          {members.map((member, index) => (
            <div key={member.id} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: memberColors[index % memberColors.length].stroke }}
              />
              <span className="text-sm text-slate-600">{member.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}