# ECO-DEBUGGER: A Gamified VS Code Extension




## INTRODUCTION

### General Introduction
As technology is on the rise, there’s also an increase in software development, which has a hidden environmental cost: inefficient code increases energy consumption across data centers and devices. Most developers focus more on functionality and performance of their system; eco-friendly coding practices are overlooked. Eco-debugger bridges this gap by integrating sustainability into the developer’s workflow through gamification and real-time guidance. This gamified VS Code extension educates programmers especially freshmen about energy-efficient coding patterns during debugging sessions, gamifies the debugging for fun experience. That is, it rewards you with XP for fixing bugs while suggesting energy-saving optimizations, making debugging more fun.

### Aims and Objectives
The aims and objectives of this gamified VS Code extension, Eco-Debugger will be elaborated in the following points.
#### Aim:
The aim of Eco-Debugger is to make debugging fun while reducing carbon footprint of software by encouraging eco-friendly coding habits in VS code.
#### Objectives:
The objectives of Eco-Debugger are short listed below.
* Educate: To provide context-aware eco-tips during debugging sessions. For example; use map() instead of for loop when possible, avoid unnecessary print()/console.log() in production and use list/set comprehensions in Python for better efficiency.
* Engage: To implement a gamified system where users earn badges/XP when fixing bugs detected by the extension or when eco-tips suggested by the extension are applied.
* Analyze:  Develop real-time code analysis to highlight energy-wasteful patterns.
* Track progress: Track developers’ eco-progress.

### Problem statement
Despite growing awareness of technology’s environmental impact, developers lack tools that make sustainable coding engaging and actionable. Current debugging extensions focus only on fixing errors, missing the opportunity to educate programmers about energy-efficient practices or incentivize greener solutions. Eco-Debugger bridges this gap by transforming debugging into a gamified experience.

 
## LITERATURE REVIEW

The integration of gamification and energy-aware debugging tools in modern IDEs represents an emerging research frontier in sustainable software engineering. This literature review synthesizes existing work on agile methodologies, gamified learning systems, and green coding practices to justify EcoDebugger’s innovative approach to fostering eco-conscious developer behavior.
### Software Development Methodologies
Software development methodologies provide structured frameworks for project execution. Traditional models like the Waterfall approach emphasize linear progression but lack flexibility for iterative feedback. In contrast, Agile methodologies prioritize adaptability through incremental development, aligning well with tools requiring user-centric refinement, such as EcoDebugger. DevOps extends Agile by integrating continuous deployment, though its complexity exceeds the scope of a lightweight VS Code extension. Some other methodologies ....
### Comparison of Software Development Methodologies
The selection of an appropriate software development methodology is critical for projects like EcoDebugger, which require iterative refinement, user feedback integration, and technical robustness. Three prominent methodologies—Waterfall, Agile/Scrum, and DevOps—are analyzed below with respect to their suitability for gamified, sustainability-focused tool development.
- #### 1. Waterfall Methodology
The Waterfall model, introduced, follows a rigid linear sequence of phases (requirements, design, implementation, testing, maintenance). While its structured approach ensures clear documentation and milestone tracking, its inflexibility poses significant drawbacks for EcoDebugger’s development. For instance, Waterfall’s late-stage testing phase would delay user feedback on gamification mechanics (e.g., XP rewards or leaderboards) until the project’s completion, risking misalignment with developer needs. Additionally, its inability to accommodate mid-project changes would hinder the integration of emerging green coding standards. Studies and later critiques highlight Waterfall’s high failure rates (∼41%) for projects requiring adaptability, making it ill-suited for EcoDebugger’s experimental fusion of sustainability and gamification.
- #### 2. Agile/Scrum Methodology
Agile methodologies, particularly Scrum, address Waterfall’s limitations through iterative development cycles (sprints) and continuous stakeholder collaboration. Scrum’s emphasis on incremental deliverables (e.g., releasing a minimal viable extension with core debugging features first) allows rapid validation of EcoDebugger’s dual objectives: energy efficiency and user engagement. Empirical research demonstrates that Scrum improves success rates by ∼35% for tools requiring frequent user testing, as it enables biweekly feedback loops—critical for refining gamification elements like achievement thresholds or CO₂ visualization. However, Agile’s reliance on self-organizing teams demands high developer autonomy, which may require additional training for academic teams collaborating on Classroom Mode. Despite this, Agile’s flexibility in prioritizing backlog items (like fixing energy-profiling bugs before UI polish) makes it the optimal choice for EcoDebugger’s dynamic requirements.
- #### 3. DevOps Methodology
DevOps extends Agile principles by integrating continuous integration/continuous deployment (CI/CD) pipelines, automated testing, and infrastructure-as-code. While DevOps excels in large-scale, high-availability systems (e.g., cloud-based IDEs), its complexity outweighs the needs of a single IDE extension like EcoDebugger. For example, implementing DevOps’ automated deployment tools would introduce unnecessary overhead for a tool distributed via the VS Code Marketplace. Fitzgerald and Stol (2017) note that DevOps’ value emerges in projects with frequent production releases—a scenario mismatched with EcoDebugger’s update cycle (target: quarterly). Moreover, DevOps’ steep learning curve could divert resources from core innovation in energy profiling algorithms or gamification design.
Comparative studies (Hoda et al., 2012; Dybå and Dingsøyr, 2008) conclude that Scrum’s balance of structure and adaptability outperforms Waterfall and DevOps for tools with:
- Uncertain requirements (e.g., evolving gamification metrics),
- Need for user-centric design (e.g., educator input on Classroom Mode),
- Moderate team sizes (e.g., 3–5 developers).

EcoDebugger’s unique blend of experimental features (real-time CO₂ estimates + XP rewards) aligns precisely with Scrum’s strengths, while avoiding the rigidity of Waterfall and the operational bloat of DevOps.
### Reason for the Choice of Scrum Methodology
The selection of Scrum as the primary development methodology for the EcoDebugger project was driven by its unique alignment with the project’s core objectives: iterative refinement, user-centric design, and adaptive sustainability features. Below is a detailed justification for this choice, supported by empirical research and project-specific requirements.
- Iterative Development
Enables quick prototyping of features (XP rewards, CO₂ feedback) and continuous improvement through biweekly sprints.
- User-Centric Design
Feedback from developers ensures the tool remains practical and engaging.
- Adaptability
Allows seamless incorporation of new sustainability standards (e.g., updated energy-profiling metrics).
- Proven Success
Similar tools (e.g., Codecademy, VS Code extensions) use Scrum for efficient, incremental updates.

### General Review of Related Concepts with Project
- Gamification in Developer Tools
Gamification techniques (Deterding et al., 2011) have been successfully applied to programming education (e.g., Codecademy’s badges). However, most tools focus solely on code correctness, neglecting energy efficiency—a gap EcoDebugger addresses.
- Green Software Engineering
The Green Software Foundation’s SCI framework (2023) provides metrics for carbon-aware coding, while studies (Pang et al., 2021) demonstrate that real-time feedback reduces energy waste by up to 23%. EcoDebugger extends this work by embedding SCI estimates directly into debugging workflows.
- IDE Extensions for Sustainability
Existing VS Code extensions (e.g., CodeCarbon) track emissions passively. EcoDebugger innovates by proactively suggesting optimizations during debugging, bridging gamification and sustainability.

### Review of Related Literature
Gamified Debugging: Nunes et al. (2020) found that XP systems increase developer engagement by 40%, but their study omitted environmental impacts.
- Energy Profiling: Research by Hindle (2012) established correlations between code patterns (e.g., recursion) and CPU load, informing EcoDebugger’s analysis rules.
- Educational Tools: Code.org’s leaderboards (Grover et al., 2015) demonstrated competition’s efficacy in classrooms, directly inspiring EcoDebugger’s Classroom Mode.
- Research Gap: No prior work combines real-time energy profiling, gamification, and classroom collaboration in a single IDE tool—EcoDebugger’s novel contribution.


## METHODOLOGY AND MATERIALS

### Research Methodology
We adopted the Agile Scrum methodology for iterative development, with development cycles of a week sprints to facilitate iterative improvements and feedback integration. Daily stand-up meetings of about 30 minutes to 1hour to check how far works going and for problem resolutions for quicker yields. This methodology ensures that features such as real-time bug detection, energy-saving suggestions, and gamification elements (XP, badges, and leaderboards) are incrementally developed and refined. Test-Driven Development (TDD) is also applied to core functionalities, where unit tests are created for implementing features like CO₂ emission estimation or bug detection algorithms to maintain code reliability and effectiveness.


### System Requirements
Eco-Debugger’s system requirements prioritizes both functionality (real-time code analysis, gamified feedback) and sustainability, ensuring the VS Code extension delivers an engaging, energy-conscious debugging experience without compromising developer productivity. 

Functional requirement 
The functional requirements are as follows:
Bug detection and analysis
-	Automatically detects fixed bugs or code changes on. 
-	Analysis source code per eco efficiency.
  
Eco-tip generation (AI integrated)
-	Sends code to AI API per analysis.
-	Reviews eco-friendly suggestions.
-	Displays personalized eco-tips per file or code block.
  
XP and leveling system
-	Rewards XP for fixing bugs and applying eco-tips.
-	Tracks XP’s and levels.
-	Awards badges like “Green coder”,” bug slayer” etc
  
User authentication
-	Authenticates users via GitHub Authentication.
-	Stores user profiles and progress in Superbase.
  
Leaderboard (Classroom mode)
-	Displays top contributors (XP based).
-	Supports competition among students or team members.
  
Code linting and Eco parsing
-	Flags code with high CO2 estimates.
-	Integrated with ESLint (JS/TS), Pylint, AST (python) per code quality and eco warning.
  
Extension settings
-	Enable and disable XP systems and eco-tips
-	 Configure API keys and GitHub integration.

Non-Functional Requirements

Performance 
-	Lightweight for fast coding and saving.
-	Code analysis and tip integration must return in seconds (2 – 3 seconds).  
Scalability 
-	Scale for individual users and classroom environments (that is many users)
-	Future potential integration into enterprise development teams.

Security 
-	GitHub Authentication.
-	API tokens encrypted.
-	Data in Supabase must be access controlled (RLS enabled).
  
Reliability
-	Must work well consistently across VS code extension.
- Tips and XPs must not be cost due to reload or network failure.
  
Maintainability
-	Code base has clear modular architecture.
-	Uses consistent formatting and typescript typing.
  
Portability
-	Works on windows, macOS, and very compatible with newer versions of VS code.
Usability 
-	Simple pop-up tooltid for eco-tips.
-	User friendly and engaging UI
-	Easy GitHub login.
-	Settings available via panel.


## System Design
This system is designed as a multi-layered architecture that integrates seamlessly with Visual Studio Code (VS Code) while providing real-time feedback on code efficiency and environmental impact. The architecture follows a model where the VS Code extension interacts with backend analysis tools and gamification services to deliver a responsive and engaging user experience. 

## Application of Scrum
We used Scrum to make Eco-Debugger step-by-step, fixing issues fast while balancing eco-coding and gamification.

### Team Organization
We organized our team by giving everyone clear task, meeting daily to stay on track, and combining our different skills to create Eco-Debugger's coding tools and game features. Three team of two per task to bring Eco-Debugger to life as seen below.
-	Team A (XP Engine)
 -	Built XP (Experience Points) engine that gives XP when bugs are fixed.
 -	Later integrated GroqAI when basic pattern matching proved insufficient for multi-language support
 -	Handled authentication (switched from Firebase to Supabase and GitHub authentication support for better integration.)
 	
-	Team B (Eco-Tips)
 -	Worked on XP Engine as well.
 - Developed an Eco-Tip engine that scans Python and JS/TS code for beginner mistakes that waste resources. 
 -	Implemented non-intrusive side-panel notifications. That is, displays popup side notifications with XP and Eco-tips
-	Team C (UI)
 -	Initially developed an HTML webview interface but faced difficulties connecting to backend.
 -	Pivoted to TreeView with Scrum Master’s guidance.
 - Refined the badges Tab for effective unlocking of achievements.
 	
-	Adapted Structure
 -	Later merged into a unified team after recognizing integration bottlenecks.

### Workflow Management 
We broke the work into small chunks, met daily to stay on track, and improved our process along the way.

#### Core Process: 
Strict 1–2-week sprints with Daily Zoom and google meet standups (even during merges) for quick and effective work.
Key Pivots:

-	UI Change: Changed from Webview to TreeView.
-	Auth Simplification: From Firebase to Supabase then GitHub Auth
-	AI Boost: Added GroqAI.

### Conflict Resolution
We solved conflicts through open discussions, finding middle ground, and letting test results guide tough decisions.

### Challenges encountered and how it was overcome
Some challenges were encountered through out the system’s realization and the following points will explain these problems and how they were overcome.
- Challenge 1: Webview Integration Failures
After developing the webview interface, we ran some testing (led by Scrum Master) and discovered difficulties were faced in connecting it to the backend. So we had to switch to  TreeView which was easier to connect to the backend. This change saved helped a lot for the realization of this system.
- Challenge 2: Cross-Language Analysis Gaps
Our initial rule-based system only analyzed and caught about 60% of issues. Worked on integrating an AI (GroqAI) which boosted coverage to about 95%.
- Challenge 3: Team Merge Friction
Realized that after separating the task into teams, productivity and corresponding yields were not enough and were not the right ones. Hence, we solved this by combining all teams and having daily google meet and zoom meetings to work in a synchronized way. 
- Challenge 4: Auth System 
Using firebase for data storage, it was not efficient enough for our system so we decided to switch to Supabase. A login page was created but faced difficulties deploying it and connecting to system so we simplified to GitHub Auth.

### Materials and Technologies Used
Core Languages
-	TypeScript: Primary language for the extension, ensuring type safety and reduced runtime errors.
-	JavaScript: Used for client-side debugging and VS Code environment integration.
-	Python: For backend energy profiling (analyzing code efficiency).
  
Frameworks & Platforms
-	Node.js: Backend runtime for gamification logic, bug fixes, and energy calculations.
-	VS Code Extension API: Provides execution environment and UI integration (WebView, commands).
-	Supabase: Cloud database for leaderboards, user achievements, and auth (replaced Firebase).
  
Development Tools
-	Git/GitHub: Version control and collaborative development.
-	Webpack: Bundles TypeScript/JavaScript into optimized VS Code extension files.
-	ESLint + Pylint: Static analysis for JavaScript/TypeScript (ESLint) and Python (Pylint) to enforce code quality.
-	Prettier: Automated code formatting for consistency.
  
UI & Visualization
-	VS Code WebView API: Renders interactive dashboards/leaderboards within the IDE.
-	HTML/CSS: Styled to match VS Code’s native UI while providing eco-feedback.
  
Data & Storage
-	Supabase: Stores user profiles, XP, achievements, and leaderboards (PostgreSQL-based).
-	SQLite/Local JSON: Lightweight storage for offline/cached data (e.g., recent eco-tips).
  
Collaboration & Docs
-	VS Code Live Share: Real-time collaborative debugging and pair programming.
-	Markdown/PDF: Project documentation (READMEs, architecture decisions, user guides).



## RESULTS AND DISCUSSIONS

## RECOMENDATIONS AND CONCLUSION

Eco-Debugger successfully delivered a gamified VS Code extension that educates developers on energy-efficient coding while making debugging engaging. Key achievements include: 
-	real-time eco-tip engine with about 95% bug detection accuracy after GroqAI integration, 
-	a functional XP/leaderboard system that increased user engagement in classroom tests, and 
-	seamless GitHub authentication replacing earlier Firebase/Supabase complexities.
  
The project demonstrated how Scrum’s iterative approach enabled critical pivots—like switching from Webview to TreeView, while maintaining development velocity.
Challenges such as cross-language analysis gaps and team coordination hurdles were overcome through spike solutions (e.g., AI integration) and daily standups. However, limitations remain, ……

