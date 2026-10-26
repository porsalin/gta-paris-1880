#!/usr/bin/env python3
"""Regenerates story_bible.md from missions.js (run: node + python3 gen_bible.py)."""
import json, subprocess, os
here = os.path.dirname(os.path.abspath(__file__))
js = "import {CHAPTERS,DRAMATIS,MISSIONS} from '%s/missions.js'; console.log(JSON.stringify({CHAPTERS,DRAMATIS,MISSIONS}))" % here
d = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js]))
H = open(os.path.join(here, 'story_bible_head.md')).read()
o = [H.rstrip(), '', '## Dramatis Personae', '### Fictional']
for x in d['DRAMATIS']:
    if not x.get('real'): o.append(f"- **{x['name']}**: {x['role']}")
o += ['### Historical (speaking cameos, always respectful; all alive in 1890)']
for x in d['DRAMATIS']:
    if x.get('real'): o.append(f"- **{x['name']}**: {x['role']}")
o += ['', '## Mission list']
def line(m, num):
    kinds = []
    for s in m['steps']:
        if s['t'] not in kinds: kinds.append(s['t'])
    pre = f"{num}. " if num else "- "
    return f"{pre}**{m['title']}** ({m['en']}){' ◆' if m.get('heist') else ''}: {m['brief']} *[{', '.join(kinds)}]*"
for ci, c in enumerate(d['CHAPTERS']):
    o += ['', f"### {c['act']} · {c['season']} · {c['title']}", f"*{c['text']}*", '']
    n = 0
    for m in d['MISSIONS']:
        if m.get('chapter') == ci and not m.get('card'):
            n += 1; o.append(line(m, n))
o += ['', '### Side jobs (heard of through kiosks, newspapers and rumours)', '']
for m in d['MISSIONS']:
    if m.get('chapter') == -1: o.append(line(m, 0))
open(os.path.join(here, 'story_bible.md'), 'w').write('\n'.join(o) + '\n')
print('story_bible.md', len(o), 'lines')
