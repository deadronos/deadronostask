import re

with open('src/components/views/board-view.tsx', 'r') as f:
    content = f.read()

# Add import for STATUS_VALUES
content = re.sub(r"import \{ SortableTaskItem \} from '@\/components\/sortable-task-item';", "import { STATUS_VALUES, type TaskStatus } from '@/lib/utils/tasks';\nimport { SortableTaskItem } from '@/components/sortable-task-item';", content)

# Remove local TaskStatus type and STATUS_VALUES
content = re.sub(r"type TaskStatus = 'todo' \| 'doing' \| 'done';\nconst STATUS_VALUES = new Set<TaskStatus>\(\['todo', 'doing', 'done'\]\);\n\n", "", content)

with open('src/components/views/board-view.tsx', 'w') as f:
    f.write(content)
