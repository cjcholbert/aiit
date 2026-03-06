/**
 * Self-assessment criteria for all 12 lessons.
 * Each criterion defines:
 *   id:             Unique key
 *   label:          Display text
 *   endpoint:       API endpoint to fetch data from
 *   check:          Function that returns true if criterion is met
 *   progressLabel:  Optional function that returns a progress string (e.g., "2/3")
 */

export const LESSON_CRITERIA = {
  1: [
    {
      id: 'l1_analyzed',
      label: 'Analyzed at least 1 conversation',
      endpoint: '/lesson1/conversations',
      check: (data) => Array.isArray(data) && data.length >= 1,
      progressLabel: (data) => `${Array.isArray(data) ? data.length : 0}/1`,
    },
    {
      id: 'l1_reviewed',
      label: 'Reviewed your coaching & context score',
      endpoint: '/lesson1/conversations',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((c) => c.analysis && c.analysis.coaching);
      },
    },
    {
      id: 'l1_three',
      label: 'Analyzed 3+ conversations (builds pattern)',
      endpoint: '/lesson1/conversations',
      check: (data) => Array.isArray(data) && data.length >= 3,
      progressLabel: (data) => `${Math.min(Array.isArray(data) ? data.length : 0, 3)}/3`,
    },
  ],

  2: [
    {
      id: 'l2_analyzed',
      label: 'Analyzed 3+ feedback entries',
      endpoint: '/lesson2/entries',
      check: (data) => Array.isArray(data) && data.length >= 3,
      progressLabel: (data) => `${Math.min(Array.isArray(data) ? data.length : 0, 3)}/3`,
    },
    {
      id: 'l2_rewritten',
      label: 'Rewrote at least 1 vague feedback',
      endpoint: '/lesson2/entries',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((e) => e.rewritten_feedback);
      },
    },
    {
      id: 'l2_patterns',
      label: 'Reviewed all 5 vague feedback patterns',
      endpoint: '/lesson2/patterns',
      check: (data) => Array.isArray(data) && data.length >= 5,
    },
    {
      id: 'l2_spread',
      label: 'Entries span 3+ different categories',
      endpoint: '/lesson2/entries',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        const cats = new Set(data.map((e) => e.category).filter(Boolean));
        return cats.size >= 3;
      },
    },
  ],

  3: [
    {
      id: 'l3_created',
      label: 'Created at least 1 template',
      endpoint: '/lesson3/templates',
      check: (data) => Array.isArray(data) && data.length >= 1,
      progressLabel: (data) => `${Array.isArray(data) ? data.length : 0}/1`,
    },
    {
      id: 'l3_tested',
      label: 'Tested at least 1 template',
      endpoint: '/lesson3/stats',
      check: (data) => data && (data.total_tests || 0) >= 1,
    },
    {
      id: 'l3_variables',
      label: 'Used template variables',
      endpoint: '/lesson3/templates',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((t) => t.variables && t.variables.length > 0);
      },
    },
    {
      id: 'l3_rated',
      label: 'Rated at least 1 test result',
      endpoint: '/lesson3/stats',
      check: (data) => data && (data.avg_rating || 0) > 0,
    },
  ],

  4: [
    {
      id: 'l4_doc',
      label: 'Created at least 1 context document',
      endpoint: '/lesson4/docs',
      check: (data) => Array.isArray(data) && data.length >= 1,
      progressLabel: (data) => `${Array.isArray(data) ? data.length : 0}/1`,
    },
    {
      id: 'l4_session',
      label: 'Started at least 1 work session',
      endpoint: '/lesson4/sessions',
      check: (data) => Array.isArray(data) && data.length >= 1,
    },
    {
      id: 'l4_prompt',
      label: 'Generated a context prompt',
      endpoint: '/lesson4/stats',
      check: (data) => data && (data.total_prompts_generated || 0) >= 1,
    },
    {
      id: 'l4_decisions',
      label: 'Documented decisions in a context doc',
      endpoint: '/lesson4/docs',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((d) => d.key_decisions && d.key_decisions.length > 0);
      },
    },
  ],

  5: [
    {
      id: 'l5_matrix',
      label: 'Trust matrix created for your domain',
      endpoint: '/lesson5/output-types',
      check: (data) => Array.isArray(data) && data.length >= 1,
    },
    {
      id: 'l5_predictions',
      label: 'Tracked predictions on 10+ outputs',
      endpoint: '/lesson5/calibration/stats',
      check: (data) => data && (data.verified_predictions || 0) >= 10,
      progressLabel: (data) => `${data ? data.verified_predictions || 0 : 0}/10`,
    },
    {
      id: 'l5_calibration',
      label: 'Identified a calibration adjustment needed',
      endpoint: '/lesson5/calibration/stats',
      check: (data) => data && ((data.over_trust_count || 0) > 0 || (data.over_verify_count || 0) > 0),
    },
    {
      id: 'l5_types',
      label: 'Added 3+ output types to trust matrix',
      endpoint: '/lesson5/output-types',
      check: (data) => Array.isArray(data) && data.length >= 3,
      progressLabel: (data) => `${Array.isArray(data) ? data.length : 0}/3`,
    },
  ],

  6: [
    {
      id: 'l6_checklist',
      label: 'Created at least 1 verification checklist',
      endpoint: '/lesson6/checklists',
      check: (data) => Array.isArray(data) && data.length >= 1,
      progressLabel: (data) => `${Array.isArray(data) ? data.length : 0}/1`,
    },
    {
      id: 'l6_session',
      label: 'Completed at least 1 verification practice',
      endpoint: '/lesson6/sessions',
      check: (data) => Array.isArray(data) && data.length >= 1,
    },
    {
      id: 'l6_stats',
      label: 'Tracked verification issues found',
      endpoint: '/lesson6/stats',
      check: (data) => data && (data.total_sessions || 0) >= 1,
    },
    {
      id: 'l6_completed',
      label: 'Completed a full verification session',
      endpoint: '/lesson6/sessions',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((s) => s.completed_at || s.ended_at);
      },
    },
  ],

  7: [
    {
      id: 'l7_project',
      label: 'Decomposed at least 1 project',
      endpoint: '/lesson7/decompositions',
      check: (data) => Array.isArray(data) && data.length >= 1,
      progressLabel: (data) => `${Array.isArray(data) ? data.length : 0}/1`,
    },
    {
      id: 'l7_categories',
      label: 'Used all 3 task categories',
      endpoint: '/lesson7/decompositions',
      check: (data) => {
        if (!Array.isArray(data) || data.length === 0) return false;
        const allTasks = data.flatMap((d) => d.tasks || []);
        const categories = new Set(allTasks.map((t) => t.category));
        return categories.has('ai_optimal') && categories.has('collaborative') && categories.has('human_primary');
      },
    },
    {
      id: 'l7_reasoning',
      label: 'Added reasoning for categorizations',
      endpoint: '/lesson7/decompositions',
      check: (data) => {
        if (!Array.isArray(data) || data.length === 0) return false;
        const allTasks = data.flatMap((d) => d.tasks || []);
        return allTasks.some((t) => t.reasoning);
      },
    },
    {
      id: 'l7_depth',
      label: 'Created 5+ tasks across decompositions',
      endpoint: '/lesson7/decompositions',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        const totalTasks = data.reduce((sum, d) => sum + (d.tasks || []).length, 0);
        return totalTasks >= 5;
      },
      progressLabel: (data) => {
        if (!Array.isArray(data)) return '0/5';
        const totalTasks = data.reduce((sum, d) => sum + (d.tasks || []).length, 0);
        return `${Math.min(totalTasks, 5)}/5`;
      },
    },
  ],

  8: [
    {
      id: 'l8_delegation',
      label: 'Created at least 1 delegation',
      endpoint: '/lesson8/delegations',
      check: (data) => Array.isArray(data) && data.length >= 1,
      progressLabel: (data) => `${Array.isArray(data) ? data.length : 0}/1`,
    },
    {
      id: 'l8_output',
      label: 'Received AI output for a task',
      endpoint: '/lesson8/delegations',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((d) => {
          const tasks = d.task_sequence || [];
          return tasks.some((t) => t.output_received);
        });
      },
    },
    {
      id: 'l8_review',
      label: 'Reviewed a delegation output',
      endpoint: '/lesson8/delegations',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((d) => {
          const tasks = d.task_sequence || [];
          return tasks.some((t) => t.review_notes);
        });
      },
    },
    {
      id: 'l8_depth',
      label: 'Created 3+ delegation tasks total',
      endpoint: '/lesson8/delegations',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        const totalTasks = data.reduce((sum, d) => sum + (d.task_sequence || []).length, 0);
        return totalTasks >= 3;
      },
      progressLabel: (data) => {
        if (!Array.isArray(data)) return '0/3';
        const totalTasks = data.reduce((sum, d) => sum + (d.task_sequence || []).length, 0);
        return `${Math.min(totalTasks, 3)}/3`;
      },
    },
  ],

  9: [
    {
      id: 'l9_task',
      label: 'Created at least 1 iteration task',
      endpoint: '/lesson9/tasks',
      check: (data) => Array.isArray(data) && data.length >= 1,
      progressLabel: (data) => `${Array.isArray(data) ? data.length : 0}/1`,
    },
    {
      id: 'l9_passes',
      label: 'Completed all 3 passes on a task',
      endpoint: '/lesson9/tasks',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((t) => t.is_complete);
      },
    },
    {
      id: 'l9_feedback',
      label: 'Provided transition feedback between passes',
      endpoint: '/lesson9/tasks',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((t) => {
          const passes = t.passes || [];
          return passes.some((p) => p.feedback);
        });
      },
    },
    {
      id: 'l9_depth',
      label: 'Created 2+ iteration tasks',
      endpoint: '/lesson9/tasks',
      check: (data) => Array.isArray(data) && data.length >= 2,
      progressLabel: (data) => `${Math.min(Array.isArray(data) ? data.length : 0, 2)}/2`,
    },
  ],

  10: [
    {
      id: 'l10_workflow',
      label: 'Created at least 1 workflow template',
      endpoint: '/lesson10/templates',
      check: (data) => Array.isArray(data) && data.length >= 1,
      progressLabel: (data) => `${Array.isArray(data) ? data.length : 0}/1`,
    },
    {
      id: 'l10_report',
      label: 'Generated at least 1 status report',
      endpoint: '/lesson10/reports',
      check: (data) => Array.isArray(data) && data.length >= 1,
    },
    {
      id: 'l10_time',
      label: 'Tracked time on a workflow run',
      endpoint: '/lesson10/reports',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((r) => r.actual_time_minutes > 0);
      },
    },
    {
      id: 'l10_depth',
      label: 'Generated 2+ status reports',
      endpoint: '/lesson10/reports',
      check: (data) => Array.isArray(data) && data.length >= 2,
      progressLabel: (data) => `${Math.min(Array.isArray(data) ? data.length : 0, 2)}/2`,
    },
  ],

  11: [
    {
      id: 'l11_zone',
      label: 'Mapped at least 1 frontier zone',
      endpoint: '/lesson11/zones',
      check: (data) => Array.isArray(data) && data.length >= 1,
      progressLabel: (data) => `${Array.isArray(data) ? data.length : 0}/1`,
    },
    {
      id: 'l11_encounter',
      label: 'Logged at least 1 frontier encounter',
      endpoint: '/lesson11/encounters',
      check: (data) => Array.isArray(data) && data.length >= 1,
    },
    {
      id: 'l11_stats',
      label: 'Reviewed frontier statistics',
      endpoint: '/lesson11/stats',
      check: (data) => data && (data.total_zones || 0) >= 1,
    },
    {
      id: 'l11_categories',
      label: 'Mapped zones in 2+ categories',
      endpoint: '/lesson11/zones',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        const cats = new Set(data.map((z) => z.category).filter(Boolean));
        return cats.size >= 2;
      },
    },
  ],

  12: [
    {
      id: 'l12_card',
      label: 'Generated a reference card',
      endpoint: '/lesson12/cards',
      check: (data) => Array.isArray(data) && data.length >= 1,
    },
    {
      id: 'l12_progress',
      label: 'Reviewed curriculum progress',
      endpoint: '/lesson12/curriculum-progress',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((w) => w.status !== 'not_started');
      },
    },
    {
      id: 'l12_exported',
      label: 'Exported or customized your card',
      endpoint: '/lesson12/cards',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((c) => c.personal_rules && c.personal_rules.length > 0);
      },
    },
    {
      id: 'l12_sections',
      label: 'Filled 3+ card sections',
      endpoint: '/lesson12/cards',
      check: (data) => {
        if (!Array.isArray(data)) return false;
        return data.some((c) => {
          let filled = 0;
          if (c.context_patterns && c.context_patterns.length > 0) filled++;
          if (c.feedback_principles && c.feedback_principles.length > 0) filled++;
          if (c.trust_insights && c.trust_insights.length > 0) filled++;
          if (c.decomposition_strategies && c.decomposition_strategies.length > 0) filled++;
          if (c.personal_rules && c.personal_rules.length > 0) filled++;
          if (c.frontier_notes && c.frontier_notes.length > 0) filled++;
          return filled >= 3;
        });
      },
    },
  ],
};
