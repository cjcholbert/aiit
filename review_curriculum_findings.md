# Curriculum Design Review: The AI Collaborator

**Reviewer:** curriculum-reviewer
**Date:** 2026-02-15
**Scope:** Full curriculum architecture, lesson sequencing, concept coverage, and pedagogical approach across all 12 lessons.

---

## 1. Learning Objectives Clarity

### Rating: Needs Improvement

**Every lesson has a clear Problem/Skill pair** displayed prominently in the page header. This is a strong structural convention. However, the learning objectives lack formal rigor in several ways:

- **No Bloom's Taxonomy alignment.** Skill statements use informal language ("Learn to...", "Build...") rather than measurable verbs (analyze, evaluate, create, apply). For example, Lesson 1 says "The Skill: Providing complete context" when a measurable objective would be "Given an AI conversation, identify and supply the 3-5 missing context elements needed for a useful response."
- **No explicit success criteria per lesson.** Learners have no way to know when they have "mastered" a lesson. Lesson 12's Progress tab shows completion status, but individual lessons lack defined mastery thresholds.
- **Inconsistent granularity.** Some Problem/Skill pairs are precise (Lesson 5: "knowing when AI outputs need verification" / "systematically tracking AI accuracy across task types") while others are vague (Lesson 3: "starting from scratch every time" / "building reusable templates").
- **No stated prerequisites.** Although cross-lesson imports imply dependencies, no lesson explicitly states what prior knowledge or completed lessons are expected.

**Recommendation:** Add 2-3 measurable learning objectives per lesson using action verbs (identify, classify, construct, evaluate, synthesize). Add a "You'll know you've got it when..." checkpoint to each lesson.

---

## 2. Six-Concept Framework Evaluation

### Rating: Strong Foundation with Uneven Coverage

The six core managerial concepts are well-defined in CLAUDE.md and visually presented in CoreConcepts.jsx. The concept-to-lesson mapping:

| Concept | Lessons | Count |
|---------|---------|-------|
| Context Assembly | 1, 3, 4 | 3 |
| Quality Judgment | 5, 6 | 2 |
| Task Decomposition | 7, 8 | 2 |
| Iterative Refinement | 2, 9 | 2 |
| Workflow Integration | 10, 12 | 2 |
| Frontier Recognition | 11 | 1 |

**Strengths:**
- The six concepts are genuinely distinct and map well to real managerial responsibilities when working with AI.
- Each concept has a clear tagline, description, and bullet-point breakdown in CLAUDE.md.
- CoreConcepts.jsx provides a navigable concept map with direct lesson links.

**Weaknesses:**
- **Frontier Recognition is underserved.** It receives only one lesson (11) despite being arguably the most complex concept -- understanding what AI can and cannot do reliably, which evolves as models change. This concept deserves at least a second lesson or deeper integration into other lessons.
- **Context Assembly is overrepresented.** Three lessons (1, 3, 4) focus on context, which risks front-loading cognitive demand on a single concept while under-serving others.
- **Concept boundaries blur in practice.** Lesson 9 (Iterative Refinement) and Lesson 6 (Quality Judgment) both involve evaluating and improving AI output. The curriculum spec doesn't explicitly address how these concepts relate to and differ from each other.
- **No concept integration lesson before the capstone.** Lessons 1-11 each address individual concepts. Only Lesson 12 attempts synthesis, but as a reference card generator rather than an integrative exercise.

**Recommendation:** Consider splitting Lesson 11 into two lessons or weaving Frontier Recognition threads into Lessons 5, 6, and 9 where quality judgment naturally intersects with capability boundaries. Add explicit "concept connection" callouts in lessons where multiple concepts overlap.

---

## 3. Lesson Sequencing & Scaffolding

### Rating: Good with Notable Gaps

**Module Structure:**
- Module 1 (Foundation, L1-3): Context Assembly focus
- Module 2 (Documentation & Trust, L4-6): Context Docs + Quality Judgment
- Module 3 (Workflow, L7-10): Task Decomposition + Iterative Refinement + Workflow Integration
- Module 4 (Advanced, L11-12): Frontier Recognition + Capstone

**Strengths:**
- The progression from "understanding context" to "judging quality" to "decomposing and delegating tasks" to "managing AI capabilities" follows a logical cognitive ladder.
- Cross-lesson imports create concrete data-flow dependencies that reinforce the sequencing: L2 imports from L1, L6 from L5, L8 from L7, etc.
- All 12 lessons are accessible from the start (no sequential locking), which respects adult learner autonomy.

**Weaknesses:**
- **Lesson 1 has NO Learn tab.** This is the single most significant scaffolding gap. The very first lesson a learner encounters drops them directly into an "Analyze" activity with no instructional content. Every other lesson (2-12) has a Learn tab. A brand-new learner with no AI experience would likely feel lost.
- **Module 3 is overloaded.** It contains 4 lessons (7-10) spanning three different concepts (Task Decomposition, Iterative Refinement, Workflow Integration). Compare this to Module 4 which has only 2 lessons for 2 concepts. The cognitive load in Module 3 is disproportionate.
- **Lesson 9 placement is awkward.** Iterative Refinement (L2, L9) is split across Module 1 and Module 3 with a 7-lesson gap. Lesson 2 teaches feedback analysis (Iterative Refinement concept), then the concept isn't revisited until Lesson 9. This fragmentation could weaken concept retention.
- **No warm-up or orientation lesson.** There is no "Lesson 0" or introductory experience that explains the overall framework, sets expectations, or assesses the learner's starting point.
- **The capstone (L12) is thin.** At 503 lines, it's the shortest lesson. It generates a reference card but doesn't require learners to demonstrate integrated mastery through a culminating project or scenario.

**Recommendation:** Add a Learn tab to Lesson 1 immediately. Consider an introductory orientation that previews the six concepts. Rebalance Module 3 by moving one lesson or restructure the module boundaries. Strengthen L12 as a true capstone with an integrative exercise.

---

## 4. Content Completeness & Gaps

### Rating: Solid Core with Identifiable Gaps

**What's Present and Working Well:**
- All 12 lessons are fully implemented with functional UIs, backend API integration, and localStorage persistence.
- Practical exercises exist in every lesson (analyzers, builders, trackers, practice sessions).
- Statistical tracking (Stats tabs) appears in Lessons 4, 5, 6, 9, 10, 11 -- providing quantitative feedback.
- History tabs in Lessons 1, 2, 7, 8, 9 allow learners to review past work and see patterns.

**Content Gaps Identified:**

1. **No assessment or quiz mechanism.** The roadmap (Section 6) acknowledges this. Learners complete activities but are never tested on conceptual understanding. There's no way to distinguish "completed the exercise" from "understood the concept."

2. **No failure/mistake analysis.** Lessons teach what to do but rarely address common mistakes, misconceptions, or anti-patterns in depth. Lesson 2's Learn tab (vague vs. specific feedback) is the best example of teaching through contrast, but this pattern isn't consistently applied.

3. **No real AI interaction.** The exercises simulate AI interaction patterns (analyzing conversations, building templates, tracking outputs) but learners never actually interact with an AI within the platform. This creates a transfer gap -- learners practice the meta-skills but don't experience the full workflow.

4. **Limited scenario diversity.** The curriculum targets "common workers" but examples and templates tend toward generic business tasks. No domain-specific scenarios (healthcare, legal, creative, technical) that would help learners see how concepts apply to their specific work.

5. **No collaborative or social learning features.** All activities are individual. There's no peer review, shared templates, discussion forums, or team-based exercises, despite the curriculum teaching skills that are ultimately applied in team contexts.

6. **Missing explicit AI ethics/responsibility content.** The curriculum teaches effective AI use but doesn't address responsible AI use -- bias recognition, privacy considerations, appropriate disclosure of AI assistance, or organizational AI policies.

---

## 5. Problem-to-Skill Framing

### Rating: Strong

This is one of the curriculum's best design elements. Every lesson follows a consistent pattern:

| Lesson | The Problem | The Skill |
|--------|------------|-----------|
| 1 | AI gives generic responses | Providing complete context |
| 2 | Can't tell if AI output is good enough | Giving specific, actionable feedback |
| 3 | Starting from scratch every time | Building reusable templates |
| 4 | Context gets lost between sessions | Maintaining living context documents |
| 5 | Not knowing when to trust AI | Systematically tracking AI accuracy |
| 6 | Accepting AI output without checking | Building verification checklists |
| 7 | Giving AI tasks that are too big | Breaking complex tasks into right-sized pieces |
| 8 | Unclear delegation leads to rework | Structured delegation with clear criteria |
| 9 | Getting stuck with "good enough" output | Systematic multi-pass refinement |
| 10 | Repeating the same manual steps | Designing reusable AI workflows |
| 11 | Misunderstanding what AI can/can't do | Mapping AI reliability zones |
| 12 | Forgetting skills between uses | Personal reference card for AI collaboration |

**Strengths:**
- Every problem is relatable and specific -- learners can immediately recognize these frustrations from their own experience.
- Skills are framed as actionable behaviors, not abstract knowledge.
- The framing creates intrinsic motivation: "I have this problem, and this lesson will help me solve it."

**Weaknesses:**
- **Some skills are tool-dependent rather than transferable.** Lesson 4's skill ("maintaining living context documents") is tightly coupled to the specific document format taught in the lesson. If the learner uses a different AI tool, the template may not transfer.
- **Lesson 12's framing is the weakest.** "Forgetting skills" is a real problem, but a reference card is a crutch rather than a skill. A stronger framing might be "integrating all six concepts into your daily workflow."
- **Problems don't escalate in complexity.** Lesson 1's problem (generic responses) and Lesson 11's problem (misunderstanding AI capabilities) are at very different levels of sophistication, but the curriculum doesn't explicitly acknowledge or leverage this progression.

**Recommendation:** Add a brief "complexity note" to each lesson indicating where it falls on the novice-to-expert spectrum. Reframe Lesson 12 around integration and daily practice rather than just reference card generation.

---

## 6. Cross-Lesson Integration

### Rating: Good Infrastructure, Underutilized

**Import/Export Connections (confirmed in code):**

```
L2 (Feedback Analyzer) <-- imports from --> L1 (Context Tracker)
L6 (Verification Tools) <-- imports from --> L5 (Trust Matrix)
L8 (Delegation Tracker) <-- imports from --> L7 (Task Decomposer)
L9 (Iteration Passes) <-- imports from --> L1 (Context Tracker)
L10 (Status Reporter) <-- imports from --> L4 (Context Docs)
L11 (Frontier Mapper) <-- imports from --> L5 (Trust Matrix)
L12 (Reference Card) <-- aggregates from --> All lessons (progress data)
```

**Strengths:**
- The import system creates tangible connections between lessons, reinforcing the idea that skills build on each other.
- Data flows logically: context data feeds into feedback analysis; trust data feeds into verification and frontier mapping.
- Lesson 12 serves as an aggregation point for all lesson data.

**Weaknesses:**
- **Five lessons are import islands.** Lessons 1, 3, 4, 5, and 7 don't import from any other lesson. They are only export sources. This creates a one-directional dependency graph rather than a web of interconnections.
- **No backward references in Learn tabs.** When Lesson 8 imports from Lesson 7, the Learn tab doesn't explicitly remind learners what they learned in Lesson 7 or how it connects. The import is mechanical (data transfer) rather than pedagogical (concept reinforcement).
- **Cross-module connections are weak.** Most imports stay within or adjacent to their module (L1->L2 within Module 1, L5->L6 within Module 2, L7->L8 within Module 3). The cross-module links (L1->L9, L4->L10, L5->L11) exist but aren't pedagogically highlighted.
- **No "spiral" revisiting.** Once a concept is taught, it's not formally revisited with increased complexity. Iterative Refinement (L2 and L9) comes closest but the two lessons teach different sub-skills rather than the same concept at deeper levels.

**Recommendation:** Add "Connection Callouts" in Learn tabs that explicitly reference prior lessons. Create at least one cross-module exercise that requires learners to apply concepts from multiple modules simultaneously. Consider adding a mid-course integration checkpoint after Module 2.

---

## 7. Pedagogical Approach

### Rating: Practical and Hands-On, but Lacking Theoretical Grounding

**Observed Pedagogical Patterns:**

1. **Learn-Do-Review cycle:** Most lessons (2-12) follow a Learn tab -> Practice/Build tab -> History/Stats tab pattern. This maps loosely to instruction -> application -> reflection.

2. **Constructivist elements:** Lessons 3 (Template Builder), 4 (Context Docs), and 10 (Workflow Designer) have learners build their own artifacts rather than consume pre-built ones. This is strong constructivist pedagogy.

3. **Spaced repetition indicators:** The Stats tabs and History tabs allow learners to track improvement over time, supporting spaced practice.

4. **Situated learning:** Problems are framed in workplace contexts, and exercises use realistic scenarios.

**Strengths:**
- The "learn by doing" approach is appropriate for the target audience (working professionals who need practical skills).
- Tab-based navigation gives learners control over their learning path within each lesson.
- Export features (Lesson 12 Markdown/HTML export) support transfer to real work contexts.
- Lesson 5's "End-of-Week Progress Checklist" is an excellent self-assessment mechanism that should be replicated in more lessons.

**Weaknesses:**
- **No explicit pedagogical model.** The curriculum doesn't articulate whether it follows Bloom's Taxonomy, ADDIE, Merrill's First Principles, or another framework. This makes it harder to systematically improve.
- **Inconsistent lesson structure.** Tab configurations vary significantly across lessons (Lesson 1: Analyze/History; Lesson 5: Build Matrix/Track Predictions/Calibration/Stats; Lesson 10: Learn/Design/Run/Stats). While some variation is justified by content, the inconsistency may confuse learners about what to expect.
- **No formative assessment.** Learners complete activities but receive no structured feedback on whether they've met the learning objectives. The AI analysis features provide feedback on specific artifacts but not on overall skill development.
- **"Teach" tab appears only once.** Lesson 3 has a "Teach" tab, which aligns with the powerful pedagogical principle of "learning by teaching." This should appear in more lessons.
- **No differentiation for skill levels.** All learners get the same content regardless of prior experience. No pre-assessment, no adaptive difficulty, no "challenge mode" for advanced learners.

**Recommendation:** Adopt a consistent lesson template (e.g., Learn -> Practice -> Reflect -> Apply) with justified variations. Add self-assessment checkpoints modeled on Lesson 5's checklist. Consider a "Teach" or "Explain" component in more lessons.

---

## Per-Lesson Notes

### Lesson 1: Context Pattern Tracker
- **Critical Issue:** No Learn tab. Only lesson without instructional content before practice.
- Analyze tab is well-designed with conversation parsing and AI analysis.
- History tab includes stats, insights, and pattern recognition -- strong.
- Should be the gentlest on-ramp but is actually one of the more demanding lessons.

### Lesson 2: Feedback Analyzer
- Learn tab with vague vs. specific feedback comparisons is excellent pedagogy (learning through contrast).
- Import from Lesson 1 works well as a cross-lesson connection.
- Quality distribution stats in History provide good quantitative feedback.
- Could benefit from more diverse example scenarios.

### Lesson 3: Template Builder
- Very large and feature-rich (largest lesson file by far).
- Learn/Build/Teach structure is the best pedagogical design in the curriculum.
- "Teach" tab (explain to solidify understanding) should be a model for other lessons.
- Risk of overwhelming learners with too many features and options.
- Local storage for custom categories is good for personalization.

### Lesson 4: Context Docs
- Sessions workflow for maintaining living documents is practical and well-designed.
- Stats tab provides useful metrics on document maintenance habits.
- Learn tab content is solid.
- Could more explicitly connect to Lesson 1's context tracking.

### Lesson 5: Trust Matrix
- End-of-Week Progress Checklist is the best self-assessment feature in the curriculum.
- Over-trust/over-verify calibration analysis is sophisticated and valuable.
- Four-tab structure (Build Matrix/Track Predictions/Calibration/Stats) provides good depth.
- References "This module's goal" -- terminology should say "This lesson's goal."

### Lesson 6: Verification Tools
- Timed verification sessions add realistic pressure -- good design.
- Import from Trust Matrix (L5) creates strong Module 2 cohesion.
- References "Module 3 helped you calibrate when to verify" -- should reference "Lesson 5." Terminology inconsistency.
- Checklists are practical and immediately applicable to real work.

### Lesson 7: Task Decomposer
- Three-category framework (AI-Optimal, Collaborative, Human-Primary) is clear and useful.
- Learn tab teaches recognition signals effectively.
- At 649 lines, it's relatively compact -- appropriate for a focused concept.
- Could benefit from more complex decomposition examples.

### Lesson 8: Delegation Tracker
- 5-element delegation template is practical and memorable.
- Import from Task Decomposer (L7) creates natural Module 3 flow.
- AI review of task outputs adds a reflective element.
- Good balance of structure and flexibility.

### Lesson 9: Iteration Passes
- 70-85-95 framework with 3 structured passes is a clear, memorable model.
- Transition templates between passes are practical.
- Import from Context Tracker (L1) is a good cross-module connection.
- The concept could benefit from more explicit connection to Lesson 2's feedback skills.

### Lesson 10: Status Reporter (Workflow Integration)
- Most complex lesson with workflow template design, prompt templates, quality checks.
- Import from Context Docs (L4) reinforces cross-module connections.
- Time tracking and savings measurement provide concrete ROI evidence -- valuable for workplace justification.
- "Run" tab for executing workflows is strong hands-on design.
- Risk of scope creep -- tries to cover a lot in one lesson.

### Lesson 11: Frontier Mapper
- Reliability zones (reliable/mixed/unreliable) framework is intuitive.
- Import from Trust Matrix (L5) creates a strong L5->L11 arc.
- Simpler Learn tab compared to other lessons -- could use more depth given the concept's importance.
- As the sole Frontier Recognition lesson, it carries too much weight for this critical concept.
- "Encounters" tab for logging real-world AI capability observations is excellent.

### Lesson 12: Reference Card (Capstone)
- At 503 lines, the shortest and thinnest lesson.
- Reference card generation from all lesson data is a nice aggregation feature.
- Export to Markdown/HTML supports real-world transfer.
- **"12-week journey" terminology** is inconsistent with "lessons" used elsewhere.
- **Weak as a capstone.** Generates a reference card but doesn't require integrated demonstration of mastery.
- Progress tracking across all 12 lessons is useful but passive.

---

## Top 5 Strengths

1. **Consistent Problem/Skill framing** across all 12 lessons creates immediate learner motivation and clear purpose for each lesson. Every lesson answers "why should I care about this?"

2. **Cross-lesson import system** creates concrete data-flow connections between lessons, reinforcing the idea that skills build on each other and providing tangible evidence of progress.

3. **Hands-on, artifact-producing exercises** in every lesson. Learners build templates (L3), create documents (L4), construct matrices (L5), design workflows (L10), and generate reference cards (L12). This constructivist approach ensures active learning.

4. **Lesson 3's Learn/Build/Teach structure** exemplifies excellent pedagogical design. The "Teach" component leverages the well-established principle that explaining concepts to others deepens understanding.

5. **Quantitative self-tracking** through Stats tabs, History tabs, and Lesson 5's End-of-Week Checklist. Learners can see their own patterns and improvement over time, supporting metacognition and self-regulation.

---

## Top 5 Gaps / Weaknesses

1. **Lesson 1 has no Learn tab.** The very first lesson -- the learner's entry point -- provides no instructional content before asking them to analyze conversations. This is the most critical gap and should be the first fix.

2. **No assessment or mastery verification.** Learners complete activities but are never tested on conceptual understanding. There are no quizzes, no rubric-based evaluations, no mastery thresholds. It's impossible to distinguish task completion from skill acquisition.

3. **Terminology inconsistency.** "Lessons," "modules," "weeks," and "sessions" are used interchangeably across different files and within lessons themselves. Lesson 12 references "12-week journey," Lesson 6 references "Module 3" when it means Lesson 5, and the curriculum spec uses "Module" as the lesson label.

4. **Frontier Recognition (the most future-critical concept) gets only one lesson.** As AI capabilities evolve rapidly, understanding what AI can and cannot do is arguably the most important and dynamic concept. One lesson is insufficient for this complexity.

5. **Lesson 12 is a weak capstone.** At 503 lines and focused on reference card generation, it doesn't require learners to demonstrate integrated mastery of all six concepts. A capstone should be the most demanding lesson, not the simplest.

---

## Prioritized Recommendations

### Priority 1: Critical (Immediate)

1. **Add a Learn tab to Lesson 1.** Include: what context is in AI interactions, why it matters, examples of good vs. poor context, and the context gap patterns the Analyze tab will help identify. This is the single most impactful improvement.

2. **Fix terminology inconsistencies.** Standardize on "Lesson" for individual units and "Module" for groups. Search-and-replace "week" references in Lessons 6, 12, and other files. Update the curriculum spec to use consistent terminology.

### Priority 2: High (Near-Term)

3. **Add self-assessment checkpoints to every lesson.** Model on Lesson 5's End-of-Week Checklist. Each lesson should have 3-5 self-check questions that help learners evaluate whether they've understood the concept, not just completed the exercise.

4. **Strengthen Lesson 12 as a true capstone.** Add an integrative scenario exercise that requires applying all six concepts to a single complex task. The reference card can remain but should be a secondary feature, not the lesson's core.

5. **Expand Frontier Recognition coverage.** Either split Lesson 11 into two lessons or add Frontier Recognition threads into Lessons 5, 6, and 9 where quality judgment naturally intersects with AI capability boundaries.

### Priority 3: Medium (Planned)

6. **Add measurable learning objectives.** Each lesson should have 2-3 objectives using Bloom's Taxonomy verbs (identify, analyze, construct, evaluate). These should be visible in the Learn tab and referenced in the self-assessment checkpoint.

7. **Standardize lesson tab structure.** Establish a base template (Learn -> Practice -> Review/Stats) with documented, justified variations. This reduces cognitive overhead as learners navigate between lessons.

8. **Add "Connection Callouts" in Learn tabs.** When a lesson builds on a prior lesson's concept, the Learn tab should explicitly state: "In Lesson X, you learned [concept]. Now we'll extend that by..."

### Priority 4: Lower (Future Enhancements)

9. **Replicate Lesson 3's "Teach" tab in other lessons.** Even a simplified version ("Explain this concept in your own words") would deepen learning across the curriculum.

10. **Add an introductory orientation experience.** A "Lesson 0" or onboarding flow that previews the six concepts, assesses the learner's current skill level, and sets expectations for the learning journey.

---

*End of Curriculum Design Review*
