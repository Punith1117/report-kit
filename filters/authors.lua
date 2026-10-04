-- filters/authors.lua
-- Supports author specification via YAML frontmatter or Markdown divs (.authors / .author)

local function to_inlines(val)
  if type(val) == "string" then
    return pandoc.Inlines(val)
  elseif type(val) == "table" then
    if val.t == "MetaInlines" or val.t == nil then
      return pandoc.Inlines(val)
    elseif val.t == "MetaString" then
      return pandoc.Inlines(val)
    end
  end
  return pandoc.Inlines(tostring(val))
end

function Div(el)
  if el.classes:includes("author") then
    el.attributes["custom-style"] = "Author"
    return el
  end
  if el.classes:includes("authors") then
    el.attributes["custom-style"] = "Authors"
    return el
  end
end

function Pandoc(doc)
  local authors_meta = doc.meta.authors
  if authors_meta and type(authors_meta) == "table" then
    local author_divs = {}
    for i, item in ipairs(authors_meta) do
      local inlines = pandoc.Inlines({})
      if type(item) == "table" then
        if item.name then
          inlines:extend(pandoc.Inlines({pandoc.Strong(to_inlines(item.name))}))
          inlines:insert(pandoc.LineBreak())
        end
        if item.dept then
          inlines:extend(to_inlines(item.dept))
          inlines:insert(pandoc.LineBreak())
        end
        if item.org then
          inlines:extend(to_inlines(item.org))
          inlines:insert(pandoc.LineBreak())
        end
        if item.location then
          inlines:extend(to_inlines(item.location))
          inlines:insert(pandoc.LineBreak())
        end
        if item.email then
          inlines:extend(to_inlines(item.email))
        end
      else
        inlines = to_inlines(item)
      end
      local p = pandoc.Para(inlines)
      local author_div = pandoc.Div({p}, {class = "author", ["custom-style"] = "Author"})
      table.insert(author_divs, author_div)
    end
    local container = pandoc.Div(author_divs, {class = "authors", ["custom-style"] = "Authors"})
    table.insert(doc.blocks, 1, container)
    doc.meta.authors = nil
  end
  return doc
end
