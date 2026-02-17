import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import SelfAssessmentChecklist from '../components/SelfAssessmentChecklist';
import { LESSON_CRITERIA } from '../config/assessmentCriteria';
import LessonNav from '../components/LessonNav';
import StatsPanel from '../components/StatsPanel';
import ConnectionCallout from '../components/ConnectionCallout';
import ExamplesDropdown from '../components/ExamplesDropdown';

export default function Lesson01() {
    const [activeTab, setActiveTab] = useState('learn');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [stats, setStats] = useState(null);
    const [insights, setInsights] = useState(null);
    const [userEdits, setUserEdits] = useState({ topic: '', pattern_category: '', habit_to_build: '', notes: '' });
    const [inputMethod, setInputMethod] = useState('paste'); // 'paste' or 'upload'
    const fileInputRef = useRef(null);

    // Converter state
    const [converterInput, setConverterInput] = useState('');
    const [converterOutput, setConverterOutput] = useState('');
    const [converterStats, setConverterStats] = useState(null);
    const [converterError, setConverterError] = useState('');

    const api = useApi();

    useEffect(() => {
        loadStats();
        loadInsights();
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            loadConversations();
        }
    }, [activeTab]);

    const loadConversations = async () => {
        try {
            const data = await api.get('/lesson1/conversations');
            setConversations(data);
        } catch (err) {
            setError('Failed to load conversations');
        }
    };

    const loadStats = async () => {
        try {
            const data = await api.get('/lesson1/patterns');
            setStats(data);
        } catch (err) {
            setError('Failed to load stats');
        }
    };

    const loadInsights = async () => {
        try {
            const data = await api.get('/lesson1/insights');
            setInsights(data);
        } catch (err) {
            setError('Failed to load insights');
        }
    };

    const saveEdits = async () => {
        if (!analysis) return;

        try {
            await api.put(`/lesson1/conversations/${analysis.id}`, { user_edits: userEdits });
            setAnalysis(null);
            setConverterInput('');
            setConverterOutput('');
            setConverterStats(null);
            setActiveTab('history');
            loadConversations();
        } catch (err) {
            setError('Failed to save');
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const data = await api.uploadFile('/lesson1/upload', file);
            setAnalysis(data);
            setUserEdits({
                topic: data.analysis.topic,
                pattern_category: data.analysis.pattern.category,
                habit_to_build: data.analysis.coaching.habit_to_build,
                notes: ''
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const loadConversation = async (id) => {
        try {
            const data = await api.get(`/lesson1/conversations/${id}`);
            setSelectedConversation(data);
        } catch (err) {
            setError('Failed to load conversation');
        }
    };

    const deleteConversation = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Delete this conversation?')) return;

        try {
            await api.del(`/lesson1/conversations/${id}`);
            loadConversations();
            if (selectedConversation?.id === id) {
                setSelectedConversation(null);
            }
        } catch (err) {
            setError('Failed to delete');
        }
    };

    const getScoreClass = (score) => {
        if (score >= 8) return 'high';
        if (score >= 5) return 'medium';
        return 'low';
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Converter functions
    const parseWithLabels = (text, userLabel, assistantLabel) => {
        const messages = [];
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const userEscaped = escapeRegex(userLabel);
        const assistantEscaped = escapeRegex(assistantLabel);
        const splitPattern = new RegExp(`(${userEscaped}|${assistantEscaped})`, 'g');
        const parts = text.split(splitPattern).filter(p => p.trim());

        let currentRole = null;
        let currentContent = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (part === userLabel) {
                if (currentRole && currentContent.trim()) {
                    messages.push({ role: currentRole, content: currentContent.trim() });
                }
                currentRole = 'user';
                currentContent = '';
            } else if (part === assistantLabel) {
                if (currentRole && currentContent.trim()) {
                    messages.push({ role: currentRole, content: currentContent.trim() });
                }
                currentRole = 'assistant';
                currentContent = '';
            } else if (currentRole) {
                currentContent += part;
            }
        }
        if (currentRole && currentContent.trim()) {
            messages.push({ role: currentRole, content: currentContent.trim() });
        }
        return messages;
    };

    const parseAlternating = (text) => {
        const blocks = text.split(/\n\s*\n/).filter(b => b.trim());
        return blocks.map((block, index) => ({
            role: index % 2 === 0 ? 'user' : 'assistant',
            content: block.trim()
        }));
    };

    const convertToJSON = () => {
        setConverterStats(null);
        setConverterError('');
        setConverterOutput('');

        if (!converterInput.trim()) {
            setConverterError('Please paste a conversation first.');
            return;
        }

        try {
            let messages = [];
            const labelPatterns = [
                { user: 'You:', assistant: 'AI:' },
                { user: 'Human:', assistant: 'Assistant:' },
                { user: 'User:', assistant: 'Assistant:' },
                { user: 'User:', assistant: 'Claude:' },
                { user: 'You:', assistant: 'Claude:' },
            ];

            // Auto-detect: try common label patterns first
            let parsed = false;
            for (const pattern of labelPatterns) {
                if (converterInput.includes(pattern.user) && converterInput.includes(pattern.assistant)) {
                    messages = parseWithLabels(converterInput, pattern.user, pattern.assistant);
                    parsed = true;
                    break;
                }
            }
            // Fallback to alternating paragraphs
            if (!parsed) {
                messages = parseAlternating(converterInput);
            }

            if (messages.length === 0) {
                throw new Error('No messages could be parsed. Try selecting a different format.');
            }

            const output = {
                messages: messages,
                exported_at: new Date().toISOString(),
                message_count: messages.length
            };

            setConverterOutput(JSON.stringify(output, null, 2));
            const userCount = messages.filter(m => m.role === 'user').length;
            const assistantCount = messages.filter(m => m.role === 'assistant').length;
            setConverterStats({ total: messages.length, user: userCount, assistant: assistantCount });
        } catch (err) {
            setConverterError(err.message);
        }
    };

    const downloadConverterJSON = () => {
        if (!converterOutput) return;
        const blob = new Blob([converterOutput], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyConverterJSON = () => {
        if (!converterOutput) return;
        navigator.clipboard.writeText(converterOutput);
    };

    const analyzeConverted = async () => {
        if (!converterOutput) return;

        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const data = JSON.parse(converterOutput);
            const formatted = data.messages.map(m =>
                `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
            ).join('\n\n');

            const result = await api.post('/lesson1/analyze', { raw_transcript: formatted });
            setAnalysis(result);
            setUserEdits({
                topic: result.analysis.topic,
                pattern_category: result.analysis.pattern.category,
                habit_to_build: result.analysis.coaching.habit_to_build,
                notes: ''
            });
        } catch (err) {
            setError(err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Context Pattern Tracker</h1>
            </div>

            <div className="lesson-progress-row">
                <SelfAssessmentChecklist lessonNumber={1} criteria={LESSON_CRITERIA[1]} />
                <StatsPanel stats={[
                    { label: 'Conversations', value: stats?.total_conversations ?? '-', color: 'var(--accent-blue)' },
                    { label: 'Avg Confidence', value: stats?.avg_confidence_score != null ? stats.avg_confidence_score.toFixed(1) : '-', color: 'var(--accent-green)' },
                    { label: 'Recurring Gaps', value: insights?.context_gaps?.length ?? '-', color: 'var(--accent-yellow)' },
                    { label: 'Context Strengths', value: insights?.context_strengths?.length ?? '-', color: 'var(--accent-purple)' },
                ]} />
            </div>

            <div className="tabs">
                {['learn', 'analyze', 'history'].map((tab) => (
                    <button
                        key={tab}
                        className={`tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(tab);
                            if (tab === 'analyze') { setAnalysis(null); setSelectedConversation(null); }
                            if (tab === 'history') { setSelectedConversation(null); }
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Learn Tab */}
            {activeTab === 'learn' && (
                <div className="learn-section">
                    <div className="learn-problem-skill">
                    <p><strong>The Problem:</strong> AI conversations fail when critical context is missing. You waste time on back-and-forth clarifications or get unusable outputs because you forgot to mention key constraints.</p>
                    <p><strong>The Skill:</strong> Identify your personal context gaps by analyzing past conversations. Discover what information you consistently forget to provide so you can fix it upfront.</p>
                </div>

                <div className="learn-intro">
                        <h2>The Foundation: Knowing What Context Your AI Needs</h2>
                        <p>
                            You ask AI to help draft a client proposal. It comes back with something generic and off-target.
                            You try again, adding that it's for a healthcare client. Better, but the tone is wrong. You
                            clarify the tone. Now it's too long. Three rounds in, you've spent more time correcting
                            than writing it yourself.
                        </p>
                        <p>
                            The issue wasn't the AI — it was missing context. You knew the client, the industry, the
                            budget constraints, and the preferred format. The AI knew none of it. This lesson helps you
                            find your personal blind spots: the context you consistently forget to provide, so you can
                            fix it before it costs you time.
                        </p>
                    </div>

                    <div className="learn-key-insight">
                        <strong>Key Insight:</strong> Everyone has context patterns — types of information they
                        reliably provide and types they consistently forget. By analyzing your past AI conversations,
                        you can identify your specific gaps and turn them into habits. This is the foundation
                        every other lesson builds on.
                    </div>

                    <h3>How This Lesson Works</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Two practice areas to discover and track your context patterns:
                    </p>

                    <div className="learn-patterns-grid">
                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-blue)' }}>Analyze Tab — Find Your Gaps</h4>
                            <p>Paste a real AI conversation (or upload a JSON export). The tool analyzes what context
                            you provided, what was missing, and what the AI had to guess. You'll get a specific coaching
                            suggestion and an improved version of your opening prompt.</p>
                            <button className="learn-tab-link" onClick={() => setActiveTab('analyze')}>Go to Analyze →</button>
                        </div>
                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-green)' }}>History Tab — Track Your Patterns</h4>
                            <p>See all your analyzed conversations in one place. Over time, recurring gaps and
                            strengths emerge — showing you exactly which context habits to build and which
                            ones you've already mastered.</p>
                            <button className="learn-tab-link" onClick={() => setActiveTab('history')}>Go to History →</button>
                        </div>
                    </div>

                    <div className="learn-comparison">
                        <h3>Without Context vs. With Context</h3>
                        <div className="learn-comparison-grid">
                            <div className="learn-comparison-col">
                                <h4 className="poor">Missing Context (Generic Output)</h4>
                                <div className="learn-comparison-item poor">
                                    <div className="learn-comparison-scenario">Event Planning</div>
                                    <p>"Help me plan a team offsite."</p>
                                </div>
                                <div className="learn-comparison-item poor">
                                    <div className="learn-comparison-scenario">Client Email</div>
                                    <p>"Write an email to my client about the project delay."</p>
                                </div>
                                <div className="learn-comparison-item poor">
                                    <div className="learn-comparison-scenario">Budget Review</div>
                                    <p>"Look at this spreadsheet and give me insights."</p>
                                </div>
                            </div>
                            <div className="learn-comparison-col">
                                <h4 className="good">Rich Context (Targeted Output)</h4>
                                <div className="learn-comparison-item good">
                                    <div className="learn-comparison-scenario">Event Planning</div>
                                    <p>"Help me plan a 2-day team offsite for 25 people in the Denver area. Budget is
                                    $8K. The goal is team bonding after a reorg — not strategy sessions. Half the team
                                    is remote and hasn't met in person."</p>
                                </div>
                                <div className="learn-comparison-item good">
                                    <div className="learn-comparison-scenario">Client Email</div>
                                    <p>"Write an email to our client (VP of Marketing at Greenfield Inc.) explaining
                                    that the campaign launch is delayed 2 weeks because of vendor artwork issues. We've
                                    already sourced a backup vendor. Tone: professional, reassuring. Keep it under 150 words."</p>
                                </div>
                                <div className="learn-comparison-item good">
                                    <div className="learn-comparison-scenario">Budget Review</div>
                                    <p>"Analyze our Q4 department spending (attached CSV). I need to find: which cost
                                    centers exceeded budget by more than 10%, whether the new contractor line items are
                                    trending up, and a summary I can present to our CFO in 3 bullet points."</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3>The Four Most Common Context Gaps</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        These are the patterns the Analyze tab looks for in your conversations. Learn to recognize
                        them so you can catch them before they waste your time.
                    </p>

                    <div className="learn-patterns-grid">
                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-red)' }}>Missing Constraints</h4>
                            <p>You describe what you want but leave out the boundaries: budget, timeline,
                            word count, audience level, or format requirements.</p>
                            <div className="learn-example-bad">
                                "Write me a marketing email."
                            </div>
                            <div className="learn-example-good">
                                "Write a 150-word marketing email for our spring wellness program, targeting
                                employees in the 25-40 age range. Tone: upbeat but not cheesy. Include a
                                registration link and a deadline."
                            </div>
                        </div>

                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-red)' }}>Assumed Knowledge</h4>
                            <p>You reference project details, acronyms, or past decisions without explaining
                            them — assuming the AI shares your memory.</p>
                            <div className="learn-example-bad">
                                "Update the TPS reports to match the new format from last week's meeting."
                            </div>
                            <div className="learn-example-good">
                                "Our weekly status reports need to switch from paragraph format to bullet points
                                with three sections: Completed, In Progress, and Blocked. Each bullet should be
                                one sentence max."
                            </div>
                        </div>

                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-red)' }}>Vague Goals</h4>
                            <p>Your request has no clear success criteria. The AI can't tell what "good"
                            looks like because you haven't defined it.</p>
                            <div className="learn-example-bad">
                                "Help me improve this document."
                            </div>
                            <div className="learn-example-good">
                                "This proposal needs to convince our director to approve a $15K training budget.
                                Strengthen the ROI section with specific time-savings estimates and add a comparison
                                to the cost of not training."
                            </div>
                        </div>

                        <div className="learn-pattern-card">
                            <h4 style={{ color: 'var(--accent-red)' }}>Missing Audience</h4>
                            <p>You don't specify who will read or use the output, so the AI picks a generic
                            tone and complexity level that may be wrong for your situation.</p>
                            <div className="learn-example-bad">
                                "Explain how our onboarding process works."
                            </div>
                            <div className="learn-example-good">
                                "Explain our 90-day onboarding process for a new HR coordinator who'll be running
                                it. They know HR basics but haven't seen our specific workflow. Include the timeline
                                and who to contact at each stage."
                            </div>
                        </div>
                    </div>

                    <h3>Common Mistakes</h3>
                    <div className="learn-patterns-grid" style={{ marginBottom: '24px' }}>
                        <div className="learn-pattern-card">
                            <div className="learn-pattern-label avoid">Mistake</div>
                            <p>Dumping every piece of information you have into the prompt. More context is not always
                            better — irrelevant details bury the important ones.</p>
                            <div className="learn-pattern-label better">Instead</div>
                            <div className="learn-example-good">
                                Match context depth to task complexity. A quick question needs 1-2 sentences of
                                background. A multi-step project needs a full briefing. Ask yourself: "Would a
                                smart colleague need this detail to help me?"
                            </div>
                        </div>
                        <div className="learn-pattern-card">
                            <div className="learn-pattern-label avoid">Mistake</div>
                            <p>Analyzing only conversations that went badly. You learn just as much from
                            conversations that went well — those reveal context you already provide reliably.</p>
                            <div className="learn-pattern-label better">Instead</div>
                            <div className="learn-example-good">
                                Analyze a mix of good and bad conversations. Your strengths are habits worth
                                keeping. Your gaps are habits worth building.
                            </div>
                        </div>
                        <div className="learn-pattern-card">
                            <div className="learn-pattern-label avoid">Mistake</div>
                            <p>Treating the analysis as a one-time exercise. Context habits change as your
                            work changes — new projects bring new gaps.</p>
                            <div className="learn-pattern-label better">Instead</div>
                            <div className="learn-example-good">
                                Analyze 2-3 conversations per week for the first month. After that, check in
                                whenever you start a new type of work or notice AI outputs declining in quality.
                            </div>
                        </div>
                    </div>

                    <div className="learn-next-step">
                        <h3>Ready to Find Your Context Gaps?</h3>
                        <p>Paste a real AI conversation into the Analyze tab. The tool will identify what context
                        was missing, what worked well, and give you a specific coaching suggestion for next time.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => { setActiveTab('analyze'); setAnalysis(null); }}
                        >
                            Go to Analyze
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'analyze' && !analysis && (
                <div className="card">
                    <h2 style={{marginBottom: '16px'}}>Analyze Conversation</h2>

                    {/* Input method toggle */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <button
                            className={`btn ${inputMethod === 'paste' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setInputMethod('paste')}
                            style={{ padding: '6px 16px', fontSize: '13px' }}
                        >
                            Paste Text
                        </button>
                        <button
                            className={`btn ${inputMethod === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setInputMethod('upload')}
                            style={{ padding: '6px 16px', fontSize: '13px' }}
                        >
                            Upload JSON
                        </button>
                    </div>

                    {inputMethod === 'paste' && (
                        <>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                Paste your AI conversation below. Common formats like You:/AI:, Human:/Assistant: are auto-detected.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <label style={{ fontWeight: '500', margin: 0 }}>Paste Conversation</label>
                                        <ExamplesDropdown
                                            endpoint="/lesson1/examples"
                                            onSelect={(example) => setConverterInput(example.raw_transcript)}
                                        />
                                    </div>
                                    <textarea
                                        value={converterInput}
                                        onChange={(e) => setConverterInput(e.target.value)}
                                        placeholder={`Paste your AI chat here...\n\nExample:\nYou: What is the capital of France?\nAI: The capital of France is Paris.`}
                                        style={{ minHeight: '250px', fontFamily: 'monospace', fontSize: '12px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Parsed Preview</label>
                                    <textarea
                                        value={converterOutput}
                                        readOnly
                                        placeholder="Parsed JSON will appear here..."
                                        style={{ minHeight: '250px', fontFamily: 'monospace', fontSize: '12px', background: 'var(--bg-tertiary)' }}
                                    />
                                </div>
                            </div>

                            {converterStats && (
                                <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--success-bg)', borderRadius: '4px', fontSize: '12px', color: 'var(--accent-green)' }}>
                                    Parsed {converterStats.total} messages ({converterStats.user} user, {converterStats.assistant} assistant)
                                </div>
                            )}
                            {converterError && (
                                <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--error-bg)', borderRadius: '4px', fontSize: '12px', color: 'var(--accent-red)' }}>
                                    {converterError}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'center' }}>
                                <button className="btn btn-secondary" onClick={convertToJSON} disabled={!converterInput.trim()}>
                                    Parse
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={analyzeConverted}
                                    disabled={!converterOutput || loading}
                                >
                                    {loading ? 'Analyzing...' : 'Analyze'}
                                </button>
                                {loading && <div className="loading"><div className="spinner"></div>Analyzing with Claude...</div>}
                            </div>
                        </>
                    )}

                    {inputMethod === 'upload' && (
                        <>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                Upload a JSON file with conversation messages. Expected format: <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '3px' }}>{"{ messages: [{role, content}, ...] }"}</code>
                            </p>

                            <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".json"
                                    style={{ display: 'none' }}
                                />
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={loading}
                                    style={{ padding: '12px 24px' }}
                                >
                                    {loading ? 'Uploading...' : 'Choose JSON File'}
                                </button>
                                <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    or drag and drop a .json file here
                                </p>
                            </div>

                            {loading && (
                                <div className="loading" style={{ marginTop: '16px' }}>
                                    <div className="spinner"></div>Uploading and analyzing with Claude...
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {activeTab === 'analyze' && analysis && (
                <div>
                    <div className="badge badge-purple" style={{marginBottom: '20px', fontSize: '14px', padding: '8px 16px'}}>
                        {analysis.analysis.topic}
                    </div>

                    <div className="analysis-grid">
                        <div className="analysis-card">
                            <h3>Coaching</h3>
                            <div className="field">
                                <div className="field-label">Context That Would Have Helped</div>
                                <div className="field-value">{analysis.analysis.coaching.context_that_would_have_helped}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Habit to Build</div>
                                <div className="field-value">{analysis.analysis.coaching.habit_to_build}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Improved Prompt</div>
                                <div className="prompt-rewrite">{analysis.analysis.coaching.prompt_rewrite}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Pattern</h3>
                            <div className="field">
                                <div className="field-label">Category</div>
                                <div className="field-value">{analysis.analysis.pattern.category}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Insight</div>
                                <div className="field-value">{analysis.analysis.pattern.insight}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Context Provided</h3>
                            <div className="field">
                                <div className="field-label">Details</div>
                                <div className="field-value">{analysis.analysis.context_provided.details}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">What Worked</div>
                                <div className="field-value">{analysis.analysis.context_provided.what_worked}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Context Added Later</h3>
                            <div className="field">
                                <div className="field-label">Details</div>
                                <div className="field-value">{analysis.analysis.context_added_later.details}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Triggers</div>
                                <div className="field-value">{analysis.analysis.context_added_later.triggers}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Could Have Been Upfront</div>
                                <div className="field-value">{analysis.analysis.context_added_later.could_have_been_upfront ? 'Yes' : 'No'}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Assumptions Wrong</h3>
                            <div className="field">
                                <div className="field-label">Details</div>
                                <div className="field-value">{analysis.analysis.assumptions_wrong.details}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Why Assumed</div>
                                <div className="field-value">{analysis.analysis.assumptions_wrong.why_assumed}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">User Contributed</div>
                                <div className="field-value">{analysis.analysis.assumptions_wrong.user_contributed}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Confidence</h3>
                            <div className="field">
                                <span className={`score ${getScoreClass(analysis.analysis.confidence.score)}`}>
                                    {analysis.analysis.confidence.score}/10
                                </span>
                            </div>
                            <div className="field">
                                <div className="field-label">Reasoning</div>
                                <div className="field-value">{analysis.analysis.confidence.reasoning}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{marginTop: '24px'}}>
                        <h2 style={{marginBottom: '16px'}}>Your Edits (Optional)</h2>
                        <div className="form-group">
                            <label>Topic</label>
                            <input
                                type="text"
                                value={userEdits.topic}
                                onChange={(e) => setUserEdits({...userEdits, topic: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Pattern Category</label>
                            <input
                                type="text"
                                value={userEdits.pattern_category}
                                onChange={(e) => setUserEdits({...userEdits, pattern_category: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Habit to Build</label>
                            <input
                                type="text"
                                value={userEdits.habit_to_build}
                                onChange={(e) => setUserEdits({...userEdits, habit_to_build: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                value={userEdits.notes}
                                onChange={(e) => setUserEdits({...userEdits, notes: e.target.value})}
                                placeholder="Any additional notes..."
                                style={{minHeight: '80px'}}
                            />
                        </div>
                        <div style={{display: 'flex', gap: '12px'}}>
                            <button className="btn btn-primary" onClick={saveEdits}>Confirm & Save</button>
                            <button className="btn btn-secondary" onClick={() => { setAnalysis(null); setConverterInput(''); setConverterOutput(''); setConverterStats(null); }}>
                                Analyze Another
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && !selectedConversation && (
                <div>
                    {/* Conversation History table */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h2 style={{marginBottom: '16px'}}>Conversation History</h2>
                        {conversations.length === 0 ? (
                            <p style={{color: 'var(--text-muted)'}}>No conversations yet. Analyze a transcript to get started.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Topic</th>
                                        <th>Date</th>
                                        <th>Pattern</th>
                                        <th>Confidence</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {conversations.map(conv => (
                                        <tr key={conv.id} onClick={() => loadConversation(conv.id)} style={{cursor: 'pointer'}}>
                                            <td>{conv.topic}</td>
                                            <td>{formatDate(conv.created_at)}</td>
                                            <td>{conv.pattern_category}</td>
                                            <td><span className={`score ${getScoreClass(conv.confidence_score)}`}>{conv.confidence_score}</span></td>
                                            <td>
                                                <button className="btn btn-danger" onClick={(e) => deleteConversation(conv.id, e)}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Two-column grid: Patterns (left) + Insights (right) */}
                    <div className="analysis-grid" style={{ marginBottom: '24px' }}>
                        <div>
                            <div className="card" style={{ marginBottom: '16px' }}>
                                <h3 style={{marginBottom: '12px'}}>Patterns by Category</h3>
                                {!stats || Object.keys(stats.count_by_category).length === 0 ? (
                                    <p style={{color: 'var(--text-muted)'}}>No patterns recorded yet.</p>
                                ) : (
                                    <div>
                                        {Object.entries(stats.count_by_category)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([category, count]) => (
                                                <div key={category} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                                                    <span>{category}</span>
                                                    <span className="badge badge-blue">{count}</span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            <div className="card">
                                <h3 style={{marginBottom: '12px'}}>Common Habits to Build</h3>
                                {!stats || stats.common_habits.length === 0 ? (
                                    <p style={{color: 'var(--text-muted)'}}>No habits recorded yet.</p>
                                ) : (
                                    stats.common_habits.map((item, i) => (
                                        <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)'}}>
                                            <span>{item.habit}</span>
                                            <span className="badge badge-green">{item.count}x</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="card" style={{ marginBottom: '16px' }}>
                                <h3 style={{ color: 'var(--accent-red)', marginBottom: '12px' }}>Context Gaps</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                                    Things you frequently forget to mention upfront.
                                </p>
                                {!insights || insights.context_gaps?.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>No recurring gaps identified yet.</p>
                                ) : (
                                    insights.context_gaps?.map((item, i) => (
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
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {item.count}x ({item.percentage}%)
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="card">
                                <h3 style={{ color: 'var(--accent-green)', marginBottom: '12px' }}>Context Strengths</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                                    Things you consistently provide well.
                                </p>
                                {!insights || insights.context_strengths?.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>No recurring strengths identified yet.</p>
                                ) : (
                                    insights.context_strengths?.map((item, i) => (
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
                                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>{item.strength}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {item.count}x ({item.percentage}%)
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Audit Summary table */}
                    <div className="card">
                        <h3 style={{ marginBottom: '16px' }}>Recent Audit Summary</h3>
                        {!insights || insights.audit_summary?.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No conversations analyzed yet.</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Topic</th>
                                        <th>Pattern</th>
                                        <th>Gap Found</th>
                                        <th>Strength Found</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {insights.audit_summary?.map((entry) => (
                                        <tr key={entry.id}>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {entry.topic}
                                            </td>
                                            <td>{entry.pattern}</td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--accent-red)' }}>
                                                {entry.gap || '-'}
                                            </td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--accent-green)' }}>
                                                {entry.strength || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'history' && selectedConversation && (
                <div>
                    <button className="btn btn-secondary" onClick={() => setSelectedConversation(null)} style={{marginBottom: '16px'}}>
                        Back to History
                    </button>
                    <div className="badge badge-purple" style={{marginBottom: '20px', fontSize: '14px', padding: '8px 16px'}}>
                        {selectedConversation.analysis.topic}
                    </div>

                    <div className="analysis-grid">
                        <div className="analysis-card">
                            <h3>Coaching</h3>
                            <div className="field">
                                <div className="field-label">Context That Would Have Helped</div>
                                <div className="field-value">{selectedConversation.analysis.coaching.context_that_would_have_helped}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Habit to Build</div>
                                <div className="field-value">{selectedConversation.analysis.coaching.habit_to_build}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Improved Prompt</div>
                                <div className="prompt-rewrite">{selectedConversation.analysis.coaching.prompt_rewrite}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Pattern</h3>
                            <div className="field">
                                <div className="field-label">Category</div>
                                <div className="field-value">{selectedConversation.analysis.pattern.category}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Insight</div>
                                <div className="field-value">{selectedConversation.analysis.pattern.insight}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Context Provided</h3>
                            <div className="field">
                                <div className="field-label">Details</div>
                                <div className="field-value">{selectedConversation.analysis.context_provided.details}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">What Worked</div>
                                <div className="field-value">{selectedConversation.analysis.context_provided.what_worked}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Context Added Later</h3>
                            <div className="field">
                                <div className="field-label">Details</div>
                                <div className="field-value">{selectedConversation.analysis.context_added_later.details}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Triggers</div>
                                <div className="field-value">{selectedConversation.analysis.context_added_later.triggers}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Assumptions Wrong</h3>
                            <div className="field">
                                <div className="field-label">Details</div>
                                <div className="field-value">{selectedConversation.analysis.assumptions_wrong.details}</div>
                            </div>
                            <div className="field">
                                <div className="field-label">Why Assumed</div>
                                <div className="field-value">{selectedConversation.analysis.assumptions_wrong.why_assumed}</div>
                            </div>
                        </div>

                        <div className="analysis-card">
                            <h3>Confidence</h3>
                            <div className="field">
                                <span className={`score ${getScoreClass(selectedConversation.analysis.confidence.score)}`}>
                                    {selectedConversation.analysis.confidence.score}/10
                                </span>
                            </div>
                            <div className="field">
                                <div className="field-label">Reasoning</div>
                                <div className="field-value">{selectedConversation.analysis.confidence.reasoning}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{marginTop: '24px'}}>
                        <h3 style={{marginBottom: '12px'}}>Original Transcript</h3>
                        <pre style={{whiteSpace: 'pre-wrap', color: 'var(--text-muted)', fontSize: '12px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '6px'}}>
                            {selectedConversation.raw_transcript}
                        </pre>
                    </div>
                </div>
            )}

            <LessonNav currentLesson={1} />
        </div>
    );
}
