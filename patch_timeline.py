import re

with open('src/components/views/timeline-view.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"import \{ differenceInDays, addDays, format, startOfDay \} from 'date-fns';", "import { differenceInDays, addDays, format, startOfDay } from 'date-fns';\nimport { formatTaskDate } from '@/lib/utils/dates';", content)

content = re.sub(r"format\(taskStart, 'MMM d'\)", "formatTaskDate(taskStart)", content)
content = re.sub(r"format\(new Date\(task.dueAt\), 'MMM d'\)", "formatTaskDate(task.dueAt)", content)

with open('src/components/views/timeline-view.tsx', 'w') as f:
    f.write(content)
