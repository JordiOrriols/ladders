import React, { useState, useEffect } from 'react';
import { Plus, Users, User, LayoutGrid, Info, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MemberCard from '@/components/MemberCard';
import MemberForm from '@/components/MemberForm';
import TeamOverview from '@/components/TeamOverview';
import RadarChart from '@/components/RadarChart';
import LevelSelector, { VERTICALS_DATA } from '@/components/LevelSelector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STORAGE_KEY = 'engineering-ladder-data';

export default function Home() {
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showReference, setShowReference] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setMembers(data);
    }
  }, []);

  // Save to localStorage whenever members change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  const handleSaveMember = (member) => {
    setMembers(prev => {
      const exists = prev.find(m => m.id === member.id);
      const updated = exists
        ? prev.map(m => m.id === member.id ? member : m)
        : [...prev, member];
      // Save immediately to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setShowForm(false);
    setEditingMember(null);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleDeleteMember = (id) => {
    setMembers(prev => {
      const updated = prev.filter(m => m.id !== id);
      // Save immediately to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setDeleteId(null);
    if (selectedMember?.id === id) {
      setSelectedMember(null);
    }
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">Engineering Ladder</h1>
                <p className="text-xs text-slate-500">Team competency tracker</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to={createPageUrl('SelfAssessment')}>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex"
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Self Assessment
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReference(true)}
                className="hidden sm:flex"
              >
                <Info className="w-4 h-4 mr-2" />
                Reference
              </Button>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="team" className="space-y-6">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="team" className="data-[state=active]:bg-slate-100">
              <Users className="w-4 h-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="individual" className="data-[state=active]:bg-slate-100">
              <User className="w-4 h-4 mr-2" />
              Individual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="mt-6">
            {members.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No team members yet</h3>
                <p className="text-slate-500 mb-6">Add your first team member to start tracking competencies</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Member
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {members.map(member => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onEdit={handleEditMember}
                    onDelete={(id) => setDeleteId(id)}
                    onClick={() => handleMemberClick(member)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="individual" className="mt-6">
            {members.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No team members</h3>
                <p className="text-slate-500 mb-6">Add team members to view individual profiles</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Member List */}
                <div className="lg:col-span-1 space-y-2">
                  <h3 className="text-sm font-medium text-slate-500 mb-3 px-1">Select a member</h3>
                  {members.map(member => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        selectedMember?.id === member.id 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedMember?.id === member.id 
                            ? 'bg-indigo-100' 
                            : 'bg-slate-100'
                        }`}>
                          <User className={`w-5 h-5 ${
                            selectedMember?.id === member.id 
                              ? 'text-indigo-600' 
                              : 'text-slate-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{member.name}</p>
                          {member.role && (
                            <p className="text-xs text-slate-500">{member.role}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected Member Detail */}
                <div className="lg:col-span-2">
                  {selectedMember ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-semibold text-slate-800">{selectedMember.name}</h2>
                          {selectedMember.role && (
                            <p className="text-slate-500">{selectedMember.role}</p>
                          )}
                        </div>
                        <Button variant="outline" onClick={() => handleEditMember(selectedMember)}>
                          Edit
                        </Button>
                      </div>

                      <div className="flex justify-center mb-8">
                        <RadarChart
                          currentLevels={selectedMember.currentLevels}
                          goalLevels={selectedMember.goalLevels}
                          selfAssessmentLevels={selectedMember.selfAssessmentLevels}
                          size={350}
                        />
                      </div>

                      {/* Competency Details */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800">Competency Details</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {Object.keys(VERTICALS_DATA).map(vertical => {
                            const currentLevel = selectedMember.currentLevels[vertical] || 0;
                            const goalLevel = selectedMember.goalLevels[vertical] || 0;
                            const selfAssessmentLevel = selectedMember.selfAssessmentLevels?.[vertical] || 0;
                            const currentData = VERTICALS_DATA[vertical].find(l => l.level === currentLevel);
                            const goalData = VERTICALS_DATA[vertical].find(l => l.level === goalLevel);
                            const selfAssessmentData = VERTICALS_DATA[vertical].find(l => l.level === selfAssessmentLevel);

                            return (
                              <div key={vertical} className="p-4 bg-slate-50 rounded-xl">
                                <h4 className="font-medium text-slate-700 mb-2">{vertical}</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-slate-600">
                                      {currentData ? `L${currentLevel}: ${currentData.name}` : 'Not set'}
                                    </span>
                                  </div>
                                  {goalData && goalLevel > 0 && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                                      <span className="text-slate-600">
                                        Goal L{goalLevel}: {goalData.name}
                                      </span>
                                    </div>
                                  )}
                                  {selfAssessmentData && selfAssessmentLevel > 0 && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                                      <span className="text-slate-600">
                                        Self L{selfAssessmentLevel}: {selfAssessmentData.name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                      <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Select a team member to view their profile</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Forms and Dialogs */}
      {showForm && (
        <MemberForm
          member={editingMember}
          onSave={handleSaveMember}
          onClose={() => {
            setShowForm(false);
            setEditingMember(null);
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team member and their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteMember(deleteId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reference Modal */}
      {showReference && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">Engineering Ladder Reference</h2>
              <Button size="icon" variant="ghost" onClick={() => setShowReference(false)}>
                <span className="text-xl">&times;</span>
              </Button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {Object.entries(VERTICALS_DATA).map(([vertical, levels]) => (
                <div key={vertical}>
                  <h3 className="font-semibold text-lg text-slate-800 mb-3">{vertical}</h3>
                  <div className="space-y-2">
                    {levels.map(level => (
                      <div key={level.level} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded">L{level.level}</span>
                          <span className="font-medium text-slate-700">{level.name}</span>
                        </div>
                        <p className="text-sm text-slate-600">{level.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <Button onClick={() => setShowReference(false)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}