import re

with open('src/components/views/list-view.tsx', 'r') as f:
    content = f.read()

# Add imports
content = re.sub(r"import \{ CheckCircle2, Circle, Clock, Archive \} from 'lucide-react';", "import { Archive } from 'lucide-react';", content)
content = re.sub(r"import \{ TaskDetailModal \} from '@\/components\/task-detail-modal';", "import { getNextStatus, statusConfig, priorityLabels } from '@/lib/utils/tasks';\nimport { TaskDetailModal } from '@/components/task-detail-modal';", content)

# Remove getNextStatus function
content = re.sub(r"function getNextStatus\(status: 'todo' \| 'doing' \| 'done'\): 'todo' \| 'doing' \| 'done' \{\n  if \(status === 'todo'\) return 'doing';\n  if \(status === 'doing'\) return 'done';\n  return 'todo';\n\}\n\n", "", content)

# Remove statusConfig inside TaskListItem
content = re.sub(r"  const statusConfig = \{\n    todo: \{ icon: Circle, color: 'text-muted-foreground' \},\n    doing: \{ icon: Clock, color: 'text-primary' \},\n    done: \{ icon: CheckCircle2, color: 'text-emerald-600' \},\n  \};\n\n", "", content)

# Remove priorityLabels inside TaskListItem
content = re.sub(r"  const priorityLabels = \{\n    0: 'Low',\n    1: 'Medium',\n    2: 'High',\n    3: 'Urgent',\n  \};\n\n", "", content)

with open('src/components/views/list-view.tsx', 'w') as f:
    f.write(content)
