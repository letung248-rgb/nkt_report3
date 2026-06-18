import json

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

def check_brackets(text):
    stack = []
    in_string = False
    quote_char = ''
    i = 0
    line_num = 1
    
    # We should skip comments
    in_comment = False
    in_multiline_comment = False

    while i < len(text):
        c = text[i]
        if c == '\n':
            line_num += 1
            if in_comment:
                in_comment = False

        if in_string:
            if c == '\\':
                i += 2
                continue
            if c == quote_char:
                in_string = False
        elif in_comment:
            pass
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
            elif c in ('{', '(', '['):
                stack.append((c, line_num))
            elif c in ('}', ')', ']'):
                if not stack:
                    return f"Extra closing bracket {c} at line {line_num}"
                last, _ = stack.pop()
                if (last == '{' and c != '}') or (last == '(' and c != ')') or (last == '[' and c != ']'):
                    return f"Mismatched bracket: {last} closed by {c} at line {line_num}"
        i += 1
    if stack:
        return f"Unclosed brackets: {stack}"
    return "OK"

print(check_brackets(text))
