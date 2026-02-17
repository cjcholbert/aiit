"""Lesson 4: Context Docs - Example project context documents by professional category.

Six categorized project context documents showing how to maintain living
documentation that gives AI the background it needs for continuity across
work sessions.
"""

EXAMPLE_CATEGORIES = [
    "Project Management",
    "Marketing",
    "Human Resources",
    "Finance",
    "Education",
    "Operations",
]

EXAMPLE_CONTEXT_DOCS = [
    {
        "category": "Project Management",
        "project_name": "Annual Company Retreat Planning",
        "description": (
            "Coordinating the 2026 annual company retreat for 120 employees. "
            "Includes venue selection, travel logistics, team-building programming, "
            "meals, and leadership presentations. Budget of $45,000 approved by "
            "the executive team. Target date is the third weekend of April 2026."
        ),
        "current_state": {
            "complete": [
                "Executive approval for $45,000 budget secured on January 8, 2026",
                "Venue shortlist narrowed to three properties within 90 minutes of the office",
                "Employee dietary survey completed with 118 of 120 responses collected"
            ],
            "in_progress": [
                "Negotiating group rates with Mountain View Lodge, the top-ranked venue",
                "Drafting the two-day agenda with input from department heads",
                "Collecting session proposals from team leads for the breakout tracks"
            ],
            "blocked": [
                "Transportation vendor quotes are stalled because we need a final headcount by March 1, and three departments have not confirmed attendance",
                "The AV equipment rental cannot be finalized until the venue contract is signed"
            ]
        },
        "key_decisions": [
            {
                "decision": "Selected outdoor venue format over hotel conference center",
                "reasoning": "Employee survey showed 78 percent preferred outdoor or nature-based settings. Mountain View Lodge offers both indoor meeting rooms and outdoor activity areas, which gives us flexibility for weather.",
                "date": "2026-01-15"
            },
            {
                "decision": "Eliminated the Friday departure option in favor of Saturday-Sunday",
                "reasoning": "Finance flagged that a Friday departure would cost an additional $8,000 in lost productivity. Saturday start keeps the retreat within budget and avoids the optics of taking a full workday off.",
                "date": "2026-01-22"
            },
            {
                "decision": "Capped the breakout session tracks at four to avoid schedule fragmentation",
                "reasoning": "Last year we ran six tracks and attendance per session averaged only 12 people. Four tracks with 25-30 people each creates better energy and discussion.",
                "date": "2026-02-03"
            }
        ],
        "known_issues": [
            {
                "issue": "Mountain View Lodge has a hard limit of 110 guests for seated dinner",
                "workaround": "Exploring a tented overflow area or adjusting to a buffet format that does not require fixed seating. Awaiting a quote from the venue for the tent option.",
                "status": "open"
            },
            {
                "issue": "Two executives have a scheduling conflict with the April date",
                "workaround": "CEO confirmed the date stands. The two executives will join remotely for the keynote session and attend an abbreviated version on Sunday morning.",
                "status": "resolved"
            },
            {
                "issue": "Previous retreat received complaints about the team-building activities feeling forced",
                "workaround": "This year all breakout activities will be opt-in with multiple options per time slot so no one feels pressured into a specific activity.",
                "status": "resolved"
            }
        ],
        "lessons_learned": [
            {
                "lesson": "Start venue negotiations at least four months out to get group rate leverage",
                "context": "Last year we started eight weeks before and had no bargaining power. The venue knew we were locked in.",
                "date": "2025-05-10"
            },
            {
                "lesson": "Always collect dietary needs at least six weeks before the event, not two",
                "context": "The 2025 retreat had three last-minute dietary issues that the caterer could not accommodate on short notice.",
                "date": "2025-05-12"
            },
            {
                "lesson": "Assign a dedicated point of contact at the venue rather than working through general reservations",
                "context": "Communication delays through the general line caused a double-booking scare in 2025 that took a week to resolve.",
                "date": "2025-05-15"
            }
        ],
        "next_goals": [
            {"goal": "Finalize venue contract with Mountain View Lodge", "priority": "high"},
            {"goal": "Get final headcount confirmations from the three outstanding departments", "priority": "high"},
            {"goal": "Select and book the keynote speaker or facilitator for the opening session", "priority": "medium"},
            {"goal": "Draft the full two-day schedule and circulate to department heads for review", "priority": "medium"}
        ],
    },
    {
        "category": "Marketing",
        "project_name": "Brand Identity Refresh",
        "description": (
            "Leading a brand identity refresh for a mid-size professional services "
            "firm. The current brand has not been updated in seven years and no "
            "longer reflects the company's expanded service offerings or target "
            "market. Working with an external design agency and internal stakeholders "
            "to develop a new visual identity, messaging framework, and brand "
            "guidelines. Rollout planned for Q2 2026."
        ),
        "current_state": {
            "complete": [
                "Brand audit completed: surveyed 45 clients and 80 employees on brand perception",
                "Agency selection finalized after reviewing five proposals; contracted with Greenline Creative",
                "Competitive analysis of eight peer firms delivered with positioning gaps identified"
            ],
            "in_progress": [
                "Agency is developing three visual direction concepts based on the brief",
                "Drafting the updated messaging framework including mission, vision, and value propositions",
                "Inventorying all branded materials that will need updating (estimated 140 items across print and digital)"
            ],
            "blocked": [
                "Executive team cannot agree on whether to change the company name along with the visual refresh; this decision is holding up the logo concepts",
                "Legal review of the new tagline options is delayed because outside counsel is on leave until February 24"
            ]
        },
        "key_decisions": [
            {
                "decision": "Keep the existing company name and refresh the visual identity only",
                "reasoning": "Client survey showed 82 percent brand name recognition. Changing the name would sacrifice that equity and require expensive legal re-registration across 12 states. The CEO agreed to settle this after weeks of debate.",
                "date": "2026-02-10"
            },
            {
                "decision": "Prioritize digital-first brand assets over print materials",
                "reasoning": "Analytics show 90 percent of client touchpoints are digital (website, email, LinkedIn). Print materials like brochures account for less than 5 percent of client interactions and can be updated in Phase 2.",
                "date": "2026-01-20"
            },
            {
                "decision": "Hired a freelance copywriter in addition to the agency to handle internal communications messaging",
                "reasoning": "The agency's strength is visual design, not long-form writing. The internal messaging (employee handbook, intranet, training materials) needs a different voice than client-facing copy.",
                "date": "2026-01-28"
            }
        ],
        "known_issues": [
            {
                "issue": "The sales team is concerned that changing the brand mid-pipeline will confuse active prospects",
                "workaround": "Created a transition plan where active proposals keep the current brand through close, and new prospects receive updated materials. Sales team was briefed and signed off.",
                "status": "resolved"
            },
            {
                "issue": "The agency's timeline for the visual concepts has slipped by two weeks",
                "workaround": "Adjusted the internal review schedule to compress the feedback cycle from three rounds to two. Stakeholder previews will happen in one consolidated session instead of individual meetings.",
                "status": "open"
            },
            {
                "issue": "Budget for material reprinting may exceed the original $12,000 allocation",
                "workaround": "Requesting an additional $5,000 from the marketing reserve fund. Prioritizing high-visibility items first and deferring low-use items to Q3.",
                "status": "open"
            }
        ],
        "lessons_learned": [
            {
                "lesson": "Get executive alignment on scope before engaging the agency to avoid mid-project pivots",
                "context": "The name change debate consumed three weeks of the project timeline because it was not resolved upfront.",
                "date": "2026-02-10"
            },
            {
                "lesson": "Include IT in the stakeholder group from the start for any digital brand changes",
                "context": "IT flagged that the email signature templates are managed through a system that requires two weeks of lead time for changes. We almost missed this.",
                "date": "2026-01-25"
            },
            {
                "lesson": "Request the full material inventory before scoping the agency work",
                "context": "We discovered 40 additional branded items (event banners, name badges, vehicle wraps) after the agency quote was finalized, which will increase costs.",
                "date": "2026-02-05"
            }
        ],
        "next_goals": [
            {"goal": "Review and select one of the three visual direction concepts from the agency", "priority": "high"},
            {"goal": "Finalize the messaging framework and get sign-off from the leadership team", "priority": "high"},
            {"goal": "Complete legal review of the new tagline options", "priority": "medium"},
            {"goal": "Begin website redesign planning with the selected visual direction", "priority": "medium"}
        ],
    },
    {
        "category": "Human Resources",
        "project_name": "Employee Engagement Survey Program",
        "description": (
            "Designing and launching a company-wide employee engagement survey for "
            "a 300-person organization. This is the first formal engagement survey "
            "in three years. The program includes survey design, communication and "
            "rollout, data analysis, and action planning with department leaders. "
            "Goal is to establish a recurring annual survey with quarterly pulse checks."
        ),
        "current_state": {
            "complete": [
                "Selected SurveyMonkey as the survey platform after evaluating three options",
                "Drafted the 35-question survey instrument covering eight engagement dimensions",
                "Secured executive sponsorship with the CEO agreeing to record an intro video"
            ],
            "in_progress": [
                "Pilot testing the survey with a focus group of 15 employees from different departments",
                "Building the communication plan for the two-week survey window",
                "Coordinating with IT to distribute the survey link through the company intranet and email"
            ],
            "blocked": [
                "The legal team wants to review the anonymity guarantees before launch, and their review is scheduled for the week of February 24",
                "One department head (Sales) has not agreed to participate, citing concerns that survey results will be used against his team"
            ]
        },
        "key_decisions": [
            {
                "decision": "Made the survey anonymous rather than confidential",
                "reasoning": "Employee focus groups strongly preferred full anonymity. Confidential surveys (where HR can see individual responses but promises not to share) had low trust scores in our informal polls. Anonymous responses will likely yield higher participation and more honest answers.",
                "date": "2026-01-12"
            },
            {
                "decision": "Limited the survey to 35 questions to keep completion time under 12 minutes",
                "reasoning": "Research from our vendor shows that completion rates drop significantly after 15 minutes. We cut 20 proposed questions that overlapped or addressed niche topics better handled in department-level follow-ups.",
                "date": "2026-01-18"
            },
            {
                "decision": "Results will be shared with all employees, not just leadership",
                "reasoning": "Transparency builds trust and demonstrates that the organization takes the survey seriously. Department-level results will be shared with respective teams, and company-wide results will be published in a town hall format.",
                "date": "2026-02-01"
            }
        ],
        "known_issues": [
            {
                "issue": "Historical low trust in anonymous surveys due to a 2022 incident where a manager identified a respondent",
                "workaround": "CEO will address this directly in the intro video. Survey platform settings have been configured so that results with fewer than five respondents in a group are suppressed. We are also publishing a one-page FAQ addressing anonymity.",
                "status": "open"
            },
            {
                "issue": "Remote employees in different time zones may have lower participation rates",
                "workaround": "Extended the survey window from one week to two weeks. Scheduled reminder emails at different times to reach all time zones. Managers of remote teams will mention the survey in their regular check-ins.",
                "status": "resolved"
            },
            {
                "issue": "Sales department head resistant to participation",
                "workaround": "CHRO is scheduling a one-on-one to address concerns. Will clarify that results are for improvement, not punishment, and that his team's input is especially valuable given recent turnover in that department.",
                "status": "open"
            }
        ],
        "lessons_learned": [
            {
                "lesson": "Pilot test the survey with a diverse group, not just HR-friendly employees",
                "context": "The initial pilot group was all from the HR and admin teams who gave positive feedback. When we added participants from operations and sales, they flagged three questions as confusing or leading.",
                "date": "2026-02-08"
            },
            {
                "lesson": "Build the action planning framework before launching the survey, not after",
                "context": "Previous informal surveys collected data but never led to visible changes. Having the action planning process ready ensures that results lead to follow-through.",
                "date": "2026-01-20"
            },
            {
                "lesson": "Get the CEO involved early; executive sponsorship dramatically increases participation",
                "context": "In a peer company's experience, CEO-endorsed surveys saw 85 percent completion versus 55 percent without executive backing.",
                "date": "2026-01-10"
            }
        ],
        "next_goals": [
            {"goal": "Complete the pilot test and finalize the survey questions", "priority": "high"},
            {"goal": "Resolve the Sales department participation concern through CHRO meeting", "priority": "high"},
            {"goal": "Finalize and distribute the communication plan to all managers", "priority": "medium"},
            {"goal": "Set up the results dashboard template so analysis can begin immediately after close", "priority": "medium"}
        ],
    },
    {
        "category": "Finance",
        "project_name": "Year-End Audit Preparation",
        "description": (
            "Preparing for the annual external audit for fiscal year 2025. The "
            "audit firm is Baker & Associates, and fieldwork is scheduled to begin "
            "March 10, 2026. This project covers documentation gathering, internal "
            "control testing, reconciliation cleanup, and coordination with the "
            "audit team. The company has $28M in annual revenue across three "
            "business units."
        ),
        "current_state": {
            "complete": [
                "Received the audit request list (PBC list) from Baker & Associates on January 20",
                "Completed all 12 monthly bank reconciliations for 2025",
                "Closed the general ledger for December 2025 with all adjusting entries posted"
            ],
            "in_progress": [
                "Gathering supporting documentation for the 15 largest revenue contracts per the PBC list",
                "Performing the annual inventory count reconciliation with the warehouse team",
                "Updating the internal control documentation to reflect process changes made in Q3 2025"
            ],
            "blocked": [
                "The accounts payable accrual analysis is waiting on three vendor invoices that were due in January but have not arrived; the vendors have been contacted twice",
                "The fixed asset schedule cannot be finalized because the facilities team has not completed the physical verification of assets added in Q4 2025"
            ]
        },
        "key_decisions": [
            {
                "decision": "Moved the inventory count date from January 31 to January 15 to allow more reconciliation time",
                "reasoning": "Last year the count was on January 28, leaving only 10 days to reconcile before fieldwork. The earlier date gives the team four full weeks to resolve discrepancies.",
                "date": "2025-12-15"
            },
            {
                "decision": "Hired a temporary staff accountant for six weeks to support audit preparation",
                "reasoning": "The team is short one person after a resignation in November. The temp will handle PBC document compilation so the senior staff can focus on complex reconciliations and auditor inquiries.",
                "date": "2026-01-05"
            },
            {
                "decision": "Adopted a shared portal for audit document exchange instead of email",
                "reasoning": "Last year, email-based document exchange resulted in version confusion and lost attachments. The portal provides a single source of truth with audit trail and status tracking for each request.",
                "date": "2026-01-10"
            }
        ],
        "known_issues": [
            {
                "issue": "Revenue recognition for two multi-year contracts may require additional disclosure under the new standard",
                "workaround": "Scheduled a pre-audit consultation with Baker & Associates for February 28 to align on the treatment before fieldwork begins. Prepared a memo documenting the company's position with supporting calculations.",
                "status": "open"
            },
            {
                "issue": "The inventory count revealed a $34,000 variance between the physical count and the system records",
                "workaround": "Investigating the variance by SKU. Preliminary review suggests most of the difference is in one product category where a receiving error in October was not corrected. Expect to resolve with a journal entry adjustment.",
                "status": "open"
            },
            {
                "issue": "Baker & Associates assigned a new audit manager this year who is unfamiliar with the company",
                "workaround": "Scheduled an orientation call for February 20 to walk the new manager through the business model, key accounting policies, and prior year audit findings. Prepared a company overview document.",
                "status": "resolved"
            }
        ],
        "lessons_learned": [
            {
                "lesson": "Start PBC document gathering in December, not January, to avoid the post-holiday crunch",
                "context": "January is already compressed with year-end close. Starting PBC collection in December for items that do not change (leases, loan agreements, org charts) spreads the workload.",
                "date": "2026-01-20"
            },
            {
                "lesson": "Maintain a running list of unusual transactions throughout the year rather than reconstructing them at year-end",
                "context": "The auditors asked about five unusual journal entries and it took two days to track down the supporting documentation because no one remembered the context six months later.",
                "date": "2025-04-15"
            },
            {
                "lesson": "Confirm the audit team and timeline in writing by December 1 to avoid scheduling surprises",
                "context": "In 2024, the audit firm changed the fieldwork dates with two weeks notice, which disrupted vacation plans for two team members.",
                "date": "2025-12-01"
            }
        ],
        "next_goals": [
            {"goal": "Complete all PBC document uploads to the shared portal by March 1", "priority": "high"},
            {"goal": "Resolve the inventory variance and post the correcting journal entry", "priority": "high"},
            {"goal": "Finalize the fixed asset physical verification with facilities", "priority": "medium"},
            {"goal": "Hold the pre-audit consultation with Baker & Associates on the revenue recognition questions", "priority": "medium"}
        ],
    },
    {
        "category": "Education",
        "project_name": "Professional Development Workshop Series",
        "description": (
            "Designing and delivering a six-session professional development "
            "workshop series for 40 mid-career professionals in a corporate "
            "learning program. Topics cover leadership communication, project "
            "management fundamentals, conflict resolution, data-informed decision "
            "making, presentation skills, and career development planning. Sessions "
            "run biweekly from February through April 2026."
        ),
        "current_state": {
            "complete": [
                "Finalized the six-session curriculum outline with learning objectives for each workshop",
                "Recruited and confirmed three guest facilitators for Sessions 3, 4, and 6",
                "Completed the participant needs assessment survey with 38 of 40 respondents"
            ],
            "in_progress": [
                "Developing the detailed facilitator guides and participant handouts for Sessions 1 and 2",
                "Setting up the learning management system to track attendance and distribute pre-work materials",
                "Designing the capstone project framework where participants apply skills from all six sessions"
            ],
            "blocked": [
                "Session 4 (Data-Informed Decision Making) needs sample datasets from the analytics team, but they are in a quarterly reporting crunch and cannot provide them until the week of February 24",
                "The room reservation for Session 3 was double-booked and facilities has not yet confirmed an alternative space"
            ]
        },
        "key_decisions": [
            {
                "decision": "Limited cohort size to 40 participants to maintain interactive format",
                "reasoning": "Original request was for 60 participants. Research on adult learning shows that groups over 40 significantly reduce discussion quality and individual practice time. Will run a second cohort in Q3 if demand warrants.",
                "date": "2025-12-10"
            },
            {
                "decision": "Added a capstone project instead of a written exam for the final assessment",
                "reasoning": "Participants are experienced professionals who learn better by applying concepts to real workplace challenges. The capstone asks each participant to complete a real project using at least three skills from the series.",
                "date": "2026-01-08"
            },
            {
                "decision": "Shifted from three-hour sessions to two-hour sessions with pre-work assignments",
                "reasoning": "Participant feedback from the needs assessment indicated that three-hour blocks were difficult to protect on their calendars. Two-hour sessions with 30 minutes of pre-work achieves similar depth with less schedule disruption.",
                "date": "2026-01-15"
            }
        ],
        "known_issues": [
            {
                "issue": "Five participants are in a different time zone and cannot attend the in-person sessions",
                "workaround": "Offering a hybrid option for remote participants with a dedicated facilitator monitor to manage their breakout groups via video. Tested the setup in a dry run and it worked well for groups of three to four remote participants.",
                "status": "resolved"
            },
            {
                "issue": "Two guest facilitators have not signed their speaker agreements",
                "workaround": "Sent a follow-up with a simplified one-page agreement. Both responded positively and are expected to return signed copies by February 21.",
                "status": "open"
            },
            {
                "issue": "Pre-work completion rates in similar past programs averaged only 40 percent",
                "workaround": "Making pre-work short (under 20 minutes), directly relevant to the session activity, and sending a personal reminder from the participant's manager the day before each session.",
                "status": "open"
            }
        ],
        "lessons_learned": [
            {
                "lesson": "Send calendar invitations for all six sessions at once during registration, not session by session",
                "context": "In a previous program, sending invitations one at a time led to participants booking over later sessions because they did not know the full schedule upfront.",
                "date": "2025-09-20"
            },
            {
                "lesson": "Build 15 minutes of buffer into every two-hour session for discussion overflow",
                "context": "Adult learners bring rich experience to discussions, which often run long. A tight schedule forces the facilitator to cut off valuable conversation.",
                "date": "2025-10-05"
            },
            {
                "lesson": "Pair participants from different departments for group exercises to build cross-functional relationships",
                "context": "Post-program surveys consistently rate cross-departmental networking as one of the most valuable outcomes, sometimes above the content itself.",
                "date": "2025-11-15"
            }
        ],
        "next_goals": [
            {"goal": "Complete and distribute facilitator guides for Sessions 1 and 2", "priority": "high"},
            {"goal": "Confirm the alternative room for Session 3 with facilities", "priority": "high"},
            {"goal": "Obtain sample datasets from the analytics team for Session 4", "priority": "medium"},
            {"goal": "Send the full program schedule and pre-work for Session 1 to all participants", "priority": "medium"}
        ],
    },
    {
        "category": "Operations",
        "project_name": "Office Relocation Project",
        "description": (
            "Managing the relocation of a 75-person office from the current "
            "downtown location to a new space in the Riverside Business Park, "
            "three miles away. The new lease begins April 1, 2026, and the target "
            "move-in date is April 11-12 (a weekend). The project covers space "
            "planning, vendor coordination, IT infrastructure migration, employee "
            "communication, and minimizing business disruption. Budget is $85,000 "
            "for the move itself, excluding the lease."
        ),
        "current_state": {
            "complete": [
                "Signed the lease for the Riverside Business Park space on January 5, 2026",
                "Completed the new office floor plan with assigned workstations for all 75 employees",
                "Selected and contracted the moving company (Metro Relocations) for the April 11-12 weekend"
            ],
            "in_progress": [
                "IT is running cabling and setting up the network infrastructure at the new location",
                "Ordering new furniture for the 12 workstations that need replacement (existing furniture will be reused for the other 63)",
                "Developing the employee communication packet with new commute options, parking details, and move-day instructions"
            ],
            "blocked": [
                "The building permit for the server room electrical upgrade at the new location has not been approved by the city; expected turnaround is two to three weeks but it is already one week overdue",
                "The current landlord has not confirmed whether we can access the old space after April 15 for remaining item pickup, which affects the packing timeline"
            ]
        },
        "key_decisions": [
            {
                "decision": "Move over a single weekend rather than phased over two weeks",
                "reasoning": "A phased move would mean running two offices simultaneously, doubling IT support needs and confusing clients. A weekend move causes one day of reduced productivity on Monday but is cleaner and cheaper overall.",
                "date": "2026-01-12"
            },
            {
                "decision": "Reuse existing furniture for 63 of 75 workstations instead of buying all new",
                "reasoning": "Saves approximately $35,000. The existing desks and chairs are less than three years old and in good condition. Only 12 stations with damaged or non-ergonomic furniture will be replaced.",
                "date": "2026-01-18"
            },
            {
                "decision": "Hired a temporary IT contractor for the two weeks around the move to ensure coverage",
                "reasoning": "Our two-person IT team cannot handle the infrastructure setup at the new location while maintaining support at the old location. The contractor will manage the new site setup while IT maintains business operations.",
                "date": "2026-02-01"
            }
        ],
        "known_issues": [
            {
                "issue": "The new location has 60 parking spots for 75 employees, a shortfall of 15",
                "workaround": "Negotiated 10 additional spots in the adjacent lot for $200 per month. Promoting a carpool matching program and transit subsidy for the remaining five. Surveyed employees and eight already use public transit.",
                "status": "resolved"
            },
            {
                "issue": "The server room electrical permit delay could push the IT migration past the move date",
                "workaround": "IT has a contingency plan to use a temporary cloud-based setup for the first week if the server room is not ready. Critical systems can run from the cloud, and the on-premise migration would happen the following week.",
                "status": "open"
            },
            {
                "issue": "Three employees have expressed concerns about the longer commute to the new location",
                "workaround": "HR is offering a 90-day commute adjustment period with flexible start times. Two of the three employees are also eligible for the transit subsidy, which reduces their cost. Having individual conversations with each person.",
                "status": "open"
            }
        ],
        "lessons_learned": [
            {
                "lesson": "Do a walkthrough of the new space with the IT team before finalizing the floor plan",
                "context": "The initial floor plan placed six workstations in a zone with insufficient power outlets. IT caught this during their site visit, and we reorganized before furniture was ordered.",
                "date": "2026-01-25"
            },
            {
                "lesson": "Negotiate post-move access to the old location in the lease termination agreement, not as an afterthought",
                "context": "We assumed we could access the old space for a week after the move but the landlord's standard terms end access on the lease termination date. Now we are negotiating separately, which gives us less leverage.",
                "date": "2026-02-05"
            },
            {
                "lesson": "Label every box, cable, and piece of furniture with a destination room and workstation number",
                "context": "A colleague's company did an unlabeled move and spent three days after the weekend just finding where things went. Color-coded labels by department with workstation numbers will save significant time.",
                "date": "2026-02-10"
            }
        ],
        "next_goals": [
            {"goal": "Follow up on the server room electrical permit and confirm approval date", "priority": "high"},
            {"goal": "Finalize and distribute the employee communication packet by March 1", "priority": "high"},
            {"goal": "Complete furniture delivery and setup at the new location by March 28", "priority": "medium"},
            {"goal": "Conduct a move-day rehearsal with the moving company and IT team", "priority": "medium"}
        ],
    },
]
