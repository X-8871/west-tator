import json
import re

filenames = [
    '0-thefool.jpg', '1-themagician.jpg', '2-thehighpriestess.jpg', '3-theempress.jpg', '4-theemperor.jpg',
    '5-thehierophant.jpg', '6-thelovers.jpg', '7-thechariot.jpg', '8-strength.jpg', '9-thehermit.jpg',
    '10-fortune.jpg', '11-justice.jpg', '12-thehangedman.jpg', '13-death.jpg', '14-temperance.jpg',
    '15-thedevil.jpg', '16-thetower.jpg', '17-thestar.jpg', '18-themoon.jpg', '19-thesun.jpg',
    '20-judgement.jpg', '21-theworld.jpg',
    
    '22-aceofwands.jpg', '23-wands2.jpg', '24-wands3.jpg', '25-wands4.jpg', '26-wands5.jpg',
    '27-wands6.jpg', '28-wands7.jpg', '29-wands8.jpg', '30-wands9.jpg', '31-wands10.jpg',
    '32-pageofwands.jpg', '33-knightofwands.jpg', '34-queenofwands.jpg', '35-kingofwands.jpg',
    
    '36-aceofcups.jpg', '37-cups2.jpg', '38-cups3.jpg', '39-cups4.jpg', '40-cups5.jpg',
    '41-cups6.jpg', '42-cups7.jpg', '43-cups8.jpg', '44-cups9.jpg', '45-cups10.jpg',
    '46-pageofcups.jpg', '47-knightofcups.jpg', '48-queenofcups.jpg', '49-kingofcups.jpg',
    
    '50-aceofswords.jpg', '51-swords2.jpg', '52-swords3.jpg', '53-swords4.jpg', '54-swords5.jpg',
    '55-swords6.jpg', '56-swords7.jpg', '57-swords8.jpg', '58-swords9.jpg', '59-swords10.jpg',
    '60-pageofswords.jpg', '61-knightofswords.jpg', '62-queenofswords.jpg', '63-kingofswords.jpg',
    
    '64-aceofpentacles.jpg', '65-pentacles2.jpg', '66-pentacles3.jpg', '67-pentacles4.jpg', '68-pentacles5.jpg',
    '69-pentacles6.jpg', '70-pentacles7.jpg', '71-pentacles8.jpg', '72-pentacles9.jpg', '73-pentacles10.jpg',
    '74-pageofpentacles.jpg', '75-knightofpentacles.jpg', '76-queenofpentacles.jpg', '77-kingofpentacles.jpg'
]

# Read main.js
with open(r'c:\Users\22061\Desktop\西方塔罗\js\main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace the CARD_POOL array completely.
# Find where CARD_POOL starts and ends.
match = re.search(r'(const CARD_POOL = \[)(.*?)(\];)', content, re.DOTALL)
if match:
    cards_text = match.group(2)
    lines = cards_text.strip().split('\n')
    new_lines = []
    
    # We should have exactly 78 lines of cards.
    card_idx = 0
    for line in lines:
        if '{ zh:' in line:
            # Inject img: 'filename' before pos:
            if card_idx < len(filenames):
                line = line.replace('pos:', f"img: '{filenames[card_idx]}', pos:")
                new_lines.append(line)
                card_idx += 1
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
            
    new_cards_text = '\n'.join(new_lines) + '\n  '
    new_content = content[:match.start(2)] + '\n' + new_cards_text + content[match.end(2):]
    
    with open(r'c:\Users\22061\Desktop\西方塔罗\js\main.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully injected images into {card_idx} cards.")
else:
    print("Could not find CARD_POOL")
