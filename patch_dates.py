import re

with open('src/lib/utils/dates.ts', 'r') as f:
    content = f.read()

content = re.sub(r"if \(\!date\) return '';", "if (date === null || date === undefined || date === '') return '';", content)

with open('src/lib/utils/dates.ts', 'w') as f:
    f.write(content)
