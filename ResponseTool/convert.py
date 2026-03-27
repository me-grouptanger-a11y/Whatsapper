import codecs

with codecs.open('data.js', 'r', 'utf-8') as f:
    content = f.read()

# Strip the variable declaration to get pure JSON
json_str = content.replace('const responsesData = ', '').strip().rstrip(';')

with codecs.open('database.json', 'w', 'utf-8') as f:
    f.write(json_str)

print("Converted data.js to database.json")
