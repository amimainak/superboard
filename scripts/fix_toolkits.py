# Fix inline styles in toolkit widgets for isDark support
import re

def fix_toolkit_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Replace static toolkit-section-title class with dynamic
    content = content.replace(
        'className="toolkit-section-title"',
        'className={`toolkit-section-title ${isDark ? \'\' : \'toolkit-section-title-light\'}`}'
    )
    
    # 2. Replace static toolkit-chip class with dynamic
    content = content.replace(
        'className="toolkit-chip"',
        'className={`toolkit-chip ${isDark ? \'\' : \'toolkit-chip-light\'}`}'
    )
    
    # 3. Fix inline style: background for non-selected items
    content = content.replace(
        "background: 'rgba(255,255,255,0.05)',",
        "background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',"
    )
    
    # 4. Fix inline style: border for non-selected items
    content = content.replace(
        "border: '1px solid rgba(255,255,255,0.08)',",
        "border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',"
    )
    
    # 5. Fix inline style: color #94a3b8 (muted text)
    content = content.replace(
        "color: '#94a3b8',",
        "color: isDark ? '#94a3b8' : '#475569',"
    )
    
    # 6. Fix inline style: color #34d399 (selected green - too bright for light)
    content = content.replace(
        "color: '#34d399',",
        "color: '#059669',"
    )
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f'Updated {filepath}')

# Fix MathToolkit
fix_toolkit_file('/home/z/my-project/src/components/room/widgets/MathToolkit.tsx')

# Fix LanguageToolkit  
fix_toolkit_file('/home/z/my-project/src/components/room/widgets/LanguageToolkit.tsx')

# Fix GeoGebraPanel (remaining inline styles)
fix_toolkit_file('/home/z/my-project/src/components/room/widgets/GeoGebraPanel.tsx')

print('Done!')
