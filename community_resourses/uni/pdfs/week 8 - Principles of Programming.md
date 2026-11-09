---
title: week 8 - Principles of Programming
dg-publish: true
---
# week 8
- [[#Strings]]
	- [[#Checking for substrings]]
	- [[#String functions]]
	- [[#Escape characters ` `]]
	- [[#String formatting `%`]]
	- [[#Advanced string formatting `.format()`]]

# Strings

- a type of sequences
- immutable
- just like a list, each character in the string has an index
- lot of things are common in strings and lists

```python
>>> str="Hello Python"
>>> str[1]
e
>>> str[-2]
o
>>> str[3:]
lo Python
>>> str[4:10]
o Python
```

- they can be iterated using for loops

code:
```python
for ltr in "Hel lo":
	print(ltr)
```

output:
```
H
e
l
	# space is a character
l
o
```

## Checking for substrings

- use keyword `in`

```python
>>> txt="Python is a programming language"
>>> print("prog" in txt)
True
```

## String functions

| Method    | Output Type | Primary Use Case                                                                                                            |
| --------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `lower()` | String      | Returns a copy of the string with all uppercase characters converted to lowercase.                                          |
| `upper()` | String      | Returns a copy of the string with all lowercase characters converted to uppercase.                                          |
| `strip()` | String      | Removes leading and trailing whitespace by default.(removing `\n` or extra spaces). can define where to split `.split(",")` |
| `split()` | List        | Breaks a string into a **list** of substrings based on a specified delimiter.                                               |
| `title()` | String      | in each word first character is capitalized                                                                                 |

```python
>>> str="Quick brown Fox"
>>> str.lower()
quick brown fox
>>> str.upper()
QUICK BROWN FOX
>>> str.strip()
QuickbrownFox
>>> str.split()
['Quick','brown','Fox']
>>> str.title()
Quick Brown Fox
```

## Escape characters `\`

- to represent characters inside strings

|Sequence|Result|Description|
|---|---|---|
|`\'`|Single Quote|Inserts a single quote inside a string delimited by single quotes.|
|`\"`|Double Quote|Inserts a double quote inside a string delimited by double quotes.|
|`\\`|Backslash|Inserts a literal backslash into the string.|
|`\n`|New Line|Moves the cursor to the next line (line break).|
|`\t`|Tab|Inserts a horizontal tab space.|
|`\r`|Carriage Return|Moves the cursor back to the start of the current line, often overwriting previous text.|
|`\b`|Backspace|Moves the cursor back one position, effectively "erasing" the previous character.|

code:
```python
print("He asked, \"What's there?\"")
print('He asked, "What\'s there?"')
print("first line\nsecond line")
print("first\tsecond")
```

output:
```
He asked, "What's there?"
He asked, "What's there?"
first line # go to a new line
second line
first   second # tab space
```

## String formatting `%`

- create strings by combing valued of variables
- `%` - string formatting operator, old style

```python
>>> line="Num1: %d Num2: %d" %(15,22)
>>> print(line)
Num1: 15 Num2:22
```

- `%` operator has replaced "%d"s in the left side string with values provided in the right side
- Here "%d" is for an integer decimal value

| Placeholder | Type    | Description                                               | Code                          | Output        |
| ----------- | ------- | --------------------------------------------------------- | ----------------------------- | ------------- |
| **`%s`**    | String  | Converts object to string (cannot use for calculations)   | `print("Hello %s" % "World")` | `Hello World` |
| **`%d`**    | Integer | Convert to decimal integer                                | `print("%d" % 15.56)`         | `15`          |
| **`%f`**    | Float   | Convert to floating-point                                 | `print("%f" % 3)`             | `3.000`       |
| **`%.2f`**  | Float   | Convert to floating-point and rounded to 2 decimal places | `print("%.2f" % 3.14759)`     | `3.15`        |
| **`%x`**    | Hex     | Convert to Hexadecimal (base 16)                          | `print("%x" % 255)`           | `ff`          |
| **`%%`**    | Literal | Prints a literal `%`                                      | `print("Score: %d%%" % 95)`   | `Score: 95%`  |

- padding/filling to a specific length (space or any digit)

|                   | Code                      | Output    | Description                                           |
| ----------------- | ------------------------- | --------- | ----------------------------------------------------- |
| **Right-aligned** | `print("[%5s]" % "Hi")`   | `[   Hi]` | Pads with 3 spaces to reach width 5.                  |
| **Left-aligned**  | `print("[%-5s]" % "Hi")`  | `[Hi   ]` | Adds spaces to the right.                             |
| **Zero-padded**   | `print("%05d" % 42)`      | `00042`   | Uses `0` instead of spaces (for numbers).             |
| **Float Padding** | `print("[%5.2f]" % 3.14)` | `[ 3.14]` | Total width 5, including decimals and dot.(one space) |

- same way strings can be truncated

| Code                                      | Output       | Description                                                    |
| ----------------------------------------- | ------------ | -------------------------------------------------------------- |
| `print("%.10s" % "This Is ALong String")` | `This Is AL` | Keeps only the first 10 characters.                            |
| `print("%.5s" % "Python")`                | `Pytho`      | Truncates at the 5th character.                                |
| `print("%.10s" % "Short")`                | `Short`      | If the string is shorter than the limit, it remains unchanged. |
```python
>>> print('%06.2f' %(3.1415924242428))
003.14
```

## Advanced string formatting `.format()`

- `.format()` function
- `{}` is used as a placeholder and can be numbered

```python
>>> txt="He is {0}.{0} just turned {1}." .format("John",36)
>>> print(txt)
He us John.John just turned 36.
```

- types of placeholders

| Type         | Code                                              | Output              |     |
| ------------ | ------------------------------------------------- | ------------------- | --- |
| **Empty**    | `print("{} and {}".format("A", "B"))`             | `A and B`           |     |
| **Numbered** | `print("{1} then {0}".format("First", "Second"))` | `Second then First` |     |
| **Named**    | `print("{n} is {a}".format(n="Alice", a=30))`     | `Alice is 30`       |     |

- padding/filling

|Format|Code|Output|Description|
|---|---|---|---|
|**Decimals**|`print("{:.2f}".format(3.14159))`|`3.14`|Rounds to 2 decimal places|
|**Zero Pad**|`print("{:05d}".format(42))`|`00042`|Pads an integer to width 5|
|**Comma**|`print("{:,}".format(1000000))`|`1,000,000`|Adds thousands separator|
|**Percent**|`print("{:.1%}".format(0.25))`|`25.0%`|Multiplies by 100 and adds `%`|

- Truncate

```python
# Truncate a long string to exactly 5 characters
print("{:.5}".format("Caterpillar")) 
# Output: Cater

# Truncate to 5 characters and pad to a total width of 10
print("{:10.5}".format("Caterpillar"))
# Output: 'Cater     '
```