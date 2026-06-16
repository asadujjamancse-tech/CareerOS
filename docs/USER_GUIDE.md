# CareerOS User Guide

## What is CareerOS?

CareerOS is a personal desktop application designed for IT professionals, developers, and technology students who want to take charge of their own career development. It gives you one place to track everything that matters for your career: the skills you are learning, the certifications you are pursuing, the projects you have built, the videos you have watched, the notes you have taken, and the goals you are working toward.

Unlike online tools, CareerOS runs entirely on your own computer. Your data never leaves your machine. There is no account to create, no subscription to pay, and no internet connection required after installation.

---

## Who is CareerOS For?

- IT support professionals building toward senior roles or specializations
- Systems administrators and cloud engineers tracking certifications and skills
- Developers who want to map out their learning path and stay organized
- Students studying for IT certifications (CompTIA, Microsoft, AWS, etc.)
- Career changers who need a structured plan to enter the technology field

---

## Privacy and Local-First Design

Every piece of data you enter into CareerOS is stored in a single SQLite database file on your computer. There are no servers, no cloud accounts, and no telemetry. You can back up your data by copying the database file. You can move it to a new computer. You have complete control.

---

## Getting Started

When you first launch CareerOS, you land on the **Learning Dashboard**. This is your home base — it shows summaries of what you have recently added and what needs attention.

A **Sidebar** on the left lists all modules. Click any item to navigate to that section.

**Suggested first steps:**
1. Go to **Skills** and add 5–10 skills you already have or are currently learning
2. Go to **Certifications** and add any certifications you hold or are studying for
3. Go to **Projects** and add 2–3 projects you have completed or are working on
4. Go to **Career Intelligence** and create your first career roadmap
5. Come back to the **Learning Dashboard** — it will now show your progress

---

## Module Reference

### Learning Dashboard

**What it does:** Shows a summary of your career health at a glance — recent activity, skill counts, certification status, study time this week, and SRS cards due for review.

**How to use it:**
1. Open the app — you land here automatically
2. Review the summary cards for each area
3. Use the weekly report and monthly report views for longer-term trends
4. Click any summary item to navigate to the relevant module

**Tip:** Check the Learning Dashboard at the start of each week to plan what to focus on.

---

### Skills

**What it does:** Your master list of technical skills with proficiency levels, status, and years of experience.

**How to use it:**
1. Click **New Skill** and enter the skill name (e.g., "Azure Active Directory")
2. Select a category (networking, cloud, scripting, etc.)
3. Set your current proficiency level: Beginner, Intermediate, Advanced, or Expert
4. Set a status: Learning, Proficient, Mastered, or On Hold
5. Enter years of experience (0 is fine for skills just started)
6. Save

**Tip:** Be honest about proficiency levels — they feed the AI Coach's readiness score.

---

### Skill Hub

**What it does:** A deep-dive view for a single skill. From the Skills list, click any skill name to open its Skill Hub page, which brings together everything related to that skill in one place.

**How to use it:**
1. Click any skill name from the Skills list
2. The Skill Hub opens showing linked videos, labs, interview questions, and certifications for that skill
3. Add learning modules, quiz questions, and experience log entries
4. Track skill proficiency through quiz attempts

---

### Certifications

**What it does:** Track certifications you hold, are studying for, or plan to pursue.

**How to use it:**
1. Click **New Certification** and enter the certification name (e.g., "AZ-900")
2. Enter the issuer (e.g., "Microsoft")
3. Set a status: Planned, In Progress, Earned, or Expired
4. Enter the exam date or earned date as applicable
5. Save

---

### Projects

**What it does:** A portfolio of technical projects — personal builds, work projects, or learning exercises.

**How to use it:**
1. Click **New Project** and enter a title and description
2. Set the project type (personal, work, open-source, etc.) and status (Planning, Active, Completed, On Hold)
3. Add technologies used by linking skills to the project
4. Upload project assets (screenshots, files) using the Assets section
5. Save

---

### Videos

**What it does:** Track training videos and courses with watch status and progress.

**How to use it:**
1. Click **New Video** and enter the title and URL (YouTube or direct link)
2. Set the duration and link it to skills it covers
3. As you watch, update the status: Unwatched, Watching, or Completed
4. Progress is tracked in seconds for resume capability

---

### Playlists

**What it does:** Organize videos into ordered learning sequences — useful for YouTube tutorial series or structured courses.

**How to use it:**
1. Click **New Playlist** and give it a name; optionally link it to a skill
2. Add videos one by one to the playlist with their titles and URLs
3. Drag items to reorder the learning sequence
4. Mark each item as Watching or Completed as you progress
5. The playlist shows your overall completion percentage

---

### Notes

**What it does:** Rich text notes for capturing knowledge, study summaries, or anything you want to remember.

**How to use it:**
1. Click **New Note** and enter a title
2. Write your content in the editor
3. Link the note to a skill for better organization
4. Use notes to summarize what you learned after watching a video or completing a lab

---

### Journal

**What it does:** A private log of your career journey — reflections, daily entries, goals, and thoughts.

**How to use it:**
1. Click **New Entry** to start a journal entry
2. Write freely about your day, what you learned, or your career thoughts
3. Entries are sorted by date with the most recent first
4. Use the journal to track your mindset and progress over time

---

### Documents

**What it does:** Store and view PDF documents, Word files, and other reference materials within CareerOS.

**How to use it:**
1. Click **Import Document** to add a file from your computer
2. Documents are copied into CareerOS storage
3. Open a document to view it in the built-in PDF reader or DOCX viewer
4. Highlight sections and add annotations to PDFs
5. Use the reading progress tracker to resume where you left off

---

### Knowledge Vault

**What it does:** A library for PDF documents with advanced reading features — collections, favorites, annotations, and reading progress tracking.

**How to use it:**
1. Import PDFs into the vault
2. Organize them into collections (e.g., "Azure Study Materials")
3. Open a PDF and highlight text, add notes, and mark your reading position
4. Track reading progress percentage per document
5. Favorite frequently referenced documents for quick access

---

### Markdown Workspace

**What it does:** A full Markdown editor for writing longer documents, study guides, or technical articles.

**How to use it:**
1. Click **New Document** to open a blank editor
2. Write using Markdown syntax — headers, bullet lists, code blocks, tables
3. The right pane shows a live preview
4. Include `mermaid` code blocks to render diagrams
5. Click **Save Snapshot** to create a named version checkpoint
6. Open **Version History** to restore a previous version

**Tip:** Use this for writing study guides you plan to refer back to frequently.

---

### Code Workspace

**What it does:** An in-app code editor (VS Code style) for storing scripts, code snippets, and configuration examples.

**How to use it:**
1. Create folders to organize your code (e.g., "PowerShell Scripts", "Azure CLI")
2. Click **New File**, enter a name, and select the programming language
3. Write or paste your code — syntax highlighting applies automatically
4. Press Save to persist the code to your local database
5. Open multiple files as tabs

---

### Whiteboard

**What it does:** A free-form drawing canvas for network diagrams, mind maps, system architectures, or any visual content.

**How to use it:**
1. Click **New Whiteboard** and give it a name
2. Use the drawing tools to sketch, add shapes, and write text
3. Link the whiteboard to a project or skill from the Link Panel
4. Save your canvas when done

---

### Home Labs

**What it does:** Track hands-on lab environments and exercises — virtual machines, cloud labs, Hyper-V setups, etc.

**How to use it:**
1. Click **New Lab** and describe the lab environment
2. Break the lab into tasks (individual activities to complete)
3. Log problems you encountered and how you solved them
4. Record time spent on the lab
5. Link skills to the lab to track what you practiced

---

### Interview Questions

**What it does:** A personal bank of technical interview questions with model answers, difficulty ratings, and spaced repetition review.

**How to use it:**
1. Click **New Question** and write the question
2. Write the ideal answer and add hints
3. Set the difficulty: Easy, Medium, Hard, or Expert
4. Click **Practice** to begin a review session — answer questions and rate your confidence
5. The system tracks how well you know each question

---

### Learning System (SRS)

**What it does:** A spaced repetition system (like Anki) built into CareerOS. It schedules flashcard reviews based on how well you know each card, showing cards more frequently when you struggle and less often when you know them well.

**How to use it:**
1. Create flashcards manually, or bulk-import them from your Interview Questions
2. Each day, click **Review Due Cards** to see cards scheduled for today
3. After seeing a card, rate your recall: Again (failed), Hard, Good, or Easy
4. The system schedules your next review accordingly
5. Check your statistics to see your retention rates

---

### Learning Coach

**What it does:** Manages structured learning paths, skill dependency maps, and retention tracking. It helps you plan which skills to learn in what order.

**How to use it:**
1. Create a **Learning Path** and add skills to it in learning order
2. Set dependencies (e.g., "Learn TCP/IP before Azure Networking")
3. Select the best learning method for each skill (video, lab, reading, practice)
4. Use the **Retention** tracker to monitor how well you are retaining each skill
5. Generate a **Study Plan** for automatic scheduling of your learning activities

---

### Career Intelligence

**What it does:** Your career planning center. Create roadmaps for target roles, track progress, and get recommendations on where to focus.

**How to use it:**
1. Click **New Roadmap** and name it after your target role (e.g., "Azure Solutions Architect")
2. Set seniority level and estimated time to achieve
3. Add required skills with their target proficiency levels
4. Add certifications and projects required for the role
5. Set milestones with target dates
6. Check the **AI Coach** tab for your readiness score and weekly study plan
7. Check **Analytics** for trend data on your study habits

---

### Challenge Center

**What it does:** Daily and weekly learning challenges to gamify your study habits. Challenges are generated from your actual data — due SRS cards, active labs, and interview questions.

**How to use it:**
1. Click **Generate Daily Challenges** each morning
2. Three challenges appear based on what needs attention today
3. Click **Start** on a challenge, then complete the activity in the relevant module
4. Return and click **Update Progress** or **Mark Complete**
5. Earn XP for each completion; build a streak of consecutive days

---

### Scenario Center

**What it does:** Structured IT scenarios for practice — realistic problem situations with step-by-step guidance. Great for interview preparation and hands-on skill building.

**How to use it:**
1. Browse scenarios by category (Active Directory, Azure, Networking, etc.) and difficulty
2. Click a scenario to read the context story and success criteria
3. Click **Start Attempt** and work through the steps
4. Record your notes and time spent
5. Rate your performance and capture lessons learned

**Feynman Technique:** Use the Feynman Entry feature to explain a topic in simple terms. If you cannot explain it clearly, you have identified a knowledge gap.

---

### Search

**What it does:** A global search across all your CareerOS content — skills, projects, certifications, notes, documents, labs, and interview questions.

**How to use it:**
1. Click **Search** in the sidebar or use the keyboard shortcut
2. Type any keyword or phrase
3. Results appear ranked by relevance with excerpts showing where the match was found
4. Click any result to navigate directly to that item
5. Recent searches appear below the search box for quick re-execution

---

### Occupations

**What it does:** Define target job roles and map the skills each role requires, with importance levels and acquisition tracking.

**How to use it:**
1. Click **New Occupation** and enter the job title (e.g., "Cloud Engineer")
2. Set the industry, seniority level, and your current status toward this role
3. Add required skills and mark each as Critical, Important, or Nice-to-Have
4. As you acquire each skill, mark it as acquired
5. Use this alongside Career Intelligence roadmaps for comprehensive career planning

---

### Knowledge Graph

**What it does:** A visual map of how your knowledge areas connect. You draw nodes for concepts and link them with labeled connections.

**How to use it:**
1. Navigate to **Knowledge Graph**
2. Click **Add Node** and select a type (skill, concept, certification, etc.)
3. Search for an existing CareerOS entity or create a standalone concept
4. Draw links between nodes to show relationships
5. Customize node colors to group related concepts visually

---

### Tags

**What it does:** A central place to manage labels that can be applied to entities across CareerOS (currently Occupations).

**How to use it:**
1. Navigate to **Tags**
2. Click **New Tag** and enter a name; choose a color
3. Apply tags from within an entity's edit form
4. Tags appear in the list with usage counts

---

### Workspace

**What it does:** A multi-panel desktop environment where you can open several CareerOS views simultaneously.

**How to use it:**
1. Navigate to **Workspace**
2. Add panels for the modules you want to view together
3. Drag panel tabs to rearrange them into a split-screen layout
4. Your layout is saved automatically and restored next time you open Workspace
5. Click **Open Floating Window** for an always-on-top reference panel

---

## Suggested Daily Workflow

1. **Morning (5 minutes):** Open Learning Dashboard → note what is due today → generate Daily Challenges
2. **Study session:** Open the relevant module (video, lab, or notes) and complete your planned activity
3. **After studying:** Log a Study Session in Career Intelligence → update progress on active challenges
4. **SRS review:** Go to Learning System → complete your due card reviews (never skip these — they are short)
5. **Evening (optional):** Write a Journal entry about what you learned

---

## Suggested Weekly Workflow

1. **Sunday:** Review Learning Dashboard weekly report → plan which skills to focus on → check Career Intelligence for roadmap progress → generate Weekly Challenge
2. **Monday–Friday:** Follow daily workflow; complete at least one challenge per day for streak
3. **Saturday:** Review Interview Questions → add new questions from what you studied → check SRS stats

---

## Navigation Tips

- Use the **Sidebar** on the left to navigate between all modules
- The **Back** button in your browser-style navigation works within the app
- Each module page is wrapped in an error boundary — if one crashes, others continue working
- Use **Global Search** (`/search`) to jump quickly to any piece of content by keyword
- The app starts on **Learning Dashboard** by default on every launch
