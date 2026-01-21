import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VERTICALS_DATA = {
  Technology: [
    { level: 1, name: 'Adopts', description: 'Actively learns and adopts the technology and tools defined by the team' },
    { level: 2, name: 'Specializes', description: 'Is the go-to person for one or more technologies and takes initiative to learn new ones' },
    { level: 3, name: 'Evangelizes', description: 'Researches, creates proofs of concept and introduces new technologies to the team' },
    { level: 4, name: 'Masters', description: 'Has very deep knowledge about the whole technology stack of the system' },
    { level: 5, name: 'Creates', description: 'Designs and creates new technologies that are widely used either by internal or external teams' }
  ],
  System: [
    { level: 1, name: 'Enhances', description: 'Successfully pushes new features and bug fixes to improve and extend the system' },
    { level: 2, name: 'Designs', description: 'Designs and implements medium to large size features while reducing the system\'s tech debt' },
    { level: 3, name: 'Owns', description: 'Owns the production operation and monitoring of the system and is aware of its SLAs' },
    { level: 4, name: 'Evolves', description: 'Evolves the architecture to support future requirements and defines its SLAs' },
    { level: 5, name: 'Leads', description: 'Leads the technical excellence of the system and creates plans to mitigate outages' }
  ],
  People: [
    { level: 1, name: 'Learns', description: 'Quickly learns from others and consistently steps up when it is required' },
    { level: 2, name: 'Supports', description: 'Proactively supports other team members and helps them to be successful' },
    { level: 3, name: 'Mentors', description: 'Mentors others to accelerate their career-growth and encourages them to participate' },
    { level: 4, name: 'Coordinates', description: 'Coordinates team members providing effective feedback and moderating discussions' },
    { level: 5, name: 'Manages', description: 'Manages the team members\' career, expectations, performance and level of happiness' }
  ],
  Process: [
    { level: 1, name: 'Follows', description: 'Follows the team processes, delivering a consistent flow of features to production' },
    { level: 2, name: 'Enforces', description: 'Enforces the team processes, making sure everybody understands the benefits and tradeoffs' },
    { level: 3, name: 'Challenges', description: 'Challenges the team processes, looking for ways to improve them' },
    { level: 4, name: 'Adjusts', description: 'Adjusts the team processes, listening to feedback and guiding the team through the changes' },
    { level: 5, name: 'Defines', description: 'Defines the right processes for the team\'s maturity level, balancing agility and discipline' }
  ],
  Influence: [
    { level: 1, name: 'Subsystem', description: 'Makes an impact on one or more subsystems' },
    { level: 2, name: 'Team', description: 'Makes an impact on the whole team, not just on specific parts of it' },
    { level: 3, name: 'Multiple Teams', description: 'Makes an impact not only on their team but also on other teams' },
    { level: 4, name: 'Company', description: 'Makes an impact on the whole tech organization' },
    { level: 5, name: 'Community', description: 'Makes an impact on the tech community' }
  ]
};

const verticalColors = {
  Technology: 'bg-indigo-500',
  System: 'bg-cyan-500',
  People: 'bg-amber-500',
  Process: 'bg-emerald-500',
  Influence: 'bg-pink-500'
};

const verticalBgColors = {
  Technology: 'bg-indigo-50 border-indigo-200',
  System: 'bg-cyan-50 border-cyan-200',
  People: 'bg-amber-50 border-amber-200',
  Process: 'bg-emerald-50 border-emerald-200',
  Influence: 'bg-pink-50 border-pink-200'
};

export default function LevelSelector({ 
  vertical, 
  currentLevel, 
  goalLevel, 
  selfAssessmentLevel = 0,
  onCurrentChange, 
  onGoalChange 
}) {
  const [expanded, setExpanded] = useState(false);
  const levels = VERTICALS_DATA[vertical];
  const currentLevelData = levels.find(l => l.level === currentLevel);
  const goalLevelData = levels.find(l => l.level === goalLevel);
  const selfAssessmentLevelData = levels.find(l => l.level === selfAssessmentLevel);

  return (
    <div className={`rounded-xl border ${verticalBgColors[vertical]} overflow-hidden`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full ${verticalColors[vertical]}`} />
          <div className="text-left">
            <h3 className="font-semibold text-slate-800">{vertical}</h3>
            <div className="text-xs space-y-0.5">
              <p className="text-slate-600">
                {currentLevelData ? `Current: L${currentLevel} ${currentLevelData.name}` : 'Current: Not set'}
              </p>
              {goalLevelData && goalLevel > 0 && (
                <p className="text-slate-600">
                  Goal: L{goalLevel} {goalLevelData.name}
                </p>
              )}
              {selfAssessmentLevelData && selfAssessmentLevel > 0 && (
                <p className="text-purple-600">
                  Self: L{selfAssessmentLevel} {selfAssessmentLevelData.name}
                </p>
              )}
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {levels.map((level) => (
            <div
              key={level.level}
              className={`p-3 rounded-lg bg-white border transition-all ${
                currentLevel === level.level ? 'border-emerald-400 ring-1 ring-emerald-200' : 
                goalLevel === level.level ? 'border-amber-400 ring-1 ring-amber-200' : 
                selfAssessmentLevel === level.level ? 'border-purple-400 ring-1 ring-purple-200' :
                'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">L{level.level}</span>
                    <span className="font-medium text-slate-700">{level.name}</span>
                    {selfAssessmentLevel === level.level && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Self
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{level.description}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant={currentLevel === level.level ? "default" : "outline"}
                    className={`h-7 px-2 text-xs ${currentLevel === level.level ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCurrentChange(currentLevel === level.level ? 0 : level.level);
                    }}
                  >
                    Current
                  </Button>
                  <Button
                    size="sm"
                    variant={goalLevel === level.level ? "default" : "outline"}
                    className={`h-7 px-2 text-xs ${goalLevel === level.level ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onGoalChange(goalLevel === level.level ? 0 : level.level);
                    }}
                  >
                    Goal
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { VERTICALS_DATA };