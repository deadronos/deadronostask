with open('src/components/views/board-view.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.startswith('function calculateNewOrder('):
        skip = True
    elif skip and line == '}\n':
        skip = False
        continue

    if not skip:
        new_lines.append(line)

with open('src/components/views/board-view.tsx', 'w') as f:
    f.writelines(new_lines)
