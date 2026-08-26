## Markdown Syntax Guide (PROJECT STANDARD)

This project uses Pandoc-compatible Markdown only.

### 1. Headings (Template-driven)

```
# Heading 1 
## Heading 2
### Heading 3
and so on..
```

- h1, h2 and h3 are auto-numbered through lua filters.

### 2. Paragraph Styling (Template controlled)

Template enforces:

- Body text: justified
- First paragraph: justified (section intro style)

### 3. Page Breaks, Enter and Spaces

Use: `\newpage` or `\pagebreak` for new page - Handled by: filters/pagebreak.lua

Use: `&nbsp` for space and `&emsp` for tab space.

Use: `\` for Enter.

### 4. Images (Centered with Caption)

Correct syntax:
`![System Architecture](assets/images/architecture.png){width=5in height=3.5in}`

Points to remember:
- Must be alone in paragraph
- Caption is auto-derived and auto-numbered from alt text
- Centering is handled by template styling

### 5. Tables

Recommended table format:

```
-------- --------------------- -------------------------------------------
 Sl. No   Software              Purpose
-------- --------------------- -------------------------------------------
 1        Arduino IDE           Writing and uploading program code
 
 2        Embedded C            Programming language used for coding
 
 3        ESP32 Board Package   Supports ESP32 programming in Arduino IDE
 
 4        DHT Sensor Library    Enables communication with DHT22 sensor
 
 5        Serial Monitor        Displays real-time temperature readings
-------- --------------------- -------------------------------------------
```

The caption is written separately:

```
Table: Software Requirements
```

Points to remember:
- Table captions are automatically numbered.
- Table borders are NOT automatically applied by Pandoc or ODT templates. Borders can be added by running the Macro embedded into the template.

### 6. Column Width of Table Behavior

Use hyphens between header and first content row in the table to increase/decrease column width.
