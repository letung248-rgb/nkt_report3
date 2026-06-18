import json

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

def count_braces(text):
    count = 0
    in_string = False
    quote_char = ''
    in_comment = False
    in_multiline_comment = False
    i = 0
    while i < len(text):
        c = text[i]
        if in_string:
            if c == '\\':
                i += 2
                continue
            if c == quote_char:
                in_string = False
        elif in_comment:
            if c == '\n':
                in_comment = False
        elif in_multiline_comment:
            if c == '*' and i+1 < len(text) and text[i+1] == '/':
                in_multiline_comment = False
                i += 1
        else:
            if c == '/' and i+1 < len(text):
                if text[i+1] == '/':
                    in_comment = True
                    i += 1
                elif text[i+1] == '*':
                    in_multiline_comment = True
                    i += 1
            elif c in ('"', "'", '`'):
                in_string = True
                quote_char = c
            elif c == '{':
                count += 1
            elif c == '}':
                count -= 1
        i += 1
    return count

print('Unmatched braces:', count_braces(text))
