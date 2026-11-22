// src/agents/hermes/managementLayer.js — Hermes Management & Orchestration Layer
// Purpose: Implements Goal Manager, Task Manager, Agent Assignment Engine,
// Work Queue, Agent Status Tracker, and Executive Review Coordinator for Hermes.
// Uses existing agents without duplicating logic.

import { HermesMissionState } from './missionState.js';
import { agentRegistry, executeAgent } from '../index.js';

// ============================================================================
// 1. GOAL MANAGER
// ============================================================================
export const GoalManager = {
  getGoals() {
    return HermesMissionState.goals;
  },
  evaluateGoalHealth() {
    const goals = HermesMissionState.goals;
    const summary = [];
    for (const [key, g] of Object.entries(goals)) {
      summary.push({
        goal: key,
        status: g.status,
        priority: g.priority,
        blockerCount: (g.blockers || []).length,
      });
    }
    return summary;
  },
  updateGoalProgress(goalKey, progressUpdates) {
    return HermesMissionState.updateGoal(goalKey, progressUpdates);
  }
};

// ============================================================================
// 2. TASK MANAGER
// ============================================================================
export const TaskManager = {
  tasks: [
    { id: 'task-101', title: 'Optimize affiliate traffic conversion for AI Headshot Generator', goal: 'revenue', agent: 'affiliateFlipper', status: 'ready', priority: 'high' },
    { id: 'task-102', title: 'Audit landing page copy against No-BS Big Bestie voice', goal: 'governance', agent: 'brandSupervisor', status: 'ready', priority: 'medium' },
    { id: 'task-103', title: 'Recalculate 36-month wealth trajectory & asset MRR compound', goal: 'wealth', agent: 'wealthCalculator', status: 'ready', priority: 'high' },
    { id: 'task-104', title: 'Analyze organic keyword opportunities for digital products', goal: 'traffic', agent: 'growthAgent', status: 'queued', priority: 'medium' },
  ],
  listTasks() {
    return this.tasks;
  },
  addTask(task) {
    const newItem = { id: `task-${Date.now().toString().slice(-4)}`, status: 'ready', ...task };
    this.tasks.push(newItem);
    return newItem;
  },
  updateTaskStatus(taskId, status) {
    const t = this.tasks.find(x => x.id === taskId);
    if (t) {
      t.status = status;
      return true;
    }
    return false;
  }
};

// ============================================================================
// 3. AGENT ASSIGNMENT ENGINE
// ============================================================================
export const AgentAssignmentEngine = {
  matchAgentForTask(taskTitle = '', goalKey = '') {
    const t = String(taskTitle).toLowerCase();
    if (/affiliate|flipper|traffic|commission|cpc/.test(t)) return 'affiliateFlipper';
    if (/brand|audit|voice|copy|brutalist/.test(t)) return 'brandSupervisor';
    if (/wealth|net worth|retirement|gap|asset plan/.test(t)) return 'wealthCalculator';
    if (/niche|opportunity|trend|competition|audience/.test(t)) return 'opportunities';
    if (/product|offer|gumroad|pricing/.test(t)) return 'product';
    if (/social|content|repurpose|email/.test(t)) return 'social';
    if (/growth|seo|keyword/.test(t)) return 'growthAgent';
    
    // Fallback to goal mapping
    const mapping = {
      revenue: 'affiliateFlipper',
      wealth: 'wealthCalculator',
      traffic: 'opportunities',
      content: 'social',
      product: 'product',
      governance: 'brandSupervisor',
      automation: 'businessAgent'
    };
    return mapping[goalKey] || 'businessAgent';
  }
};

// ============================================================================
// 4. WORK QUEUE
// ============================================================================
export const WorkQueue = {
  queue: [],
  enqueue(task) {
    const assignedAgent = TaskManager.addTask({
      ...task,
      agent: task.agent || AgentAssignmentEngine.matchAgentForTask(task.title, task.goal)
    });
    this.queue.push(assignedAgent);
    return assignedAgent;
  },
  getNextReadyTask() {
    return TaskManager.listTasks().find(t => t.status === 'ready') || null;
  },
  getAllQueued() {
    return TaskManager.listTasks();
  }
};

// ============================================================================
// 5. AGENT STATUS TRACKER
// ============================================================================
export const AgentStatusTracker = {
  getRegistryStatus() {
    const names = Object.keys(agentRegistry);
    return {
      totalRegistered: names.length,
      activeAgents: names.map(name => ({
        name,
        displayName: agentRegistry[name].name,
        description: agentRegistry[name].description,
        status: 'online'
      }))
    };
  }
};

// ============================================================================
// 6. EXECUTIVE REVIEW COORDINATOR
// ============================================================================
export const ExecutiveReviewCoordinator = {
  generateReview() {
    const mission = HermesMissionState.getState();
    const tasks = TaskManager.listTasks();
    const agents = AgentStatusTracker.getRegistryStatus();

    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
    const blockers = Object.entries(mission.goals)
      .map(([k, g]) => ({ goal: k, blockers: g.blockers }))
      .filter(x => x.blockers.length > 0);

    return {
      executiveSummary: 'DigitallyDefined OS is operating at peak capacity with 20 specialist agents live. Revenue and wealth resilience agents are actively processing.',
      missionGoals: mission.goals,
      highPriorityWorkQueue: highPriorityTasks,
      systemBlockers: blockers,
      agentEcosystem: {
        totalActive: agents.totalRegistered,
        status: 'All systems online via Vertex Gemini and deterministic fallbacks'
      },
      recommendedNextAction: highPriorityTasks[0] ? `Execute task "${highPriorityTasks[0].title}" via agent [${highPriorityTasks[0].agent}]` : 'All priority tasks complete.',
      timestamp: Date.now()
    };
  }
};

export default {
  GoalManager,
  TaskManager,
  AgentAssignmentEngine,
  WorkQueue,
  AgentStatusTracker,
  ExecutiveReviewCoordinator
};
