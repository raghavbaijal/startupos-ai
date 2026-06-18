'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Trash2, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';

interface CommentProfile {
  email: string;
  full_name?: string;
}

interface Comment {
  id: string;
  resource_type: string;
  content: string;
  created_at: string;
  profiles?: CommentProfile;
}

interface InlineCommentsWidgetProps {
  workspaceId: string;
  resourceType: 'report' | 'branding' | 'finance' | 'roadmap' | 'marketing' | 'pitchdeck' | 'landingpage';
  comments: Comment[];
  onAddComment: (resourceType: string, content: string) => Promise<boolean>;
  onDeleteComment: (commentId: string) => Promise<boolean>;
  disableEdits: boolean;
}

export default function InlineCommentsWidget({
  workspaceId,
  resourceType,
  comments,
  onAddComment,
  onDeleteComment,
  disableEdits,
}: InlineCommentsWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredComments = comments.filter((c) => c.resource_type === resourceType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting || disableEdits) return;

    setIsSubmitting(true);
    const success = await onAddComment(resourceType, commentText.trim());
    if (success) {
      setCommentText('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-6 border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden transition-all shadow-sm">
      {/* Header / Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-100/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Discussion ({filteredComments.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {filteredComments.length > 0 && (
            <span className="text-[10px] bg-slate-200 text-slate-650 px-2 py-0.5 rounded-full font-bold">
              {filteredComments[filteredComments.length - 1].profiles?.full_name || 'Active thread'}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-450" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-450" />
          )}
        </div>
      </button>

      {/* Expanded Comments section */}
      {isOpen && (
        <div className="border-t border-slate-200 p-5 space-y-4 bg-white animate-fadeIn">
          {/* Comments List */}
          {filteredComments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center">
              No comments yet on this section. Start the conversation!
            </p>
          ) : (
            <div className="space-y-3.5 max-h-[200px] overflow-y-auto pr-1">
              {filteredComments.map((comm) => (
                <div key={comm.id} className="flex items-start justify-between gap-3 group/comment">
                  <div className="flex gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700 border border-slate-200 uppercase shrink-0 mt-0.5">
                      {comm.profiles?.full_name ? comm.profiles.full_name[0] : (comm.profiles?.email ? comm.profiles.email[0] : 'U')}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-805 truncate">
                          {comm.profiles?.full_name || comm.profiles?.email || 'Collaborator'}
                        </span>
                        <span className="text-[8px] text-slate-400 flex items-center gap-0.5 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-650 leading-relaxed break-words pr-2">
                        {comm.content}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteComment(comm.id)}
                    disabled={disableEdits}
                    className="opacity-0 group-hover/comment:opacity-100 p-1 hover:bg-rose-50 border border-transparent hover:border-rose-150 rounded-lg text-rose-600 transition-all shrink-0 disabled:opacity-0"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Comment Form */}
          <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={disableEdits ? "Viewer mode: comments disabled" : "Add a comment..."}
              disabled={isSubmitting || disableEdits}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-slate-400 focus:bg-white rounded-xl text-xs outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting || disableEdits}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
              title={disableEdits ? "Viewer mode: commenting disabled" : "Post comment"}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
