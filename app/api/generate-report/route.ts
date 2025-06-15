import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Fetch all project data
    const [
      projectResult,
      tasksResult,
      expensesResult,
      updatesResult,
      filesResult
    ] = await Promise.all([
      // Project basic info
      supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single(),
      
      // Tasks
      supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
      
      // Expenses
      supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
      
      // Project updates
      supabase
        .from('project_updates')
        .select(`
          *,
          users(email, full_name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
      
      // File metadata
      supabase
        .from('file_data')
        .select('*')
        .eq('project_id', projectId)
    ]);

    // Check for errors
    if (projectResult.error) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectResult.data;
    const tasks = tasksResult.data || [];
    const expenses = expensesResult.data || [];
    const updates = updatesResult.data || [];
    const files = filesResult.data || [];

    // Calculate project statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task: any) => task.is_complete).length;
    const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + (expense.cost || 0), 0);
    const budgetUsage = (totalExpenses / (project.budget || 1)) * 100;

    // Prepare data for AI
    const projectData = {
      project: {
        name: project.name,
        description: project.description,
        status: project.status,
        budget: project.budget,
        created_at: project.created_at,
        updated_at: project.updated_at
      },
      statistics: {
        totalTasks,
        completedTasks,
        taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0,
        totalExpenses,
        budgetUsage: budgetUsage.toFixed(1),
        remainingBudget: (project.budget || 0) - totalExpenses
      },
      tasks: tasks.map((task: any) => ({
        title: task.title,
        description: task.description,
        completed: task.is_complete,
        created_at: task.created_at,
        due_at: task.due_at
      })),
      expenses: expenses.map((expense: any) => ({
        description: expense.description,
        amount: expense.cost,
        date: expense.created_at
      })),
      updates: updates.map((update: any) => ({
        content: update.content,
        author: update.users?.full_name || update.users?.email || 'Unknown User',
        date: update.created_at
      })),
      files: files.map((file: any) => ({
        name: file.file_name,
        tags: file.tags || []
      }))
    };

    // Generate report using AI
    const { text } = await generateText({
      model: xai('grok-3-mini'),
      prompt: `Create a structured project report that presents the data in a clear, organized format. The report should be a visual representation of the current project data with minimal analysis.

Structure the report exactly as follows:

# PROJECT REPORT: ${projectData.project.name}

## EXECUTIVE SUMMARY
- Project Status: ${projectData.project.status}
- Total Budget: $${projectData.project.budget?.toLocaleString() || 0}
- Budget Used: $${projectData.statistics.totalExpenses.toLocaleString()} (${projectData.statistics.budgetUsage}%)
- Remaining Budget: $${projectData.statistics.remainingBudget.toLocaleString()}
- Task Completion: ${projectData.statistics.completedTasks}/${projectData.statistics.totalTasks} (${projectData.statistics.taskCompletionRate}%)
- Created: ${new Date(projectData.project.created_at).toLocaleDateString()}

## PROJECT DETAILS
- **Name:** ${projectData.project.name}
- **Description:** ${projectData.project.description || 'No description provided'}
- **Status:** ${projectData.project.status}
- **Created Date:** ${new Date(projectData.project.created_at).toLocaleDateString()}
- **Last Updated:** ${new Date(projectData.project.updated_at).toLocaleDateString()}

## BUDGET OVERVIEW
- **Total Budget:** $${projectData.project.budget?.toLocaleString() || 0}
- **Total Expenses:** $${projectData.statistics.totalExpenses.toLocaleString()}
- **Budget Utilization:** ${projectData.statistics.budgetUsage}%
- **Remaining Budget:** $${projectData.statistics.remainingBudget.toLocaleString()}

## TASKS (${projectData.tasks.length} Total)

### Completed Tasks (${projectData.statistics.completedTasks})
${projectData.tasks.filter(task => task.completed).map(task => 
  `- **${task.title}**${task.description ? `\n  Description: ${task.description}` : ''}${task.due_at ? `\n  Due Date: ${new Date(task.due_at).toLocaleDateString()}` : ''}\n  Created: ${new Date(task.created_at).toLocaleDateString()}`
).join('\n\n') || 'No completed tasks'}

### Pending Tasks (${projectData.statistics.totalTasks - projectData.statistics.completedTasks})
${projectData.tasks.filter(task => !task.completed).map(task => 
  `- **${task.title}**${task.description ? `\n  Description: ${task.description}` : ''}${task.due_at ? `\n  Due Date: ${new Date(task.due_at).toLocaleDateString()}` : ''}\n  Created: ${new Date(task.created_at).toLocaleDateString()}`
).join('\n\n') || 'No pending tasks'}

## EXPENSES (${projectData.expenses.length} Total)
${projectData.expenses.map(expense => 
  `- **${expense.description}**\n  Amount: $${expense.amount.toLocaleString()}\n  Date: ${new Date(expense.date).toLocaleDateString()}`
).join('\n\n') || 'No expenses recorded'}

## PROJECT UPDATES (${projectData.updates.length} Total)
${projectData.updates.map(update => 
  `- **${new Date(update.date).toLocaleDateString()}** - ${update.author}\n  ${update.content}`
).join('\n\n') || 'No project updates'}

## FILES (${projectData.files.length} Total)
${projectData.files.map(file => 
  `- **${file.name}**${file.tags.length > 0 ? `\n  Tags: ${file.tags.join(', ')}` : ''}`
).join('\n\n') || 'No files uploaded'}

---
Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

Present this data exactly as structured above with proper formatting and spacing.`,
      maxTokens: 4000,
    });

    return NextResponse.json({ 
      report: text,
      projectName: project.name,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
} 