# Fix: '}  `}> should be '`}>  
# Hex: 27 7d 60 7d 3e -> 27 60 7d 3e
OLD = b"'\x7d\x60\x7d\x3e"  # '}  `}>
NEW = b"'\x60\x7d\x3e"        # '`}>

for fp in [
    '/home/z/my-project/src/components/room/widgets/SchedulingWidget.tsx',
    '/home/z/my-project/src/components/room/widgets/ParentPortalWidget.tsx',
    '/home/z/my-project/src/components/room/widgets/GeoGebraPanel.tsx',
]:
    with open(fp, 'rb') as f:
        data = f.read()
    if OLD in data:
        data = data.replace(OLD, NEW)
        with open(fp, 'wb') as f:
            f.write(data)
        print(f'Fixed {fp.split("/")[-1]}')
    else:
        print(f'No match in {fp.split("/")[-1]}')
print('Done')
