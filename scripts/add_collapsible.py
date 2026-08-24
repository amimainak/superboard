import os, re

def update_toolkit(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    lines = content.split('\n')
    # Find sectionTitle function
    title_def_start = -1
    title_def_end = -1
    for i in range(len(lines)):
        line = lines[i].strip()
        if 'sectionTitle' in line and '(' in line and '=>' in line:
            title_def_start = i
            break
    if title_def_start == -1:
        print(f'  WARNING: no sectionTitle found in {filepath}')
        return
    title_def_end = lines[title_def_start + 1:]
    for i in range(title_def_start, len(lines)):
        if ')' in lines[i] and ')' in lines[i]:
            title_def_end = i
            break
    print(f'  {os.path.basename(filepath)}: sectionTitle at lines {title_def_start + 1}-{title_def_end}')
    func_body = lines[title_def_start + 1:title_def_end]
    func_def = '\n' + '\n'.join(func_body) + '\n'
    new_func = '\n' + func_def.replace(
        'const sectionTitle = (text: string) => (',
        'const sectionTitle = (text: string, sectionId: string) => (\n' +
    )
  )
    content = content[:title_def_start] + new_func + content[title_def_end:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f'  Updated {os.path.basename(filepath)}')

def main():
    toolkit_dir = '/home/z/my-project/src/components/room/widgets'
    for fname in os.listdir(toolkit_dir):
        if fname.endswith('Toolkit.tsx'):
            update_toolkit(os.path.join(toolkit_dir, fname))
if __name__ == '__main__':
    main()
