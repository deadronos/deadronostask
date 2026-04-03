import re

with open('src/components/task-item.tsx', 'r') as f:
    content = f.read()

# Remove old imports
content = re.sub(r"import \{ CheckCircle2, Circle, Clock, AlertCircle, Archive \} from 'lucide-react';", "import { Archive } from 'lucide-react';", content)

# Add new import
content = re.sub(r"import \{ Badge \} from '@\/components\/ui\/badge';", "import { priorityConfig, statusConfig, type TaskStatus } from '@/lib/utils/tasks';\n\nimport { Badge } from '@/components/ui/badge';", content)

# Remove priorityConfig
content = re.sub(r"  const priorityConfig = \{\n    0: \{ label: 'Low', variant: 'secondary' as const, icon: Circle \},\n    1: \{ label: 'Medium', variant: 'default' as const, icon: Clock \},\n    2: \{ label: 'High', variant: 'default' as const, icon: AlertCircle \},\n    3: \{ label: 'Urgent', variant: 'destructive' as const, icon: AlertCircle \},\n  \};\n\n", "", content)

# Remove statusConfig
content = re.sub(r"  const statusConfig = \{\n    todo: \{ label: 'To Do', icon: Circle, color: 'text-muted-foreground' \},\n    doing: \{ label: 'In Progress', icon: Clock, color: 'text-primary' \},\n    done: \{ label: 'Done', icon: CheckCircle2, color: 'text-emerald-600' \},\n  \};\n\n", "", content)

with open('src/components/task-item.tsx', 'w') as f:
    f.write(content)
