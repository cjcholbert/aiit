import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import SelfAssessmentChecklist from '../components/SelfAssessmentChecklist';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import ConnectionCallout from '../components/ConnectionCallout';
import LessonNav from '../components/LessonNav';
import StatsPanel from '../components/StatsPanel';
import ExamplesDropdown from '../components/ExamplesDropdown';

const DEFAULT_CATEGORIES = [
  { value: 'general', label: 'General', color: 'var(--accent-purple)', icon: '📋' },
  { value: 'technical', label: 'Technical', color: 'var(--accent-blue)', icon: '⚙️' },
  { value: 'writing', label: 'Writing', color: 'var(--accent-green)', icon: '✍️' },
  { value: 'research', label: 'Research', color: 'var(--accent-red)', icon: '🔍' },
];

const CUSTOM_CATEGORY_COLORS = ['var(--accent-blue)', 'var(--accent-red)', 'var(--accent-yellow)', 'var(--accent-blue)', 'var(--accent-green)'];
const STORAGE_KEY = 'lesson3_custom_categories';
const TASKS_STORAGE_KEY = 'lesson3_build_tasks';

const DEFAULT_TASK_TYPES = [
  { name: 'Code Development', context: 'Language, framework, existing codebase context, coding standards, error handling expectations' },
  { name: 'Documentation', context: 'Document type, audience technical level, existing docs to reference, required sections' },
  { name: 'Email/Communication', context: 'Recipient, relationship, purpose, tone, key points to convey, any sensitivities' },
];

// Starter templates for new users
const STARTER_TEMPLATES = [
  {
    name: 'Code Review Request',
    category: 'technical',
    description: 'Get thorough code review feedback',
    content: `I need a code review for the following {{language}} code.

Project context: {{project_context}}
Code purpose: {{code_purpose}}

Please review for:
- Code correctness and potential bugs
- Performance considerations
- Security issues
- Code style and readability
- Suggestions for improvement

Here's the code:
{{code}}`,
    variables: [
      { name: 'language', description: 'Programming language', default: 'JavaScript', required: true },
      { name: 'project_context', description: 'Brief project background', default: '', required: false },
      { name: 'code_purpose', description: 'What this code does', default: '', required: true },
      { name: 'code', description: 'The code to review', default: '', required: true },
    ],
    tags: ['code', 'review', 'development'],
  },
  {
    name: 'Explain This Concept',
    category: 'research',
    description: 'Get clear explanations tailored to your level',
    content: `Please explain {{concept}} to me.

My background: {{background}}
My current understanding: {{current_understanding}}
Specific aspects I'm confused about: {{confusion_points}}

Please explain at a {{expertise_level}} level with practical examples.`,
    variables: [
      { name: 'concept', description: 'The concept to explain', default: '', required: true },
      { name: 'background', description: 'Your relevant background', default: '', required: false },
      { name: 'current_understanding', description: 'What you already know', default: '', required: false },
      { name: 'confusion_points', description: 'Specific confusing parts', default: '', required: false },
      { name: 'expertise_level', description: 'beginner/intermediate/advanced', default: 'intermediate', required: true },
    ],
    tags: ['learning', 'explanation'],
  },
  {
    name: 'Debug Help',
    category: 'technical',
    description: 'Get systematic debugging assistance',
    content: `I need help debugging an issue.

Environment: {{environment}}
What I'm trying to do: {{goal}}
What's happening instead: {{actual_behavior}}
Error message (if any): {{error_message}}
What I've already tried: {{attempted_solutions}}

Relevant code:
{{code}}`,
    variables: [
      { name: 'environment', description: 'OS, language version, framework', default: '', required: true },
      { name: 'goal', description: 'Expected behavior', default: '', required: true },
      { name: 'actual_behavior', description: 'What happens instead', default: '', required: true },
      { name: 'error_message', description: 'Error text if applicable', default: 'None', required: false },
      { name: 'attempted_solutions', description: 'What you tried', default: '', required: false },
      { name: 'code', description: 'Relevant code snippet', default: '', required: true },
    ],
    tags: ['debug', 'troubleshooting', 'development'],
  },
  {
    name: 'Document Writer',
    category: 'writing',
    description: 'Generate documentation with consistent style',
    content: `Please help me write {{document_type}} documentation.

Subject: {{subject}}
Target audience: {{audience}}
Tone: {{tone}}
Key points to cover: {{key_points}}
Length: {{length}}

Additional context: {{context}}`,
    variables: [
      { name: 'document_type', description: 'Type (README, API docs, tutorial)', default: 'README', required: true },
      { name: 'subject', description: 'What to document', default: '', required: true },
      { name: 'audience', description: 'Who will read this', default: 'developers', required: true },
      { name: 'tone', description: 'formal/casual/technical', default: 'technical', required: true },
      { name: 'key_points', description: 'Must-include information', default: '', required: true },
      { name: 'length', description: 'short/medium/comprehensive', default: 'medium', required: true },
      { name: 'context', description: 'Additional background', default: '', required: false },
    ],
    tags: ['documentation', 'writing'],
  },
  {
    name: 'Meeting Summary',
    category: 'general',
    description: 'Summarize meetings with action items',
    content: `Please summarize the following meeting notes.

Meeting type: {{meeting_type}}
Attendees: {{attendees}}
My role: {{my_role}}

Please extract:
- Key decisions made
- Action items (with owners if mentioned)
- Open questions
- Next steps

Meeting notes:
{{notes}}`,
    variables: [
      { name: 'meeting_type', description: 'standup/planning/review/etc', default: '', required: true },
      { name: 'attendees', description: 'Who was there', default: '', required: false },
      { name: 'my_role', description: 'Your role for relevant action items', default: '', required: false },
      { name: 'notes', description: 'Raw meeting notes', default: '', required: true },
    ],
    tags: ['meetings', 'productivity'],
  },
];

function loadCustomCategories() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomCategories(categories) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

function loadBuildTasks() {
  try {
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_TASK_TYPES;
  } catch {
    return DEFAULT_TASK_TYPES;
  }
}

function saveBuildTasks(tasks) {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

export default function Lesson03() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('learn');
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customCategories, setCustomCategories] = useState(loadCustomCategories);
  const [newCategoryName, setNewCategoryName] = useState('');

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  // Form state
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    description: '',
    content: '',
    variables: [],
    tags: [],
  });

  // Test state
  const [testingTemplate, setTestingTemplate] = useState(null);
  const [testVariables, setTestVariables] = useState({});
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  // Lesson 1 suggestions state
  const [module1Insights, setModule1Insights] = useState(null);
  const [module1Patterns, setModule1Patterns] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Build templates state (guided workflow)
  const [buildStep, setBuildStep] = useState(1);
  const [buildGaps, setBuildGaps] = useState(['', '', '']);
  const [buildStrengths, setBuildStrengths] = useState(['', '', '']);
  const [buildTasks, setBuildTasks] = useState(loadBuildTasks);
  const [generatedTemplates, setGeneratedTemplates] = useState([]);
  const [trackerEntries, setTrackerEntries] = useState([]);
  const [buildSubTab, setBuildSubTab] = useState('templates');

  // Sort and filter state
  const [sortBy, setSortBy] = useState('updated'); // name, usage, updated, created
  const [filterTag, setFilterTag] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Preview state
  const [previewVariables, setPreviewVariables] = useState({});
  const [showTips, setShowTips] = useState(true);

  // Import ref
  const importInputRef = useRef(null);

  const fetchTemplates = async () => {
    try {
      const data = await api.get('/lesson3/templates');
      setTemplates(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get('/lesson3/stats');
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchModule1Data = async () => {
    setSuggestionsLoading(true);
    try {
      const [insights, patterns] = await Promise.all([
        api.get('/lesson1/insights'),
        api.get('/lesson1/patterns'),
      ]);
      setModule1Insights(insights);
      setModule1Patterns(patterns);
    } catch (err) {
      // Lesson 1 data might not exist yet - that's ok
      console.log('Lesson 1 data not available:', err.message);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTemplates(), fetchStats()]);
      setLoading(false);
      // Fetch Lesson 1 data since Build Templates is the default tab
      fetchModule1Data();
    };
    loadData();
  }, []);

  // Auto-save build tasks to localStorage when they change
  useEffect(() => {
    saveBuildTasks(buildTasks);
  }, [buildTasks]);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingTemplate) {
        await api.put(`/lesson3/templates/${editingTemplate.id}`, formData);
      } else {
        await api.post('/lesson3/templates', formData);
      }

      await fetchTemplates();
      await fetchStats();
      setActiveTab('templates');
      setEditingTemplate(null);
      setFormData({
        name: '',
        category: 'general',
        description: '',
        content: '',
        variables: [],
        tags: [],
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.del(`/lesson3/templates/${id}`);
      await fetchTemplates();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditTemplate = async (template) => {
    try {
      const data = await api.get(`/lesson3/templates/${template.id}`);
      setEditingTemplate(data);
      setFormData({
        name: data.name,
        category: data.category,
        description: data.description || '',
        content: data.content,
        variables: data.variables || [],
        tags: data.tags || [],
      });
      setActiveTab('create');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDuplicateTemplate = async (id) => {
    try {
      await api.post(`/lesson3/templates/${id}/duplicate`, {});
      await fetchTemplates();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleFavorite = async (template) => {
    try {
      await api.put(`/lesson3/templates/${template.id}`, { is_favorite: !template.is_favorite });
      await fetchTemplates();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTestTemplate = async (template) => {
    try {
      const data = await api.get(`/lesson3/templates/${template.id}`);
      setTestingTemplate(data);

      const vars = {};
      (data.variables || []).forEach((v) => {
        vars[v.name] = v.default || '';
      });
      setTestVariables(vars);
      setTestPrompt('');
      setTestResult(null);
      setActiveTab('test');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRunTest = async () => {
    if (!testingTemplate) return;
    setTestLoading(true);
    setError(null);
    try {
      const data = await api.post('/lesson3/templates/test', {
        template_id: testingTemplate.id,
        test_prompt: testPrompt,
        variable_values: testVariables,
      });
      setTestResult(data);
      await fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setTestLoading(false);
    }
  };

  const addVariable = () => {
    setFormData({
      ...formData,
      variables: [
        ...formData.variables,
        { name: '', description: '', default: '', required: false },
      ],
    });
  };

  const updateVariable = (index, field, value) => {
    const newVars = [...formData.variables];
    newVars[index] = { ...newVars[index], [field]: value };
    setFormData({ ...formData, variables: newVars });
  };

  const removeVariable = (index) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((_, i) => i !== index),
    });
  };

  const getCategoryColor = (category) => {
    return allCategories.find((c) => c.value === category)?.color || 'var(--text-muted)';
  };

  const addCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    if (customCategories.length >= 5) return;

    const value = newCategoryName.toLowerCase().replace(/\s+/g, '_');
    if (allCategories.some((c) => c.value === value)) {
      setError('Category already exists');
      return;
    }

    const colorIndex = customCategories.length;
    const newCat = {
      value,
      label: newCategoryName.trim(),
      color: CUSTOM_CATEGORY_COLORS[colorIndex],
      custom: true,
    };

    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    saveCustomCategories(updated);
    setNewCategoryName('');
    setFormData({ ...formData, category: value });
  };

  const removeCustomCategory = (value) => {
    const updated = customCategories.filter((c) => c.value !== value);
    setCustomCategories(updated);
    saveCustomCategories(updated);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Build templates workflow functions
  const generateBuildTemplates = () => {
    const gaps = buildGaps.filter((g) => g.trim());
    const strengths = buildStrengths.filter((s) => s.trim());
    const icons = ['📋', '📊', '💬'];

    const templates = buildTasks
      .filter((t) => t.name.trim())
      .map((task, index) => {
        let gapSections = '';
        if (gaps.length > 0) {
          gapSections = `\n## Gap-Awareness Checklist\n${gaps.map((g) => `- [ ] ${g}`).join('\n')}`;
        }

        const content = `# ${task.name} - Context Template

## Environment & Setup
[Your working environment, tools, platforms, versions]
${task.context ? `\nTypical context needed:\n${task.context}` : ''}

## Task Objective
[Single clear statement of what you want to accomplish]
- Expected outcome: [What does "done" look like?]
- Success criteria: [How will you evaluate the result?]

## Requirements & Constraints
- Format: [Output format preferences]
- Style: [Tone, level of detail, technical depth]
- Must include: [Required elements]
- Must avoid: [Things to exclude or limitations]
${gapSections}

## Additional Context
[Any background, previous work, or reference materials]

## Examples (if applicable)
[Show don't tell - provide examples of desired output]

---
💡 Strengths to leverage: ${strengths.length > 0 ? strengths.join(', ') : '[Your identified strengths]'}
⚠️ Gaps to address: ${gaps.length > 0 ? gaps.join(', ') : '[Your identified gaps]'}`;

        return {
          name: task.name,
          icon: icons[index] || '📝',
          content,
          gaps,
          strengths,
        };
      });

    setGeneratedTemplates(templates);
    setBuildStep(3);
    if (trackerEntries.length === 0) {
      addTrackerEntry();
    }
  };

  const addTrackerEntry = () => {
    setTrackerEntries([
      ...trackerEntries,
      {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        template: generatedTemplates[0]?.name || buildTasks[0]?.name || 'Template 1',
        worked: '',
        missing: '',
      },
    ]);
  };

  const updateTrackerEntry = (id, field, value) => {
    setTrackerEntries(trackerEntries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const removeTrackerEntry = (id) => {
    setTrackerEntries(trackerEntries.filter((e) => e.id !== id));
  };

  const exportBuildTemplates = (format) => {
    let content = '';
    let filename = '';

    if (format === 'json') {
      content = JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          templates: generatedTemplates.map((t) => ({
            name: t.name,
            content: t.content,
            gaps_addressed: t.gaps,
            strengths_leveraged: t.strengths,
          })),
        },
        null,
        2
      );
      filename = 'context-templates.json';
    } else if (format === 'markdown') {
      content = generatedTemplates.map((t) => t.content).join('\n\n---\n\n');
      filename = 'context-templates.md';
    } else {
      content = generatedTemplates
        .map((t) => `${'='.repeat(60)}\n${t.name.toUpperCase()}\n${'='.repeat(60)}\n\n${t.content}`)
        .join('\n\n\n');
      filename = 'context-templates.txt';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadBuildExample = () => {
    setBuildGaps(['Error handling requirements', 'Target audience/reader level', 'Output format preferences']);
    setBuildStrengths(['Clear task objectives', 'Technical environment details', 'Providing examples']);
    setBuildTasks([
      { name: 'Code Development', context: 'Language, framework, existing codebase context, coding standards, error handling expectations' },
      { name: 'Documentation', context: 'Document type, audience technical level, existing docs to reference, required sections' },
      { name: 'Email/Communication', context: 'Recipient, relationship, purpose, tone, key points to convey, any sensitivities' },
    ]);
  };

  const saveBuildTemplateToLibrary = async (template) => {
    try {
      await api.post('/lesson3/templates', {
        name: template.name,
        category: 'general',
        description: `Generated from Lesson 1 insights`,
        content: template.content,
        variables: [],
        tags: ['generated', 'from-build'],
      });
      await fetchTemplates();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  // Get all unique tags from templates
  const allTags = [...new Set(templates.flatMap((t) => t.tags || []))].sort();

  // Sort and filter templates
  const getFilteredAndSortedTemplates = () => {
    let filtered = [...templates];

    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter((t) => t.category === filterCategory);
    }

    // Filter by tag
    if (filterTag) {
      filtered = filtered.filter((t) => t.tags?.includes(filterTag));
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'usage':
        filtered.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
        break;
      case 'created':
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'updated':
      default:
        filtered.sort((a, b) => new Date(b.last_used_at || b.created_at || 0) - new Date(a.last_used_at || a.created_at || 0));
        break;
    }

    return filtered;
  };

  // Export templates
  const handleExport = () => {
    const exportData = {
      version: 1,
      exported_at: new Date().toISOString(),
      templates: templates.map((t) => ({
        name: t.name,
        category: t.category,
        description: t.description,
        content: t.content,
        variables: t.variables,
        tags: t.tags,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `templates-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import templates
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.templates || !Array.isArray(data.templates)) {
        throw new Error('Invalid template file format');
      }

      let imported = 0;
      for (const template of data.templates) {
        if (template.name && template.content) {
          await api.post('/lesson3/templates', {
            name: template.name,
            category: template.category || 'general',
            description: template.description || '',
            content: template.content,
            variables: template.variables || [],
            tags: template.tags || [],
          });
          imported++;
        }
      }

      await fetchTemplates();
      await fetchStats();
      alert(`Successfully imported ${imported} templates`);
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    }

    if (importInputRef.current) importInputRef.current.value = '';
  };

  // Add starter template
  const handleAddStarter = async (starter) => {
    try {
      await api.post('/lesson3/templates', {
        name: starter.name,
        category: starter.category,
        description: starter.description,
        content: starter.content,
        variables: starter.variables,
        tags: starter.tags,
      });
      await fetchTemplates();
      await fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  // Render preview with variables
  const renderPreview = () => {
    if (!formData.content) return '';

    let preview = formData.content;
    for (const v of formData.variables) {
      const value = previewVariables[v.name] || v.default || `[${v.name}]`;
      preview = preview.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), value);
    }
    // Also replace any unmatched variables
    preview = preview.replace(/\{\{(\w+)\}\}/g, '[$1]');
    return preview;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading templates...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Context Template Builder</h1>
      </div>

      <div className="lesson-progress-row">
        <SelfAssessmentChecklist lessonNumber={3} criteria={LESSON_CRITERIA[3]} />
        <StatsPanel stats={stats ? [
            { label: 'Templates', value: stats.total_templates, color: 'var(--accent-blue)' },
            { label: 'Tests Run', value: stats.total_tests, color: 'var(--accent-green)' },
            { label: 'Avg Rating', value: stats.avg_rating?.toFixed(1) ?? '-', color: 'var(--accent-yellow)' },
        ] : []} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'learn' ? 'active' : ''}`}
          onClick={() => setActiveTab('learn')}
        >
          Learn
        </button>
        <button
          className={`tab ${activeTab === 'build' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('build');
            if (!module1Insights && !module1Patterns) {
              fetchModule1Data();
            }
          }}
        >
          Build Templates
        </button>
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Template Library ({templates.length})
        </button>
        <button
          className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('suggestions');
            if (!module1Insights && !module1Patterns) {
              fetchModule1Data();
            }
          }}
        >
          Suggestions
        </button>
        {testingTemplate && (
          <button
            className={`tab ${activeTab === 'test' ? 'active' : ''}`}
            onClick={() => setActiveTab('test')}
          >
            Copy Prompt
          </button>
        )}
        {editingTemplate && (
          <button
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Edit Template
          </button>
        )}
      </div>

      {/* Learn Tab */}
      {activeTab === 'learn' && (
        <div className="learn-section">
          <div className="learn-problem-skill">
            <p><strong>The Problem:</strong> You keep forgetting to provide the same context over and over. Each conversation starts from scratch, and you waste time re-explaining your project, constraints, and preferences.</p>
            <p><strong>The Skill:</strong> Build reusable templates that capture the context AI needs upfront. Turn your Lesson 1 insights into structured prompts you can use consistently.</p>
          </div>

          <ConnectionCallout
            lessonNumber={1}
            lessonTitle="Context Tracker"
            message="Lesson 1 showed your context patterns and common gaps. Now turn those insights into reusable templates so you never start from scratch — the same context gets provided every time, automatically."
          />

          <div className="learn-intro">
            <h2>Why Templates Transform Your AI Workflow</h2>
            <p>
              You ask AI to help plan a client meeting agenda. It comes back with something generic because
              you forgot to mention the client's industry, the meeting goal, and who'll be in the room. Next
              week, same task, same problem — you forgot the same details again. Templates fix this by turning
              your best prompts into fill-in-the-blanks frameworks that capture the right context every time.
            </p>
            <p>
              Instead of starting from a blank text box and hoping you remember what to include, you open a
              template that already has slots for the information AI needs. A 5-minute setup becomes a 30-second
              fill-in. And because templates are reusable, the quality of your prompts stays consistent even on
              busy days.
            </p>
          </div>

          <div className="learn-key-insight">
            <strong>Key Insight:</strong> The best templates aren't rigid scripts — they're structured frameworks with
            variables (like <code>{'{{audience}}'}</code> or <code>{'{{deadline}}'}</code>) that you fill in
            for each use. This gives you consistency <em>and</em> flexibility. One meeting-prep template can
            serve dozens of different meetings.
          </div>

          <h3>How This Lesson Works</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Four paths to building your template library:
          </p>

          <div className="learn-patterns-grid">
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-green)' }}>Build Templates (Guided)</h4>
              <p>Use the 3-step workflow to generate templates based on your Lesson 1 context gaps and common
              task types. Best for getting started quickly.</p>
              <button className="learn-tab-link" onClick={() => setActiveTab('build')}>Go to Build →</button>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-blue)' }}>Template Library</h4>
              <p>View, edit, and organize your saved templates. Start with the built-in starters and
              customize them for your specific work patterns.</p>
              <button className="learn-tab-link" onClick={() => setActiveTab('templates')}>Go to Library →</button>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-yellow)' }}>Suggestions</h4>
              <p>Get AI-powered template suggestions based on context gaps identified in Lesson 1. Turns
              your diagnosed problems into preventive solutions.</p>
              <button className="learn-tab-link" onClick={() => setActiveTab('suggestions')}>Go to Suggestions →</button>
            </div>
            <div className="learn-pattern-card">
              <h4 style={{ color: 'var(--accent-purple)' }}>Test & Refine</h4>
              <p>Try your templates with real prompts. Rate the results to track which templates produce
              the best output and which need adjustments.</p>
              <button className="learn-tab-link" onClick={() => setActiveTab('test')}>Go to Test →</button>
            </div>
          </div>

          <div className="learn-comparison">
            <h3>Without Templates vs. With Templates</h3>
            <div className="learn-comparison-grid">
              <div className="learn-comparison-col">
                <h4 className="poor">Starting From Scratch Every Time</h4>
                <div className="learn-comparison-item poor">
                  <div className="learn-comparison-scenario">Meeting Prep</div>
                  <p>"Help me prepare for a client meeting." — Missing: who the client is, what was discussed
                  last time, what decisions need to be made, who else is attending.</p>
                </div>
                <div className="learn-comparison-item poor">
                  <div className="learn-comparison-scenario">Status Report</div>
                  <p>"Write a project status update." — Missing: audience, format preference, which project,
                  what period, what level of detail.</p>
                </div>
                <div className="learn-comparison-item poor">
                  <div className="learn-comparison-scenario">Interview Prep</div>
                  <p>"Help me prepare interview questions." — Missing: role level, department, key skills
                  to assess, team culture, legal constraints.</p>
                </div>
              </div>
              <div className="learn-comparison-col">
                <h4 className="good">Using a Template (Consistent, Fast)</h4>
                <div className="learn-comparison-item good">
                  <div className="learn-comparison-scenario">Meeting Prep</div>
                  <p>Meeting Prep template prompts for: client name, last meeting summary, open items,
                  attendees, decisions needed, and time limit. Fill in 6 fields, get a tailored agenda
                  in seconds.</p>
                </div>
                <div className="learn-comparison-item good">
                  <div className="learn-comparison-scenario">Status Report</div>
                  <p>Status Report template includes slots for: audience, project name, reporting period,
                  accomplishments, blockers, next steps, and format (bullets vs. narrative). Same quality
                  every week.</p>
                </div>
                <div className="learn-comparison-item good">
                  <div className="learn-comparison-scenario">Interview Prep</div>
                  <p>Interview template captures: role title, seniority level, must-have skills, team
                  dynamics, and evaluation criteria. Produces consistent, fair questions across all
                  candidates.</p>
                </div>
              </div>
            </div>
          </div>

          <h3>Common Mistakes</h3>
          <div className="learn-patterns-grid" style={{ marginBottom: '24px' }}>
            <div className="learn-pattern-card">
              <div className="learn-pattern-label avoid">Mistake</div>
              <p>Building templates that are too specific. A template for "Q3 board meeting agenda" only
              works once. A template for "meeting agenda" with a variable for meeting type works forever.</p>
              <div className="learn-pattern-label better">Instead</div>
              <div className="learn-example-good">
                Use variables for anything that changes between uses. The template structure stays the
                same; only the fill-in values change. Aim for templates you'll use at least 3-4 times.
              </div>
            </div>
            <div className="learn-pattern-card">
              <div className="learn-pattern-label avoid">Mistake</div>
              <p>Creating templates with 15+ variables. If filling in the template takes longer than
              writing the prompt from scratch, nobody will use it.</p>
              <div className="learn-pattern-label better">Instead</div>
              <div className="learn-example-good">
                Keep templates to 4-6 variables. Mark some as optional. Focus on the variables that
                address your most common context gaps from Lesson 1 — those are the ones you actually forget.
              </div>
            </div>
            <div className="learn-pattern-card">
              <div className="learn-pattern-label avoid">Mistake</div>
              <p>Never updating templates after using them. Your first version is a draft — you'll
              learn what's missing or unnecessary after a few real uses.</p>
              <div className="learn-pattern-label better">Instead</div>
              <div className="learn-example-good">
                After using a template 3 times, review it. Did you keep adding the same detail manually?
                Add it as a variable. Was a variable always the same value? Make it a default. Templates
                should evolve with your workflow.
              </div>
            </div>
          </div>

          <div className="learn-next-step">
            <h3>Ready to Build Your First Template?</h3>
            <p>Start with the guided Build workflow to turn your Lesson 1 context gaps into reusable templates,
            or jump straight to the Template Library to customize the built-in starters.</p>
            <button className="btn btn-primary" onClick={() => {
              setActiveTab('build');
              if (!module1Insights && !module1Patterns) {
                fetchModule1Data();
              }
            }}>
              Go to Build Templates
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      {activeTab === 'templates' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ margin: 0 }}>Template Library</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingTemplate(null);
                  setFormData({
                    name: '',
                    category: 'general',
                    description: '',
                    content: '',
                    variables: [],
                    tags: [],
                  });
                  setActiveTab('create');
                }}
              >
                + Create New
              </button>
              <input
                type="file"
                ref={importInputRef}
                onChange={handleImport}
                accept=".json"
                style={{ display: 'none' }}
              />
              <button className="btn btn-secondary" onClick={() => importInputRef.current?.click()}>
                Import
              </button>
              <button className="btn btn-secondary" onClick={handleExport} disabled={templates.length === 0}>
                Export
              </button>
            </div>
          </div>

          {/* Sort and Filter Controls */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '13px' }}
              >
                <option value="updated">Last Used</option>
                <option value="name">Name</option>
                <option value="usage">Most Used</option>
                <option value="created">Newest</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Category:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '13px' }}
              >
                <option value="">All</option>
                {allCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            {allTags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Tag:</label>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '13px' }}
                >
                  <option value="">All</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}
            {(filterCategory || filterTag) && (
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => { setFilterCategory(''); setFilterTag(''); }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {templates.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>
              No templates yet. Create your first context template or add a starter template below.
            </p>
          ) : getFilteredAndSortedTemplates().length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>
              No templates match your filters.
            </p>
          ) : (
            <div>
              {getFilteredAndSortedTemplates().map((template) => (
                <div
                  key={template.id}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    borderLeft: `4px solid ${getCategoryColor(template.category)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => handleToggleFavorite(template)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            color: template.is_favorite ? 'var(--accent-yellow)' : 'var(--text-muted)',
                            padding: 0,
                          }}
                        >
                          {template.is_favorite ? '★' : '☆'}
                        </button>
                        <h3 style={{ margin: 0 }}>{template.name}</h3>
                        <span
                          className="badge"
                          style={{ backgroundColor: getCategoryColor(template.category), color: 'white' }}
                        >
                          {template.category}
                        </span>
                      </div>
                      {template.description && (
                        <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                          {template.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>Used {template.usage_count} times</span>
                    {template.last_used_at && (
                      <span>Last: {new Date(template.last_used_at).toLocaleDateString()}</span>
                    )}
                  </div>

                  {template.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      {template.tags.map((tag) => (
                        <span key={tag} className="badge badge-blue" style={{ fontSize: '11px' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => copyToClipboard(template.content)}>
                      Copy
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleTestTemplate(template)}>
                      Test
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleEditTemplate(template)}>
                      Edit
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleDuplicateTemplate(template.id)}>
                      Duplicate
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDeleteTemplate(template.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Starter Templates */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '12px' }}>Starter Templates</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
              Pre-built templates to get you started. Click to add a copy you can customize.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {STARTER_TEMPLATES.map((starter, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    border: '1px dashed var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>{starter.name}</h4>
                    <span
                      className="badge"
                      style={{ backgroundColor: getCategoryColor(starter.category), color: 'white', fontSize: '10px' }}
                    >
                      {starter.category}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '0 0 8px' }}>
                    {starter.description}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {starter.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '3px' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '4px 12px' }}
                    onClick={() => handleAddStarter(starter)}
                  >
                    + Add to My Templates
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Template Form */}
      {activeTab === 'create' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px' }}
              onClick={() => {
                setActiveTab('templates');
                setEditingTemplate(null);
              }}
            >
              Back to Library
            </button>
            <h2 style={{ margin: 0 }}>
              {editingTemplate ? 'Edit Template' : 'Create New Template (Advanced)'}
            </h2>
          </div>

          {/* Guide to Build Templates for beginners */}
          {!editingTemplate && (
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--success-bg)', border: '1px solid var(--accent-green)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>💡</span>
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>New to template building?</div>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    The <strong>Build Templates</strong> tab provides a guided 3-step workflow that helps you create templates based on your Lesson 1 insights.
                    It's recommended for beginners.
                  </p>
                  <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => setActiveTab('build')}>
                    Go to Build Templates
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Template Tips */}
          {!editingTemplate && (
            <div style={{ marginBottom: '20px', background: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setShowTips(!showTips)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                <span>Tips for Writing Effective Templates</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{showTips ? '▼' : '▶'}</span>
              </button>
              {showTips && (
                <div style={{ padding: '0 12px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
                    <li><strong>Be specific about context</strong> - Include your role, environment, and constraints</li>
                    <li><strong>Use variables</strong> for parts that change - Use <code style={{ background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: '3px' }}>{'{{variable_name}}'}</code> syntax</li>
                    <li><strong>State the output format</strong> you want - bullet points, code, step-by-step, etc.</li>
                    <li><strong>Include what AI should avoid</strong> - assumptions, certain approaches, etc.</li>
                    <li><strong>Keep it focused</strong> - One template per use case, under 500 words</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleCreateTemplate}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <ExamplesDropdown
                endpoint="/lesson3/examples"
                onSelect={(example) => {
                  setFormData({
                    ...formData,
                    name: example.name || '',
                    category: example.category || 'general',
                    description: example.description || '',
                    content: example.content || '',
                    variables: example.variables || [],
                    tags: example.tags || [],
                  });
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Template Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Project Setup Context"
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {allCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {customCategories.length < 5 && (
                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      Create {5 - customCategories.length} additional categories:
                    </span>
                    <input
                      type="text"
                      placeholder="Name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={addCustomCategory}
                      disabled={!newCategoryName.trim()}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        background: 'var(--accent-blue)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: newCategoryName.trim() ? 'pointer' : 'not-allowed',
                        opacity: newCategoryName.trim() ? 1 : 0.5,
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}
                {customCategories.length > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {customCategories.map((cat) => (
                      <span
                        key={cat.value}
                        style={{
                          backgroundColor: 'var(--accent-blue)',
                          color: 'white',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '11px',
                        }}
                      >
                        {cat.label}
                        <button
                          type="button"
                          onClick={() => removeCustomCategory(cat.value)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.8)',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '10px',
                            lineHeight: 1,
                            marginLeft: '2px',
                          }}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of when to use this template"
              />
            </div>

            <div className="form-group">
              <label>Template Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter your template content. Use {{variable_name}} for placeholders."
                style={{ minHeight: '200px', fontFamily: 'monospace' }}
                required
              />
              <small style={{ color: 'var(--text-muted)' }}>
                Use {'{{variable_name}}'} syntax for variables that can be customized when using the template.
              </small>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ margin: 0 }}>Variables</label>
                <button type="button" className="btn btn-secondary" onClick={addVariable}>
                  + Add Variable
                </button>
              </div>
              {formData.variables.map((variable, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr auto auto',
                    gap: '8px',
                    marginBottom: '8px',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Variable name"
                    value={variable.name}
                    onChange={(e) => updateVariable(index, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={variable.description}
                    onChange={(e) => updateVariable(index, 'description', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Default value"
                    value={variable.default}
                    onChange={(e) => updateVariable(index, 'default', e.target.value)}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0, whiteSpace: 'nowrap' }}>
                    <input
                      type="checkbox"
                      checked={variable.required}
                      onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                      style={{ width: 'auto' }}
                    />
                    Required
                  </label>
                  <button type="button" className="btn btn-danger" onClick={() => removeVariable(index)}>
                    x
                  </button>
                </div>
              ))}
            </div>

            {/* Template Preview */}
            {formData.content && (
              <div style={{ marginBottom: '16px', background: 'var(--bg-tertiary)', borderRadius: '6px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ margin: 0, fontWeight: '500' }}>Preview</label>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Fill in sample values to see how your template will render
                  </span>
                </div>
                {formData.variables.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {formData.variables.map((v) => (
                      <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v.name}:</span>
                        <input
                          type="text"
                          value={previewVariables[v.name] || ''}
                          onChange={(e) => setPreviewVariables({ ...previewVariables, [v.name]: e.target.value })}
                          placeholder={v.default || 'value'}
                          style={{ padding: '2px 6px', fontSize: '12px', width: '100px' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-secondary)',
                  padding: '12px',
                  borderRadius: '4px',
                  margin: 0,
                  maxHeight: '200px',
                  overflow: 'auto',
                }}>
                  {renderPreview()}
                </pre>
              </div>
            )}

            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map((t) => t.trim()).filter((t) => t),
                  })
                }
                placeholder="work, personal, project-name"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setActiveTab('templates');
                  setEditingTemplate(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Test Template */}
      {activeTab === 'test' && testingTemplate && (
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Test: {testingTemplate.name}</h2>

          {testingTemplate.variables?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px' }}>Fill Variables</h3>
              {testingTemplate.variables.map((v) => (
                <div key={v.name} className="form-group">
                  <label>
                    {v.name}
                    {v.required && <span style={{ color: 'var(--accent-red)' }}> *</span>}
                  </label>
                  <input
                    type="text"
                    value={testVariables[v.name] || ''}
                    onChange={(e) =>
                      setTestVariables({ ...testVariables, [v.name]: e.target.value })
                    }
                    placeholder={v.description || v.default}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label>Your Test Prompt</label>
            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter a prompt to test with this template..."
              style={{ minHeight: '100px' }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleRunTest}
            disabled={testLoading || !testPrompt}
          >
            {testLoading ? 'Rendering...' : 'Copy Prompt'}
          </button>

          {testResult && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>Rendered Prompt</h3>
              <pre
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: '16px',
                  borderRadius: '6px',
                  whiteSpace: 'pre-wrap',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                }}
              >
                {testResult.rendered_prompt}
              </pre>

              <h3 style={{ marginTop: '16px', marginBottom: '12px' }}>Claude's Response</h3>
              <div
                style={{
                  background: 'var(--success-bg)',
                  border: '1px solid var(--accent-green)',
                  padding: '16px',
                  borderRadius: '6px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {testResult.ai_response}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestions from Lesson 1 */}
      {activeTab === 'suggestions' && (
        <div>
          {suggestionsLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              Loading Lesson 1 data...
            </div>
          ) : !module1Insights || module1Insights.total_analyzed === 0 ? (
            <div className="card">
              <h2 style={{ marginBottom: '16px' }}>No Lesson 1 Data Yet</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                Analyze some conversations in Lesson 1 first. Once you have analyzed conversations,
                we can identify your context gaps and suggest templates to address them.
              </p>
              <a href="/lesson/1" className="btn btn-primary">Go to Lesson 1: Context Tracker</a>
            </div>
          ) : (
            <div>
              <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                  <div className="stat-value">{module1Insights.total_analyzed}</div>
                  <div className="stat-label">Conversations Analyzed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{module1Insights.context_gaps?.length || 0}</div>
                  <div className="stat-label">Recurring Gaps Found</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{module1Patterns?.common_habits?.length || 0}</div>
                  <div className="stat-label">Habits to Build</div>
                </div>
              </div>

              <div className="analysis-grid">
                {/* Context Gaps - Template Opportunities */}
                <div className="card">
                  <h3 style={{ color: 'var(--accent-red)', marginBottom: '12px' }}>
                    Context Gaps - Template Opportunities
                  </h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                    These are things you frequently forget to mention. Each gap is an opportunity for a template.
                  </p>
                  {module1Insights.context_gaps?.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No recurring gaps identified yet.</p>
                  ) : (
                    module1Insights.context_gaps?.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '12px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          borderLeft: '3px solid var(--accent-red)',
                        }}
                      >
                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>{item.gap}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Occurred in {item.count} conversations ({item.percentage}%)
                        </div>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                          onClick={() => {
                            setFormData({
                              name: '',
                              category: 'general',
                              description: `Template to address: ${item.gap}`,
                              content: `[Add context about: ${item.gap}]\n\n{{details}}`,
                              variables: [{ name: 'details', description: item.gap, default: '', required: true }],
                              tags: ['from-module1'],
                            });
                            setEditingTemplate(null);
                            setActiveTab('create');
                          }}
                        >
                          Create Template for This
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Context Strengths - Keep in Templates */}
                <div className="card">
                  <h3 style={{ color: 'var(--accent-green)', marginBottom: '12px' }}>
                    Context Strengths - Include in Templates
                  </h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                    These are things you consistently provide well. Include them in your templates.
                  </p>
                  {module1Insights.context_strengths?.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No recurring strengths identified yet.</p>
                  ) : (
                    module1Insights.context_strengths?.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '12px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          borderLeft: '3px solid var(--accent-green)',
                        }}
                      >
                        <div style={{ fontWeight: '500' }}>{item.strength}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {item.count}x ({item.percentage}%)
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pattern Categories */}
              {module1Patterns && Object.keys(module1Patterns.count_by_category || {}).length > 0 && (
                <div className="card" style={{ marginTop: '24px' }}>
                  <h3 style={{ marginBottom: '12px' }}>Pattern Categories</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                    Types of context issues found in your conversations.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(module1Patterns.count_by_category)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, count]) => (
                        <div
                          key={category}
                          style={{
                            padding: '8px 12px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>{category}</span>
                          <span className="badge badge-blue">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Habits to Build */}
              {module1Patterns?.common_habits?.length > 0 && (
                <div className="card" style={{ marginTop: '24px' }}>
                  <h3 style={{ marginBottom: '12px' }}>Habits to Build</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                    Recurring recommendations from your conversation analyses.
                  </p>
                  {module1Patterns.common_habits.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{item.habit}</span>
                      <span className="badge badge-purple">{item.count}x</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button className="btn btn-secondary" onClick={fetchModule1Data}>
                  Refresh Lesson 1 Data
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Build Templates - Guided Workflow */}
      {activeTab === 'build' && (
        <div>
          {/* Welcome message for step 1 */}
          {buildStep === 1 && generatedTemplates.length === 0 && (
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', borderLeft: '4px solid var(--accent-blue)' }}>
              <h3 style={{ margin: '0 0 8px', color: 'var(--accent-blue)' }}>Recommended for Beginners</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                This guided workflow helps you create effective context templates based on your Lesson 1 analysis.
                Follow the 3 steps to generate templates tailored to your specific task types and context patterns.
              </p>
            </div>
          )}

          {/* Step indicators */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: buildStep >= step ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                  color: buildStep >= step ? 'white' : 'var(--text-muted)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: buildStep === step ? '600' : '400',
                  cursor: step < buildStep ? 'pointer' : 'default',
                }}
                onClick={() => step < buildStep && setBuildStep(step)}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: buildStep >= step ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                  }}
                >
                  {step}
                </span>
                {step === 1 && 'Lesson 1 Results'}
                {step === 2 && 'Task Types'}
                {step === 3 && 'Generated Templates'}
              </div>
            ))}
          </div>

          {/* Step 1: Lesson 1 Results */}
          {buildStep === 1 && (
            <div className="card">
              <h2 style={{ marginBottom: '20px' }}>Select Your Lesson 1 Results</h2>

              {suggestionsLoading ? (
                <div className="loading" style={{ padding: '40px' }}>
                  <div className="spinner"></div>
                  Loading Lesson 1 insights...
                </div>
              ) : !module1Insights || module1Insights.total_analyzed === 0 ? (
                <div style={{ padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '20px' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
                    No Lesson 1 data available yet. Analyze some conversations in Lesson 1 first, or enter your gaps and strengths manually below.
                  </p>
                  <a href="/lesson/1" className="btn btn-secondary">Go to Lesson 1</a>
                </div>
              ) : null}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Your 3 Context Gaps
                  </label>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Select from your Lesson 1 analysis or type custom
                  </p>
                  {buildGaps.map((gap, i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                      {module1Insights?.context_gaps?.length > 0 ? (
                        <select
                          value={gap}
                          onChange={(e) => {
                            const newGaps = [...buildGaps];
                            newGaps[i] = e.target.value;
                            setBuildGaps(newGaps);
                            // Auto-populate corresponding strength if available
                            if (module1Insights?.context_strengths?.[i]) {
                              const newStrengths = [...buildStrengths];
                              newStrengths[i] = module1Insights.context_strengths[i].strength;
                              setBuildStrengths(newStrengths);
                            }
                          }}
                          style={{ width: '100%' }}
                        >
                          <option value="">-- Select Gap {i + 1} --</option>
                          {module1Insights.context_gaps.map((item, idx) => (
                            <option key={idx} value={item.gap}>
                              {item.gap} ({item.count}x)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={gap}
                          onChange={(e) => {
                            const newGaps = [...buildGaps];
                            newGaps[i] = e.target.value;
                            setBuildGaps(newGaps);
                          }}
                          placeholder={`Gap ${i + 1}: e.g., Error handling requirements`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Your 3 Context Strengths
                  </label>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Auto-filled from Lesson 1 or type custom
                  </p>
                  {buildStrengths.map((strength, i) => (
                    <div key={i} style={{ marginBottom: '8px' }}>
                      {module1Insights?.context_strengths?.length > 0 ? (
                        <select
                          value={strength}
                          onChange={(e) => {
                            const newStrengths = [...buildStrengths];
                            newStrengths[i] = e.target.value;
                            setBuildStrengths(newStrengths);
                          }}
                          style={{ width: '100%' }}
                        >
                          <option value="">-- Select Strength {i + 1} --</option>
                          {module1Insights.context_strengths.map((item, idx) => (
                            <option key={idx} value={item.strength}>
                              {item.strength} ({item.count}x)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={strength}
                          onChange={(e) => {
                            const newStrengths = [...buildStrengths];
                            newStrengths[i] = e.target.value;
                            setBuildStrengths(newStrengths);
                          }}
                          placeholder={`Strength ${i + 1}: e.g., Clear objectives`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary" onClick={() => setBuildStep(2)}>
                  Next: Define Task Types
                </button>
                <button className="btn btn-secondary" onClick={loadBuildExample}>
                  Load Example Data
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Task Types */}
          {buildStep === 2 && (
            <div className="card">
              <h2 style={{ marginBottom: '20px' }}>Define Your 3 Most Common Task Types</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {buildTasks.map((task, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                      padding: '16px',
                      border: '2px solid var(--border-color)',
                    }}
                  >
                    <h3 style={{ fontSize: '14px', color: 'var(--accent-blue)', marginBottom: '12px' }}>
                      {['📋', '📊', '💬'][i]} Task Type {i + 1}
                    </h3>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '13px' }}>Task Name</label>
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => {
                          const newTasks = [...buildTasks];
                          newTasks[i] = { ...newTasks[i], name: e.target.value };
                          setBuildTasks(newTasks);
                        }}
                        placeholder={`e.g., ${['Code Development', 'Documentation', 'Email/Reports'][i]}`}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '13px' }}>Typical Context Needed</label>
                      <textarea
                        value={task.context}
                        onChange={(e) => {
                          const newTasks = [...buildTasks];
                          newTasks[i] = { ...newTasks[i], context: e.target.value };
                          setBuildTasks(newTasks);
                        }}
                        placeholder="What information does AI typically need for this task?"
                        style={{ minHeight: '80px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setBuildStep(1)}>
                  Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={generateBuildTemplates}
                  disabled={!buildTasks.some((t) => t.name.trim())}
                >
                  Generate My Templates
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Generated Templates */}
          {buildStep === 3 && generatedTemplates.length > 0 && (
            <div>
              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px' }}>
                {[
                  { id: 'templates', label: '📝 Templates' },
                  { id: 'tracker', label: '📊 Testing Tracker' },
                  { id: 'export', label: '💾 Export' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`tab ${buildSubTab === tab.id ? 'active' : ''}`}
                    onClick={() => setBuildSubTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Templates sub-tab */}
              {buildSubTab === 'templates' && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        for (const template of generatedTemplates) {
                          await saveBuildTemplateToLibrary(template);
                        }
                        alert(`Saved ${generatedTemplates.length} templates to your library!`);
                      }}
                    >
                      Save All to Library ({generatedTemplates.length})
                    </button>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px', alignSelf: 'center' }}>
                      or save individual templates below
                    </span>
                  </div>

                  {generatedTemplates.map((template, index) => (
                    <div
                      key={index}
                      style={{
                        background: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '16px',
                        borderLeft: '4px solid var(--accent-blue)',
                      }}
                    >
                      <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>{template.icon}</span> {template.name}
                      </h3>
                      <pre
                        style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: '6px',
                          padding: '16px',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '300px',
                          overflow: 'auto',
                          margin: '0 0 12px',
                        }}
                      >
                        {template.content}
                      </pre>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" onClick={() => copyToClipboard(template.content)}>
                          📋 Copy
                        </button>
                        <button className="btn btn-primary" onClick={() => saveBuildTemplateToLibrary(template)}>
                          💾 Save to My Templates
                        </button>
                      </div>
                    </div>
                  ))}

                  <button className="btn btn-secondary" onClick={() => setBuildStep(1)} style={{ marginTop: '12px' }}>
                    Start Over
                  </button>
                </div>
              )}

              {/* Tracker sub-tab */}
              {buildSubTab === 'tracker' && (
                <div className="card">
                  <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Log your template usage to track what works and what needs refinement.
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>Template</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>What Worked</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>What Was Missing</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {trackerEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                            <input
                              type="date"
                              value={entry.date}
                              onChange={(e) => updateTrackerEntry(entry.id, 'date', e.target.value)}
                              style={{ padding: '6px' }}
                            />
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                            <select
                              value={entry.template}
                              onChange={(e) => updateTrackerEntry(entry.id, 'template', e.target.value)}
                              style={{ padding: '6px', width: '100%' }}
                            >
                              {generatedTemplates.map((t) => (
                                <option key={t.name} value={t.name}>{t.name}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                            <input
                              type="text"
                              value={entry.worked}
                              onChange={(e) => updateTrackerEntry(entry.id, 'worked', e.target.value)}
                              placeholder="What worked well"
                              style={{ padding: '6px', width: '100%' }}
                            />
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                            <input
                              type="text"
                              value={entry.missing}
                              onChange={(e) => updateTrackerEntry(entry.id, 'missing', e.target.value)}
                              placeholder="What was missing"
                              style={{ padding: '6px', width: '100%' }}
                            />
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => removeTrackerEntry(entry.id)}
                            >
                              X
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="btn btn-secondary" onClick={addTrackerEntry} style={{ marginTop: '12px' }}>
                    + Add Entry
                  </button>
                </div>
              )}

              {/* Export sub-tab */}
              {buildSubTab === 'export' && (
                <div className="card">
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                    <h4 style={{ marginBottom: '12px' }}>Export All Templates</h4>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '12px', fontSize: '13px' }}>
                      Download your templates in various formats for use in AI chats.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" onClick={() => exportBuildTemplates('json')}>
                        📦 Export JSON
                      </button>
                      <button className="btn btn-primary" onClick={() => exportBuildTemplates('markdown')}>
                        📄 Export Markdown
                      </button>
                      <button className="btn btn-primary" onClick={() => exportBuildTemplates('text')}>
                        📝 Export Plain Text
                      </button>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '16px' }}>
                    <h4 style={{ marginBottom: '12px' }}>Export Tracker Data</h4>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        const content = JSON.stringify({ exported_at: new Date().toISOString(), tracker_entries: trackerEntries }, null, 2);
                        const blob = new Blob([content], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'template-tracker.json';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      📊 Export Tracker (JSON)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <LessonNav currentLesson={3} />
    </div>
  );
}
