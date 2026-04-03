import re

with open('src/components/views/list-view.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"import \{ format \} from 'date-fns';\n", "", content)
content = re.sub(r"import \{ getNextStatus, statusConfig, priorityLabels \} from '@\/lib\/utils\/tasks';", "import { getNextStatus, statusConfig, priorityLabels } from '@/lib/utils/tasks';\nimport { formatTaskDate } from '@/lib/utils/dates';", content)

content = re.sub(r"format\(new Date\(task.dueAt\), 'MMM d'\)", "formatTaskDate(task.dueAt)", content)

with open('src/components/views/list-view.tsx', 'w') as f:
    f.write(content)
