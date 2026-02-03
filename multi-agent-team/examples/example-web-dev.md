# Example: Web Development Task

## User Request

> "Build a simple task management web app. Users can create tasks, mark them complete, and filter by status. Use React for frontend and Node.js for backend. Store data in memory (no database needed)."

---

## PM Analysis

**Task Type:** Full-stack Web Development  
**Complexity:** Medium  
**Estimated Duration:** 15-20 minutes

---

## Team Configuration

| Role | Responsibilities |
|------|-----------------|
| **Frontend Architect** | React components, state management, UI/UX |
| **Backend Developer** | Node.js API, data models, business logic |
| **Integration Engineer** | API integration, testing, deployment setup |

---

## Mode Selection

```
📋 Proposed Team:
👤 Frontend Architect - React SPA, component design
👤 Backend Developer - REST API, in-memory storage  
👤 Integration Engineer - Wire frontend/backend, testing

Choose mode:
1️⃣ FULL_AUTO - Team delivers runnable app
2️⃣ SUPERVISED - Confirm at milestones

User: 1
```

---

## Execution (FULL_AUTO)

### Kickoff [T+0]
PM spawns 3 agents with specific tasks.

### Progress [T+5]
- Frontend: Component structure done, working on state
- Backend: API endpoints defined, implementing handlers
- Integration: Waiting for API spec from backend

### Collaboration
Backend → Integration: "API spec ready: GET /tasks, POST /tasks, PATCH /tasks/:id"
Integration → Frontend: "Need to know your state shape for proper integration"
Frontend → Integration: "Using { tasks: [], filter: 'all' | 'active' | 'completed' }"

### Deliverables [T+15]
- Frontend: React components (App, TaskList, TaskItem, TaskForm)
- Backend: Express server with full REST API
- Integration: Axios client, error handling, CORS config

### Aggregation
PM combines into project structure:
```
task-app/
├── client/           # React app
│   ├── src/
│   ├── public/
│   └── package.json
├── server/           # Node.js API
│   ├── index.js
│   ├── routes/
│   └── package.json
├── README.md         # Setup instructions
└── package.json      # Root with concurrent start
```

### Final Delivery
```
✅ Task Management App Complete!

Features:
- Create new tasks
- Mark tasks complete/incomplete
- Filter: All / Active / Completed
- In-memory storage (resets on restart)

To run:
1. npm install
2. npm run dev (starts both client and server)
3. Open http://localhost:3000

Download: [task-app.zip]
```

---

## Project Log Excerpt

```markdown
## Execution Log

### [T+0] Kickoff
Team assembled, tasks assigned.

### [T+5] Progress Check
All agents on track. Backend provided API spec to Integration.

### [T+10] Minor Dispute
Frontend vs Integration on error handling approach.
- Round 1: Both presented approaches
- PM Decision: Use centralized error handler in Integration layer

### [T+15] Deliverables Submitted
All components complete. Minor rework on CORS config.

### [T+18] Final Aggregation Complete
Project packaged and delivered.
```

---

## Key Points

1. **Dynamic Roles**: "Integration Engineer" specifically for this full-stack task
2. **Collaboration**: Agents shared API specs and state shapes
3. **Dispute**: Resolved quickly with PM decision
4. **Aggregation**: PM created cohesive project structure
5. **Time**: Completed in ~18 minutes
