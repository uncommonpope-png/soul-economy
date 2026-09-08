import json, os

catalog = json.load(open('data/catalog.json','r',encoding='utf-8'))

new_skills = [
    {'icon':'🎨','type':'skill','name':'Design Extract','desc':'Extract design systems to DTCG tokens + shadcn/ui','plt':'0.7/0.8/0.3','file':'soul-gun-design-extract.md','tags':['design-system','figma','tokens','mcp']},
    {'icon':'🌀','type':'skill','name':'Motion Primitives','desc':'Animated interface primitives for React/Svelte','plt':'0.6/0.8/0.4','file':'soul-gun-motion-primitives.md','tags':['motion','animation','react','grafted']},
    {'icon':'⚛️','type':'skill','name':'Skills for Figma','desc':'Native Figma MCP agent skills — tokens, a11y, slides','plt':'0.6/0.9/0.2','file':'soul-gun-skills-for-figma.md','tags':['figma','mcp','grafted']},
    {'icon':'🎨','type':'skill','name':'Tinte','desc':'Design system to agent plugin compiler','plt':'0.8/0.7/0.5','file':'soul-gun-tinte.md','tags':['design-system','compiler','grafted']},
    {'icon':'🎨','type':'skill','name':'Better Design','desc':'31 brand themes + WCAG rules via MCP + shadcn registry','plt':'0.7/0.8/0.3','file':'soul-gun-better-design.md','tags':['theme','mcp','shadcn','grafted']},
    {'icon':'⚡','type':'skill','name':'Lightswind','desc':'160+ animated accessible React components with MCP','plt':'0.7/0.8/0.4','file':'soul-gun-lightswind.md','tags':['react','components','animation','mcp']},
    {'icon':'⚛️','type':'skill','name':'Alpha Shadcn','desc':'Figma shadcn/ui sync plugin + MCP','plt':'0.8/0.9/0.2','file':'soul-gun-alpha-shadcn.md','tags':['figma','shadcn','sync','mcp','grafted']},
    {'icon':'🏗️','type':'skill','name':'Refly','desc':'Open-source agent skills builder — compose, deploy','plt':'0.9/0.6/0.4','file':'soul-gun-refly.md','tags':['agent','builder','framework','grafted']},
    {'icon':'🏭','type':'skill','name':'Claude Code Skill Factory','desc':'Production-ready Claude Code skills factory + validation','plt':'0.8/0.7/0.4','file':'soul-gun-claudecode-factory.md','tags':['builder','validation','claude-code','grafted']},
    {'icon':'🏛️','type':'skill','name':'Plugin87 UX Skill','desc':'Senior design architect — 42 components, 138 systems, WCAG 2.2','plt':'0.8/0.8/0.3','file':'soul-gun-plugin87-ux-skill.md','tags':['design','architecture','a11y','grafted']},
    {'icon':'🎨','type':'skill','name':'UX-UI Agent Skills','desc':'Senior design architect skills bundle — agentic skills','plt':'0.8/0.8/0.3','file':'soul-gun-ux-ui-skills.md','tags':['design','agent-skills','a11y','grafted']},
    {'icon':'⚡','type':'skill','name':'Shadcn Extension','desc':'12 premium shadcn/ui components (Tron, Glass, Neural, Aurora)','plt':'0.7/0.7/0.4','file':'soul-gun-shadcn-extension.md','tags':['shadcn','extension','components','react','grafted']},
]

details = {
    'soul-gun-design-extract.md': ('Extract any website Figma file to structured DTCG tokens, shadcn/ui registry, WCAG remediation', 'npx design-extract', 'DTCG tokens, shadcn registry, WCAG remediation', 'DTCG tokens input'),
    'soul-gun-motion-primitives.md': ('UI kit for beautiful animated interfaces', 'npx motion-primitives add', 'Spring physics, particles, SVG', 'npm install @motion-primitives/react'),
    'soul-gun-skills-for-figma.md': ('Agent skills for native Figma MCP', 'npx -y @figma/mcp-server-figma', 'Token export, a11y audit', 'FIGMA_ACCESS_TOKEN'),
    'soul-gun-tinte.md': ('Compile design systems into agent plugins', 'npx tinte compile', 'SKILL.md, tokens.css', 'DTCG tokens input'),
    'soul-gun-better-design.md': ('31 themes + WCAG via MCP', 'npx better-design-mcp', '31 themes, WCAG rules', 'npx better-design-mcp'),
    'soul-gun-lightswind.md': ('160+ animated accessible React components', 'npx lightswind add', '160 components, MCP, WCAG', 'npm install lightswind'),
    'soul-gun-alpha-shadcn.md': ('Figma↔shadcn sync plugin', 'npx alpha-shadcn-mcp', 'One-click export, MCP integration', 'Figma plugin'),
    'soul-gun-refly.md': ('Agent skills builder framework', 'npx refly dev', 'Visual composer, registry', 'npm create refly@latest'),
    'soul-gun-claudecode-factory.md': ('Production-ready Claude Code skills factory', 'npx claude-code-skill-factory', 'Validation pipeline', 'npx claude-code-skill-factory'),
    'soul-gun-plugin87-ux-skill.md': ('42 components, 138 systems, WCAG 2.2', 'npx @plugin87/ux-skills', 'Component library, a11y', 'npm install'),
    'soul-gun-ux-ui-skills.md': ('Design architect agent skills bundle', 'npx @plugin87/ux-mcp-server', 'Runnable command skills', 'npm install'),
    'soul-gun-shadcn-extension.md': ('12 premium shadcn/ui components', 'npx shadcn-extension', 'Tron, Glass, Neural, Aurora', 'npx shadcn-extension'),
}

for s in new_skills:
    d, i, c, r = details.get(s['file'], (s['desc'], '', '', ''))
    full = {
        'icon': s['icon'], 'type': s['type'], 'name': s['name'], 'desc': s['desc'],
        'plt': s['plt'], 'file': s['file'], 'author': 'profit-prime', 'license': 'MIT',
        'tags': s['tags'], 'image': '', 'version': '1.0.0', 'size': '2 KB',
        'details': d, 'contents': c.split(', ') if c else [],
        'requirements': r, 'install': i, 'downloads': 0, 'likes': 3,
        'updated': '2026-09-07'
    }
    if not any(c.get('file')==s['file'] for c in catalog):
        catalog.append(full)

json.dump(catalog, open('data/catalog.json','w',encoding='utf-8'), ensure_ascii=False, indent=2)
print(f'catalog: {len(catalog)} items')

# Ultra Review Audit
md_files = [s['file'].replace('.md','') for s in new_skills]
all_pass = True
for name in md_files:
    path = f'downloads/{name}.md'
    exists = os.path.exists(path)
    if exists:
        content = open(path, encoding='utf-8').read()
        checks = {
            'has_side_a': '## Side A' in content,
            'has_side_b': '## Side B' in content,
            'has_plt': 'plt:' in content or 'PLT:' in content,
            'in_catalog': any(c.get('file')==name+'.md' for c in catalog),
            'has_integration': 'Soul Economy Integration' in content,
        }
        passed = all(checks.values())
        status = 'PASS' if passed else 'FAIL'
        if not passed:
            all_pass = False
            for k,v in checks.items():
                if not v: print(f'  FAIL: {name}.{k}')
        print(f'{name}: {status}')
    else:
        print(f'{name}: FAIL (file missing)')
        all_pass = False

print(f'\nAll passed: {all_pass}')
print(f'Catalog size: {len(catalog)}')
