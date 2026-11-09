---
title: week 7 - Principles of Programming
dg-publish: true
---

# week 7
- [[#Sequences]]
	- [[#1. Lists - mutable]]
		- [[#Accessing values inside lists]]
		- [[#Updating list items]]
		- [[#Removing items from a list]]
			- [[#`del` - when we know the index number to delete]]
			- [[#`remove()` - when we know the value to delete]]
		- [[#Appending values to a list]]
			- [[#`append()`]]
			- [[#`insert()`]]
		- [[#List operators]]
		- [[#Slicing lists]]
			- [[#`[start stop]` From `start` index up to (but not including) `stop`]]
			- [[#`[ stop]` From the beginning up to (but not including) `stop`]]
			- [[#`[start ]` From `start` index to the very end]]
		- [[#Length of lists]]
		- [[#Range function]]
		- [[#Iterating lists]]
	- [[#2. Tuples - immutable]]

# Sequences
- Is an object that holds multiple items of data, stored one after the other
- **compound data types** (Can store multiple data types in one sequence)
- a **sequence** is an ordered collection of items where each element is identified by a specific position, known as an **index**. (indexes start with 0 )

- There are 3 types
	- **lists**
	- **tuples**
	- **strings**

## 1. Lists - mutable

- an object that contains **multiple data items**
- written as a **list of comma-separated values in `[]`**

![](https://www.scaler.com/topics/media/elements-in-python-list-1024x495.webp)

![](https://pynative.com/wp-content/uploads/2021/03/python-list.jpg)

- Empty lists

```python
empty_list = []
```

### Accessing values inside lists

- Can be accessed with their index, using `[]`

```python
 >>> list1 = ['Jane','Adam','Daniel']
 >>> list1[0]
 Jane
 >>> list1[2]
 Daniel
 >>> list1[-1] # reverse indexing
 Daniel
 >>> list1[-3]
 Jane
```

### Updating list items

```python
>>> list1 = ['Jane','Adam','Daniel']
>>> list1[0] = 100
>>> print(list1)
[100,'Adam','Daniel']
```

### Removing items from a list

#### `del` - when we know the index number to delete

- use `del` keyword

Syntax
```python
del list_name[index]
```


```python
>>> list1 = ['Jane','Adam','Daniel']
>>> del list1[0]
>>> list1
['Adam','Daniel'] # now 'Adam' is in 0 th index
#  0   ,   1
```

#### `remove()` - when we know the value to delete

- use when you don't know the index of the element
- use `remove()` function

Syntax
```python
list_name.remove(value)
```


```python
>>> list1 = ['Jane','Adam','Daniel']
>>> list1.remove('Adam')
>>> list1
['Jane','Daniel']
#   0  ,  1
```

### Appending values to a list

#### `append()` - add elements at the end of the list

-  Adds the entire object as one single element at the end of the list.
- use `append()` function

Syntax
```python
list_name.append(item)
```


```python
>>> list2 = [20,40,30]
>>> list2.append(68)
>>> list2
[20,40,30,68]
# 0 ,1,2,3
```

#### `insert()` - add elements to a specific index

- Adds an element at **any specific position** in a list.
- use `insert()` function

Syntax
```python
list_name.insert(index, element)
```


```python
>>> list2 = [20,40,50]
>>> lists2.insert(1,30)
>>> list2
[20,30,40,50]
# 0,1,2,3
```

### List operators

- `+` and `*` operators work with lists
	- `+` ->concatenation
	- `*` ->repetition

```python
>>> group_a = ["Alice", "Bob"]
>>> group_b = ["Charlie", "David"]
>>> joined = group_a + group_b
>>> joined
['Alice', 'Bob', 'Charlie', 'David']


>>> status = ["Pending"]
>>> queue = status * 3
>>> queue
['Pending', 'Pending', 'Pending']


>>> zeros = [0] * 5
>>> zeros
[0, 0, 0, 0, 0]
```

### Slicing lists

-  used for extracting specific portions of a list.

-  The Anatomy of a Slice
	-  **`start`**: The index where the slice begins (**inclusive**). Defaults to 0.
	-  **`stop`**: The index where the slice ends (**exclusive**). Defaults to the end of the list.
	-  **`step`**: The increment (how many items to jump). Defaults to 1.

#### `[start:stop]`: From `start` index up to (but not including) `stop`

```python
l1 = ['A', 'B', 'C', 'D', 'E']

print( l1[1:4] )  # ['B', 'C', 'D'] (Indices 1, 2, 3)
```

#### `[:stop]`: From the beginning up to (but not including) `stop`

```python
l1 = ['A', 'B', 'C', 'D', 'E']

print( l1[:3] )   # ['A', 'B', 'C'] (Indices 0, 1, 2)
```

#### `[start:]`: From `start` index to the very end

```python
l1 = ['A', 'B', 'C', 'D', 'E']

print( l1[2:] )   # ['C', 'D', 'E'] (Indices 2, 3, 4)
```

### Length of lists

- use `len()` function
- count no. of items in a list

```python
>>> list1 = [2,5,2,10]
>>> len(list1)
4
```

### Range function

- used to generate a sequence of numbers
- then convert the range into a list using `list()` function

```python
>>> num_range = range(1,6)
>>> num_list = list(num_range)
>>> num_list
[1,2,3,4,5]
```

### Iterating lists

code
```python
numbers = [1,2,3,4]

for n in number:
	print(n)
```

output
```
1
2
3
4
```
---
code
```python
l1 = [3,5,10,11,14]
l2 = []

for x in l1:
	y = x * x
	l2.append(y)
print(l2)
```

output
```
[9,25,100,121,196]
```
---

code
```python
num_list = [4,5,8,12,14,20,23]
size = len(num_list) # 7

for i in range(0,size,2): # 0,2,4,6
	print(num_list[i])
```

output
```
4 
8
14
23
```

## 2. Tuples - immutable

- Same as lists but tuples are ==**immutable** (cannot change once created)==
- defined using `()`

- can access an individual element by its index

```python
t1 = ('A', 'B', 'C', 'D', 'E')

print( t1[0] )  # 'A'
print( t1[2] )  # 'C'
```

- to define a tuple with one element, you need to include a ==trailing comma==

```python
>>> num = (3,)
>>> type(num)
<class 'tuple'>
```

> You **cannot** change or add any values after creating a tuple; doing so will result in an error.