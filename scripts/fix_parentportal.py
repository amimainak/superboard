# Fix ParentPortalWidget: remove extra } after backtick
# Pattern: `}}}> should be `}>
# Hex: 60 7d 7d 3e -> 60 7d 3e

OLD = b'\x60\x7d\x7d\x3e'  # `}}>
NEW = b'\x60\x7d\x3e'        # `}>

fp = '/home/z/my-project/src/components/room/widgets/ParentPortalWidget.tsx'
with open(fp, 'rb') as f:
    data = f.read()
count = data.count(OLD)
if count:
    data = data.replace(OLD, NEW)
    with open(fp, 'wb') as f:
        f.write(data)
    print(f'Fixed {count} occurrences')
else:
    print('No match found')
