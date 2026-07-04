"""
ETL: 从 percent4/knowledge_graph_demo 提取《明朝那些事儿》三元组
清洗 → 归类 → 导出 nodes.json + edges.json
"""
import json
import re
from collections import Counter, defaultdict
import openpyxl

# ── 1. 加载原始数据 ─────────────────────────────────
wb = openpyxl.load_workbook('../temp_percent4/mingchaonaxieshier.xlsx')
ws = wb.active
raw_rows = list(ws.iter_rows(min_row=2, values_only=True))

print(f"原始三元组: {len(raw_rows)}")

# ── 2. 关系归一化映射 ───────────────────────────────
# 将 390 种关系合并为 ~20 种标准关系
RELATION_MAP = {
    # 亲属
    '父亲': '父子', '爹': '父子', '老子': '父子', '亲爹': '父子', '之父': '父子',
    '儿子': '父子', '子': '父子', '之子': '父子', '子孙': '父子', '后代': '父子',
    '母亲': '母子',
    '妻子': '夫妻', '老婆': '夫妻', '丈夫': '夫妻', '小妾': '夫妻',
    '弟弟': '兄弟', '兄弟': '兄弟', '之弟': '兄弟', '同母兄弟': '兄弟',
    '叔叔': '叔侄', '叔父': '叔侄', '侄子': '叔侄',
    '祖父': '祖孙', '爷爷': '祖孙', '曾祖父': '祖孙', '孙子': '祖孙',
    '姐姐': '姐弟',
    '姐夫': '姻亲', '妻弟': '姻亲', '内弟': '姻亲', '大舅子': '姻亲',
    '女婿': '姻亲', '表亲': '姻亲', '亲家': '姻亲', '堂兄': '姻亲', '堂姐': '姻亲', '堂姐夫': '姻亲',
    '养父': '养父子', '干爹': '养父子', '干儿子': '养父子',
    '外甥': '其他亲属',
    # 君臣/上下级
    '下属': '君臣', '部下': '君臣', '手下': '君臣', '臣子': '君臣', '心腹': '君臣',
    '皇帝': '君臣', '宠臣': '君臣', '第一宠臣': '君臣',
    # 同僚/同事
    '同僚': '同僚', '同事': '同僚', '好同事': '同僚', '同党': '同僚', '党羽': '同僚',
    '盟友': '同僚', '同盟': '同僚', '忠实同盟': '同僚', '联盟': '同僚',
    # 师生
    '老师': '师生', '学生': '师生', '弟子': '师生', '门人': '师生',
    '嫡传弟子': '师生', '进士同学': '师生', '同科举人': '师生', '学友': '师生',
    # 朋友
    '朋友': '朋友', '好友': '朋友', '好朋友': '朋友', '伙伴': '朋友',
    # 敌对
    '敌人': '敌对', '对头': '敌对', '老对头': '敌对', '死对头': '敌对', '死敌': '敌对',
    '对手': '敌对', '老对手': '敌对', '最强对手': '敌对', '第二强敌': '敌对',
    '新敌人': '敌对', '最大敌人': '敌对', '老冤家': '敌对',
    # 战斗/军事
    '统帅': '军事指挥', '守将': '军事指挥', '大将': '军事指挥', '主帅': '军事指挥',
    '主将': '军事指挥', '先锋': '军事指挥', '前锋': '军事指挥', '总指挥': '军事指挥',
    '名将': '军事指挥', '著名将领': '军事指挥', '高级将领': '军事指挥', '悍将': '军事指挥',
    '首领': '归属', '领袖': '归属', '成员': '归属',
    # 官职 — 过滤掉（不是关系）
    '尚书': 'FILTER', '大学士': 'FILTER', '首辅': 'FILTER', '总兵': 'FILTER',
    '巡抚': 'FILTER', '侍郎': 'FILTER', '主事': 'FILTER', '右侍郎': 'FILTER',
    '总督': 'FILTER', '给事中': 'FILTER', '御史': 'FILTER', '知县': 'FILTER',
    '监察御史': 'FILTER', '员外郎': 'FILTER', '参政': 'FILTER', '少卿': 'FILTER',
    '驿丞': 'FILTER', '把总': 'FILTER', '都督': 'FILTER', '提督': 'FILTER',
    '经略': 'FILTER', '督师': 'FILTER', '布政使': 'FILTER', '通政使': 'FILTER',
    '都御史': 'FILTER', '左都御史': 'FILTER', '右都御史': 'FILTER',
    '左副都御史': 'FILTER', '右副都御史': 'FILTER', '副都御史': 'FILTER',
    '左佥都御史': 'FILTER', '佥事': 'FILTER', '指挥佥事': 'FILTER',
    '监军': 'FILTER', '监军副使': 'FILTER', '巡按御史': 'FILTER', '巡守御史': 'FILTER',
    '提督太监': 'FILTER', '秉笔太监': 'FILTER', '镇守太监': 'FILTER',
    '侍讲': 'FILTER', '侍讲学士': 'FILTER', '侍读学士': 'FILTER', '讲官': 'FILTER',
    '掌院学士': 'FILTER', '编修': 'FILTER', '署部事': 'FILTER', '次辅': 'FILTER',
    '首辅大学士': 'FILTER', '丞相': 'FILTER', '太师': 'FILTER',
    '副部长': 'FILTER', '部长': 'FILTER', '副校长': 'FILTER', '校长': 'FILTER',
    '董事长': 'FILTER', '总经理': 'FILTER', '处长': 'FILTER', '科员': 'FILTER',
    '干部': 'FILTER', '下派干部': 'FILTER', '公务员': 'FILTER', '监生': 'FILTER',
    '秀才': 'FILTER', '举人': 'FILTER', '言官': 'FILTER',
    '通判': 'FILTER', '府丞': 'FILTER', '指挥使': 'FILTER', '总兵官': 'FILTER',
    '市长': 'FILTER', '管理员': 'FILTER', '所长': 'FILTER', '司令员': 'FILTER',
    '队长': 'FILTER', '参谋': 'FILTER', '参谋长': 'FILTER', '翻译': 'FILTER',
    '副手': 'FILTER', '副手王': 'FILTER',
    '掌柜': 'FILTER', '掌门': 'FILTER', '掌门人': 'FILTER',
}

# 自动归类未映射的关系
def classify_relation(p):
    p = str(p).strip()
    if p in RELATION_MAP:
        return RELATION_MAP[p]
    # 官职类 → 过滤
    if any(kw in p for kw in ['尚书', '侍郎', '御史', '太监', '巡抚', '总督', '总兵',
                                '大学士', '给事中', '郎中', '员外', '主事', '知县',
                                '指挥', '将军', '提督', '都督', '经略', '布政使',
                                '部长', '局长', '处长', '主任', '院长', '校', '厂长']):
        return 'FILTER'
    # 位置/地名关系 → 保留为"所在地"
    if any(kw in p for kw in ['首都', '重镇', '老家', '都城', '大本营', '流放地',
                                '军事基地', '北门', '西南端', '东北面', '咽喉', '屏障']):
        return '所在地'
    # 其他低频关系 → 保留为"其他"
    return '其他关联'


# ── 3. 处理三元组 ────────────────────────────────────
nodes = {}       # id -> {name, type, ...}
edges = []       # {source, target, relation, original_text}
entity_types = {}  # name -> guessed type

# 已知的人物、机构、地点列表（用于实体类型推断）
KNOWN_PERSONS = set()
KNOWN_INSTITUTIONS = {'内阁', '兵部', '吏部', '礼部', '户部', '刑部', '工部',
                       '都察院', '翰林院', '东厂', '锦衣卫', '东林党', '阉党'}
KNOWN_PLACES = {'辽东', '朝鲜', '濠州', '南京', '北京', '蓟辽', '江阴'}

for row in raw_rows:
    s, p, o, text = row
    if not s or not p or not o:
        continue
    s, p, o = str(s).strip(), str(p).strip(), str(o).strip()
    rel = classify_relation(p)
    if rel == 'FILTER':
        continue

    # 收集实体
    for name in [s, o]:
        if name not in nodes:
            # 推断类型
            if name in KNOWN_INSTITUTIONS or any(kw in name for kw in ['部', '院', '厂', '卫', '内阁', '翰林']):
                etype = 'institution'
            elif name in KNOWN_PLACES or any(kw in name for kw in ['省', '府', '州', '县', '辽', '朝鲜', '蒙古']):
                etype = 'place'
            else:
                etype = 'person'  # 默认为人物
            nodes[name] = {
                'id': name,
                'name': name,
                'type': etype,
                'importance': 1,
            }

    edges.append({
        'source': s,
        'target': o,
        'relation': rel,
        'original_text': str(text) if text else '',
    })

# 实体重要性：按出现次数分档
entity_degree = Counter()
for e in edges:
    entity_degree[e['source']] += 1
    entity_degree[e['target']] += 1

for name, node in nodes.items():
    deg = entity_degree.get(name, 1)
    if deg >= 30:
        node['importance'] = 5
    elif deg >= 20:
        node['importance'] = 4
    elif deg >= 10:
        node['importance'] = 3
    elif deg >= 5:
        node['importance'] = 2

# ── 4. 统计 ──────────────────────────────────────────
rel_counts = Counter(e['relation'] for e in edges)
type_counts = Counter(n['type'] for n in nodes.values())

print(f"\n清洗后:")
print(f"  节点: {len(nodes)}")
print(f"  边:   {len(edges)}")
print(f"  关系类型: {len(rel_counts)}")
print(f"\n节点类型分布: {dict(type_counts)}")
print(f"\n关系分布:")
for rel, cnt in rel_counts.most_common(20):
    print(f"  {rel}: {cnt}")

# ── 5. 导出 ──────────────────────────────────────────
output = {
    'nodes': list(nodes.values()),
    'edges': edges,
    'meta': {
        'source': 'percent4/knowledge_graph_demo',
        'original_triplets': len(raw_rows),
        'cleaned_nodes': len(nodes),
        'cleaned_edges': len(edges),
        'relation_types': len(rel_counts),
    }
}

out_path = 'ming_nodes_edges.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n✅ 导出: {out_path}")
print(f"   文件大小: {len(json.dumps(output, ensure_ascii=False)) / 1024:.1f} KB")
