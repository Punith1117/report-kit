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

For multi-column documents (such as IEEE papers), use a column break to break to the next column:

```md
\columnbreak
```

These commands are handled by `filters/pagebreak.lua`.

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
* Centering and caption styling are controlled by the template.

### Figures with cross-references

To reference a figure from the text, give it an ID with the `fig:` prefix:

```md
![System Architecture Diagram](assets/images/architecture.png){#fig:system-architecture width=3in height=2in}
```

Then reference it anywhere in the report:

```md
The overall structure is shown in Fig. [system architecture](#fig:system-architecture).
```

* The ID (for example `#fig:system-architecture`) goes inside the braces, alongside `width` and `height`.
* IDs must be unique across the report.
* Pandoc numbers figures automatically (`Fig. 1`, `Fig. 2`, ...) and fills in the number at each reference.

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

Column widths can be adjusted by changing the width of the column separators.

### Tables with cross-references

To reference a table from the text, add an ID with the `tbl:` prefix at the end of the caption line:

```md
Table: Component Specifications {#tbl:component-specifications}
```

Then reference it anywhere in the report:

```md
The specifications are summarized in Table [component specifications](#tbl:component-specifications).
```

* The ID goes at the end of the `Table:` caption line, after a space.
* IDs must be unique across the report.
* Tables without an ID are still numbered, they just cannot be referenced.
* Pandoc numbers tables automatically and fills in the number at each reference. Tables use Roman numerals by default (`Table I`, `Table II`, ...). To use Arabic numbers instead (`Table 1`, `Table 2`, ...), set `TABLE_NUMBERING = "arabic"` in `scripts/format-table-numbering.js`.

---

## 7. Citations and Bibliography

Citations use Pandoc citeproc with IEEE numeric style (`--citeproc --bibliography=references.bib --csl=reference/ieee.csl`, wired in `scripts/build.js` and `scripts/preview_build.js`).

Most-used conventions:

```md
Single source [@sharma2023]

Multiple sources [@hersent2012; @singh2022]

With page locator [@arduino2025, p. 3]

In-text (author name + number): @singh2022
```

* Add entries to `references.bib` (`@article`, `@book`, `@inproceedings`, `@misc`).
* Use keys like `firstauthorYYYY` (no spaces): `sharma2023`, `hersent2012`.
* Separate authors with `and`: `author = {Sharma, R. and Patel, K.}`.
* `content/08_bibliography.md` contains only `# BIBLIOGRAPHY` plus `::: {#refs} :::` — Pandoc generates the numbered list there automatically.

---

## 8. Code Blocks

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

## 9. Block Quotes

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

---

## 10. TeX Mathematics

Pandoc-compatible TeX math can be used for mathematical expressions and equations.

### Inline Math

Use single `$` delimiters for inline mathematics:

```md
The temperature is represented by $T$ and the threshold is represented by $T_{\mathrm{threshold}}$.
```

---

## 11. IEEE Paper Format (Title & Multi-Column Authors)

When using an IEEE conference template, Report Kit automatically formats the paper:
- **Title and Subtitle**: Single column (full page width)
- **Author Affiliations**: 3 columns side-by-side (`Sect1`)
- **Paper Body**: 2 columns (`Sect2`)

### Option A: YAML Frontmatter (Recommended)

Place a YAML frontmatter block in `content/00_title.md` or at the top of your first markdown file:

```yaml
---
title: "Autonomous Temperature Monitoring and Alert System Using ESP32"
authors:
  - name: "1st Given Name Surname"
    dept: "dept. name of organization (of Affiliation)"
    org: "name of organization (of Affiliation)"
    location: "City, Country"
    email: "email address or ORCID"
  - name: "2nd Given Name Surname"
    dept: "dept. name of organization (of Affiliation)"
    org: "name of organization (of Affiliation)"
    location: "City, Country"
    email: "email address or ORCID"
  - name: "3rd Given Name Surname"
    dept: "dept. name of organization (of Affiliation)"
    org: "name of organization (of Affiliation)"
    location: "City, Country"
    email: "email address or ORCID"
---
```

### Option B: Markdown Divs

Alternatively, specify authors using markdown fenced divs:

```markdown
# Autonomous Temperature Monitoring and Alert System Using ESP32

::: {.authors}
::: {.author}
**1st Given Name Surname**\
dept. name of organization (of Affiliation)\
name of organization (of Affiliation)\
City, Country\
email address or ORCID
:::

::: {.author}
**2nd Given Name Surname**\
dept. name of organization (of Affiliation)\
name of organization (of Affiliation)\
City, Country\
email address or ORCID
:::

::: {.author}
**3rd Given Name Surname**\
dept. name of organization (of Affiliation)\
name of organization (of Affiliation)\
City, Country\
email address or ORCID
:::
:::
```
