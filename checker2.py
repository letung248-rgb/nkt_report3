import json

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

def check_literal_newlines(text):
    in_string = False
    quote_char = ''
    i = 0
    line_num = 1
    while i < len(text):
        c = text[i]
        if c == '\n':
            line_num += 1
            if in_string and quote_char in ("'", '"'):
                print(f"FATAL: Literal newline in string at line {line_num-1} with quote {quote_char}")
                return False
        
        if in_string:
            if c == '\\':
                i += 2
                continue
            if c == quote_char:
                in_string = False
        else:
            if c in ('"', "'", '`'):
                in_string = True
                quote_char = c
        i += 1
    return True

print('No literal newlines in strings:', check_literal_newlines(text))
