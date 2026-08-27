# Markdown Syntax Guide

This project uses Pandoc-compatible Markdown.

## 1. Headings

```md
# Heading 1
## Heading 2
### Heading 3
```

H1, H2, and H3 headings are automatically numbered through Lua filters.

---

## 2. Paragraphs

Write normal text as paragraphs.

```md
This is the first paragraph.

This is another paragraph.
```

Paragraph styling, including justification, is controlled by the reference template.

Use a blank line to start a new paragraph.

---

## 3. Lists

### Bullet list

```md
- First item
- Second item
- Third item
```

### Numbered list

```md
1. First item
2. Second item
3. Third item
```

### Nested lists

```md
1. Main item
   - Sub item
   - Another sub item

2. Next main item
```

---

## 4. Page Breaks and Spacing

Use a page break when required:

```md
\newpage
```

or:

```md
\pagebreak
```

Both are handled by `filters/pagebreak.lua`.

For additional spacing:

```md
&nbsp;
```

For tab-like spacing:

```md
&emsp;
```

A backslash can be used for a line break:

```md
First line\
Second line
```

---

## 5. Images

```md
![System Architecture](assets/images/architecture.png){width=5in height=3.5in}
```

* Keep the image in its own paragraph.
* The caption is derived from the alt text.
* Figure numbering is automatic.
* Centering and caption styling are controlled by the template.

---

## 6. Tables

Recommended format:

```text
-------- --------------------- -------------------------------------------
 Sl. No   Software              Purpose
-------- --------------------- -------------------------------------------
 1        Arduino IDE           Writing and uploading program code

 2        Embedded C            Programming language used for coding

 3        ESP32 Board Package   Supports ESP32 programming in Arduino IDE
-------- --------------------- -------------------------------------------
```

Add the caption below the table:

```md
Table: Software Requirements
```

Table captions are automatically numbered.

Column widths can be adjusted by changing the width of the column separators.

Table borders are applied during the build using the LibreOffice macro.

---

## 7. Code Blocks

Use three backticks before and after the code.

````md
```text
Your code goes here.
```
````

Example:

````md
```text
#include "DHT.h"
#define DHTPIN 4

void setup() {
  Serial.begin(115200);
}
```
````

You can also specify the language:

````md
```c
#include "DHT.h"
```
````

The code block must start and end with three backticks.

## 8. Block Quotes

Use `>` at the beginning of a line:

```md
> This is a block quote.
```

For multiple lines:

```md
> This is the first line of the quote.
> This is the second line.
```

For multiple paragraphs inside a block quote:

```md
> This is the first paragraph.
>
> This is the second paragraph.
```
