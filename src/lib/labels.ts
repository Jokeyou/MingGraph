// 节点类型与关系类型的显示标签映射

export const NODE_TYPE_LABELS: Record<string, string> = {
  person: '人物',
  event: '事件',
  place: '地点',
  institution: '机构',
};

export const RELATION_LABELS: Record<string, string> = {
  '父子': '父↔子',
  '母子': '母↔子',
  '夫妻': '夫↔妻',
  '兄弟': '兄↔弟',
  '叔侄': '叔↔侄',
  '祖孙': '祖↔孙',
  '姻亲': '姻亲',
  '养父子': '养父↔子',
  '姐弟': '姐↔弟',
  '其他亲属': '亲属',
  '君臣': '君↔臣',
  '同僚': '同僚',
  '师生': '师↔生',
  '朋友': '朋友',
  '敌对': '敌对',
  '军事指挥': '统帅',
  '归属': '隶属',
  '所在地': '位于',
  '其他关联': '关联',
};

// 明朝16帝年号
export const EMPERORS = [
  { name: '洪武', emperor: '朱元璋', start: 1368, end: 1398 },
  { name: '建文', emperor: '朱允炆', start: 1399, end: 1402 },
  { name: '永乐', emperor: '朱棣', start: 1403, end: 1424 },
  { name: '洪熙', emperor: '朱高炽', start: 1425, end: 1425 },
  { name: '宣德', emperor: '朱瞻基', start: 1426, end: 1435 },
  { name: '正统', emperor: '朱祁镇', start: 1436, end: 1449 },
  { name: '景泰', emperor: '朱祁钰', start: 1450, end: 1457 },
  { name: '天顺', emperor: '朱祁镇', start: 1457, end: 1464 },
  { name: '成化', emperor: '朱见深', start: 1465, end: 1487 },
  { name: '弘治', emperor: '朱祐樘', start: 1488, end: 1505 },
  { name: '正德', emperor: '朱厚照', start: 1506, end: 1521 },
  { name: '嘉靖', emperor: '朱厚熜', start: 1522, end: 1566 },
  { name: '隆庆', emperor: '朱载坖', start: 1567, end: 1572 },
  { name: '万历', emperor: '朱翊钧', start: 1573, end: 1620 },
  { name: '泰昌', emperor: '朱常洛', start: 1620, end: 1620 },
  { name: '天启', emperor: '朱由校', start: 1621, end: 1627 },
  { name: '崇祯', emperor: '朱由检', start: 1628, end: 1644 },
];
