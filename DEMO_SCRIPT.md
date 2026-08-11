# TRANSOPT AI — College Jury Demonstration Script

This document provides a step-by-step guide on exactly what to show your college jury to impress them with the dynamic AI capabilities of the TRANSOPT Platform.

## Scenario 1: The "Ghost Bus" AI Optimization
**Objective:** Show that the AI is actively monitoring for inefficiencies and empty buses, rather than just running on a static schedule.

**Steps to Demo:**
1. Navigate to the **Simulation (Digital Twin)** page.
2. Click **Play** on the simulation controls (top right) and set the speed to `2x`.
3. Let it run until an AI Alert pops up on the top right (or on the main Dashboard).
4. **What to say:** *"Here, the AI engine is tracking live gaps between buses on the same route. It detected that two buses are bunching (running less than 10 minutes apart) but the ticket sales/occupancy is below 30%."*
5. Open the **Dashboard** and point to the **AI Recommendations** section.
6. **What to say:** *"Instead of wasting fuel, the AI generates a proactive alert: 'Over-servicing detected'. It recommends that the admin re-schedule or re-assign this empty bus to a highly crowded route, balancing the network autonomously."*

## Scenario 2: Crisis Mode & Objective Function Shift
**Objective:** Show that the ML Optimizer isn't just trying to save money; it can dynamically shift its priorities during a disaster.

**Steps to Demo:**
1. Navigate to the **Crisis Mode** page.
2. Click on the **Flood** or **Landslide** preset to inject a catastrophic event into the live simulation.
3. Show the **Optimizer Priorities (Weights)** sliders.
4. **What to say:** *"During normal operations, our optimization algorithm heavily weights 'Operating Cost' and 'Waiting Time'. However, when a flood is triggered, the AI automatically shifts its objective function. Notice how 'Passenger Safety' and 'Emergency Connectivity' instantly jump to the highest priority, while 'Cost' drops."*
5. Go to the **Fleet Optimizer** tab and click **Run AI Optimizer**.
6. **What to say:** *"The engine will now evaluate millions of route permutations, but this time, it prioritizes evacuating people and avoiding flooded routes over saving money."*

## Scenario 3: Live LLM Chat with NVIDIA Nemotron
**Objective:** Prove that the AI Assistant isn't pre-programmed, but is a real LLM (NVIDIA Nemotron-3-Ultra) analyzing live simulation data.

**Steps to Demo:**
1. Navigate to the **AI Assistant** page.
2. Type a highly specific query related to the current simulation state. For example:
   - *"Which specific buses are overcrowded right now, and why?"*
   - *"What is our current operating cost, and what do you recommend to reduce it?"*
   - *"We just had a flood event. Explain how this is impacting the network score."*
3. **What to say:** *"This isn't a static chatbot. We integrated the NVIDIA Nemotron LLM API. The backend constantly feeds the LLM a JSON payload of the live digital twin state (active buses, ticket sales, weather, active crises). The LLM processes this data in real-time to provide analytical answers."*

## Scenario 4: The Passenger Experience App
**Objective:** Connect the admin intelligence down to the commuter level.

**Steps to Demo:**
1. Navigate to the **Passenger View** page.
2. Show the mobile app mockup.
3. **What to say:** *"All this backend intelligence directly improves the commuter experience. When a user plans a journey, the AI doesn't just show the fastest route. It predicts crowding. It might suggest a route that takes 5 minutes longer but guarantees a seat, because it knows exactly how full the arriving bus will be."*

---
**Tip for the Jury:** If you get nervous, just click the **"Jury Demo Mode"** button in the bottom right corner of the app. It will automatically navigate the screens and provide you with on-screen prompts of what to say!
