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

## METHODOLOGY AND MATERIALS
### Research Methodology
We adopted the Agile Scrum methodology for iterative development, with development cycles of a week sprints to facilitate iterative improvements and feedback integration. Daily stand-up meetings of about 30 minutes to 1hour to check how far works going and for problem resolutions for quicker yields. This methodology ensures that features such as real-time bug detection, energy-saving suggestions, and gamification elements (XP, badges, and leaderboards) are incrementally developed and refined. Test-Driven Development (TDD) is also applied to core functionalities, where unit tests are created for implementing features like CO₂ emission estimation or bug detection algorithms to maintain code reliability and effectiveness.


### System Requirements
Eco-Debugger’s system requirements prioritizes both functionality (real-time code analysis, gamified feedback) and sustainability, ensuring the VS Code extension delivers an engaging, energy-conscious debugging experience without compromising developer productivity. Functional requirements include bug detection, XP rewards, and CO₂ emission estimates, while non-functional requirements enforce responsiveness, and minimal resource usage.


### Materials and Technologies Used
The EcoDebugger extension is built using TypeScript as its primary language, leveraging  JavaScript programming methodologies and modern static typing features to enhance code reliability and prevent runtime bugs. The client-side debugging and code analysis functionalities are implemented in JavaScript, taking full advantage of VS Code's execution environment for real-time code analysis. The backend logic runs on Node.js, providing a robust runtime environment for energy profiling calculations,fixing bugs and gamification services.

For version control and collaborative development, we utilize Git/GitHub, enabling seamless team coordination and continuous integration. The user interface is developed using VS Code's Webview API, which allows us to implement modern, interactive dashboards/leaderboards within the extension. These dashboards/leaderboards are built with HTML and CSS, styled to match VS Code's native theming system while providing enhanced visual feedback about code efficiency.

The codebase employs Webpack as its module bundler, efficiently packaging our complex TypeScript architecture into optimized deployment bundles. This ensures smooth publishing to the VS Code Marketplace while maintaining excellent performance characteristics. For code quality assurance, we integrate ESLint with Prettier to enforce consistent formatting, linting and  catch potential bugs during development.
We also used Live Share extension to facilitates real-time collaborative meetings and debugging sessions among team members.

Data persistence is handled through a hybrid storage approach: Firebase serves as our cloud database for leaderboard data and user achievements, while SQLite/local JSON databases to manage data. 

The project documentation is written in Markdown for .md files and pdf too. 

## System Design

This system is designed as a multi-layered architecture that integrates seamlessly with Visual Studio Code (VS Code) while providing real-time feedback on code efficiency and environmental impact. The architecture follows a model where the VS Code extension interacts with backend analysis tools and gamification services to deliver a responsive and engaging user experience. 
