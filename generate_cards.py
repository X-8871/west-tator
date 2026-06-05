import json

suits = [
    ('WANDS', '权杖', ['行动', '热情', '创造力']),
    ('CUPS', '圣杯', ['情感', '直觉', '人际关系']),
    ('SWORDS', '宝剑', ['思想', '冲突', '决断']),
    ('PENTACLES', '星币', ['物质', '财富', '稳固'])
]
ranks = [
    ('ACE OF', '王牌', '新的开始'),
    ('TWO OF', '二', '平衡与选择'),
    ('THREE OF', '三', '合作与成长'),
    ('FOUR OF', '四', '稳定与休息'),
    ('FIVE OF', '五', '冲突与损失'),
    ('SIX OF', '六', '过渡与胜利'),
    ('SEVEN OF', '七', '防御与坚持'),
    ('EIGHT OF', '八', '快速与行动'),
    ('NINE OF', '九', '满足与焦虑'),
    ('TEN OF', '十', '完成与重负'),
    ('PAGE OF', '侍从', '消息与探索'),
    ('KNIGHT OF', '骑士', '行动与冲动'),
    ('QUEEN OF', '王后', '滋养与直觉'),
    ('KING OF', '国王', '掌控与权威')
]

cards = []
for en_suit, zh_suit, base_kw in suits:
    for en_rank, zh_rank, rank_kw in ranks:
        name_en = f'{en_rank} {en_suit}'
        name_zh = f'{zh_suit}{zh_rank}'
        kw = [rank_kw, base_kw[0], base_kw[1]]
        cards.append(f"    {{ zh: '{name_zh}', en: '{name_en}', pos: ['{kw[0]}', '{kw[1]}', '{kw[2]}'] }},")

with open('minor_arcana.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(cards))
