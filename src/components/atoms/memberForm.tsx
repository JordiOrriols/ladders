import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LevelSelector from './LevelSelector';
import RadarChart from './RadarChart';

const VERTICALS = ['Technology', 'System', 'People', 'Process', 'Influence'];

export default function MemberForm({ member, onSave, onClose }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [currentLevels, setCurrentLevels] = useState({});
  const [goalLevels, setGoalLevels] = useState({});
  const [selfAssessmentLevels, setSelfAssessmentLevels] = useState({});

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setRole(member.role || '');
      setCurrentLevels(member.currentLevels || {});
      setGoalLevels(member.goalLevels || {});
      setSelfAssessmentLevels(member.selfAssessmentLevels || {});
    }
  }, [member]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: member?.id || Date.now().toString(),
      name: name.trim(),
      role: role.trim(),
      currentLevels,
      goalLevels,
      selfAssessmentLevels
    });
  };

  const handleImportAssessment = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.name && !name) {
          setName(data.name);
        }
        if (data.role && !role) {
          setRole(data.role);
        }
        if (data.currentLevels) {
          setSelfAssessmentLevels(data.currentLevels);
        }
      } catch (error) {
        alert('Failed to import file. Please ensure it\'s a valid self-assessment JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleCurrentChange = (vertical, level) => {
    setCurrentLevels(prev => ({ ...prev, [vertical]: level }));
  };

  const handleGoalChange = (vertical, level) => {
    setGoalLevels(prev => ({ ...prev, [vertical]: level }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role (optional)</Label>
                  <Input
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Engineer"
                    className="mt-1"
                  />
                </div>
                <div>
                  <input
                    type="file"
                    id="import-assessment-file"
                    accept=".json"
                    onChange={handleImportAssessment}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('import-assessment-file').click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Self Assessment
                  </Button>
                  {Object.keys(selfAssessmentLevels).length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Self assessment imported successfully
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Competencies</Label>
                {VERTICALS.map(vertical => (
                  <LevelSelector
                    key={vertical}
                    vertical={vertical}
                    currentLevel={currentLevels[vertical] || 0}
                    goalLevel={goalLevels[vertical] || 0}
                    selfAssessmentLevel={selfAssessmentLevels[vertical] || 0}
                    onCurrentChange={(level) => handleCurrentChange(vertical, level)}
                    onGoalChange={(level) => handleGoalChange(vertical, level)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center lg:sticky lg:top-6">
              <h3 className="text-sm font-medium text-slate-500 mb-4">Preview</h3>
              <RadarChart
                currentLevels={currentLevels}
                goalLevels={goalLevels}
                selfAssessmentLevels={selfAssessmentLevels}
                size={320}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {member ? 'Save Changes' : 'Add Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}