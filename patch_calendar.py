import re

with open('src/components/views/calendar-view.tsx', 'r') as f:
    content = f.read()

# No obvious usages of format(new Date(task.dueAt), 'MMM d') in the previously grepped timeline,
# let's check what formatting calendar-view uses
