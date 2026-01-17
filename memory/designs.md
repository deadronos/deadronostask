# Design Document: Labels & Subtasks

## Overview

This document outlines the design and implementation of Custom Task Labels and Subtask Checklists within the application. These features enhance task organization and granularity.

## Data Model

### Labels (`labels`)

- **Purpose**: Categorize tasks within a project.
- **Fields**:
  - `projectId`: `Id<'projects'>` (Parent project)
  - `name`: `string` (Label text)
  - `color`: `string` (Tailwind class, e.g., "bg-red-500")

### Subtasks (`subtasks`)

- **Purpose**: Break down a main task into actionable steps.
- **Fields**:
  - `taskId`: `Id<'tasks'>` (Parent task)
  - `title`: `string` (Step description)
  - `completed`: `boolean` (Status)
  - `order`: `number` (Sorting index, currently append-only)

### Tasks (`tasks`) Updates

- **New Field**: `labelIds`: `array<Id<'labels'>>` (References to assigned labels)

## Component Architecture

### 1. TaskDetailModal

**Central Hub**: Replaces simple drag-handle interaction.

- **State**: Manages description editing, label assignment, and subtask list.
- **Label Picker**:
  - Implemented using `Popover` + `Command`.
  - **Create Flow**: Allows users to define a name and pick a color from a `PREDEFINED_COLORS` list.
  - **Auto-Assign**: Newly created labels are immediately assigned to the current task.
- **Subtask Integration**: Renders `SubtaskList` component.

### 2. SubtaskList

- **Features**:
  - List view with Checkboxes.
  - "Add Step" input at the bottom.
  - Delete action (Trash icon).
  - Visual progress bar (calculated from `completed / total`).

### 3. TaskItem (Board Card)

- **Visuals**:
  - **Label Badges**: Small colored pills displayed above the task title? (Actually displayed in the body).
  - **Progress**: If subtasks exist, shows a mini progress bar and "X/Y" count.
- **Interactions**:
  - Clicking the card opens `TaskDetailModal`.
  - Accessibility handles for keyboard navigation (`Enter`/`Space`).

### 4. ProjectPage

- **Filtering**:
  - Added a "Filter by Label" dropdown.
  - Logic: checks if task has _any_ of the selected labels.

## UX Decisions

- **Optimistic Updates**: Used Convex mutations for snappy feel.
- **Color Coding**: Labels use a fixed palette to ensure UI consistency and dark mode compatibility.
- **Accessibility**: Added `role="button"` and keyboard listeners to interactive non-button elements.
