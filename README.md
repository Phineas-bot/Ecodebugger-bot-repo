# ECO-DEBUGGER: A Gamified VS Code Extension


# INTRODUCTION

# General Introduction
As technology is on the rise, there’s also an increase in software development, which has a hidden environmental cost: inefficient code increases energy consumption across data centers and devices. Most developers focus more on functionality and performance of their system; eco-friendly coding practices are overlooked. Eco-debugger bridges this gap by integrating sustainability into the developer’s workflow through gamification and real-time guidance. This gamified VS Code extension educates programmers especially freshmen about energy-efficient coding patterns during debugging sessions, gamifies the debugging for fun experience. That is, it rewards you with XP for fixing bugs while suggesting energy-saving optimizations, making debugging more fun.

# Aims and Objectives
The aims and objectives of this gamified VS Code extension, Eco-Debugger will be elaborated in the following points.
# Aim:
The aim of Eco-Debugger is to make debugging fun while reducing carbon footprint of software by encouraging eco-friendly coding habits in VS code.
# Objectives:
The objectives of Eco-Debugger are short listed below.
 	Educate: To provide context-aware eco-tips during debugging sessions. For example; use map() instead of for loop when possible, avoid unnecessary print()/console.log() in production and use list/set comprehensions in Python for better efficiency.
 	Engage: To implement a gamified system where users earn badges/XP when fixing bugs detected by the extension or when eco-tips suggested by the extension are applied.
 	Analyze:  Develop real-time code analysis to highlight energy-wasteful patterns.
 	Track progress: Track developers’ eco-progress.

# Problem statement
Despite growing awareness of technology’s environmental impact, developers lack tools that make sustainable coding engaging and actionable. Current debugging extensions focus only on fixing errors, missing the opportunity to educate programmers about energy-efficient practices or incentivize greener solutions. Eco-Debugger bridges this gap by transforming debugging into a gamified experience.

 
# LITERATURE REVIEW

 
# RESEARCH METHODOLOGY

We adopted the Agile Scrum methodology for iterative development, with development cycles of a week sprints to facilitate iterative improvements and feedback integration. Daily stand-up meetings of about 30 minutes to 1hour to check how far works going and for problem resolutions for quicker yields. This methodology ensures that features such as real-time bug detection, energy-saving suggestions, and gamification elements (XP, badges, and leaderboards) are incrementally developed and refined. Test-Driven Development (TDD) is also applied to core functionalities, where unit tests are created for implementing features like CO₂ emission estimation or bug detection algorithms to maintain code reliability and effectiveness.

The Eco-debugger extension is built on the Visual Studio Code’s API leveraging TypeScript, JavaScript and python for seamless integration with the IDE……………….

# Data collection and evaluation.


# SYSTEM REQUIREMENTS

Eco-Debugger’s system requirements prioritizes both functionality (real-time code analysis, gamified feedback) and sustainability, ensuring the VS Code extension delivers an engaging, energy-conscious debugging experience without compromising developer productivity. Functional requirements include bug detection, XP rewards, and CO₂ emission estimates, while non-functional requirements enforce responsiveness, and minimal resource usage.


# SYSTEM DESIGN

This system is designed as a multi-layered architecture that integrates seamlessly with Visual Studio Code (VS Code) while providing real-time feedback on code efficiency and environmental impact. The architecture follows a model where the VS Code extension interacts with backend analysis tools and gamification services to deliver a responsive and engaging user experience. 
