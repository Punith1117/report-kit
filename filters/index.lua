local chapters = {}

function Header(el)
    if el.level == 1 and pandoc.utils.stringify(el.content) ~= "Index" then
        table.insert(chapters, pandoc.utils.stringify(el.content))
    end
    return el
end

function Pandoc(doc)

    local lines = {}
    
    table.insert(lines, '::: {custom-style="IndexTitle"}')
    table.insert(lines, 'INDEX')
    table.insert(lines, ':::')
    table.insert(lines, "")

    table.insert(lines, "+--------+---------------------------------------------------------+----------+")
    table.insert(lines, "| Sl.No. | Chapter Name                                            | Page No. |")
    table.insert(lines, "+:======:+=========================================================+:========:+")

    for i, title in ipairs(chapters) do
        local row = string.format(
            "| %-6s | %-55s | %-8s |",
            tostring(i),
            string.upper(title),
            tostring(i)
        )

        table.insert(lines, row)
        table.insert(lines, "+--------+---------------------------------------------------------+----------+")
    end

    table.insert(lines, "")
    table.insert(lines, "\\newpage")
    table.insert(lines, "")

    local indexDoc = pandoc.read(
        table.concat(lines, "\n"),
        "markdown"
    )

    local newBlocks = {}

    for _, block in ipairs(indexDoc.blocks) do
        table.insert(newBlocks, block)
    end

    for _, block in ipairs(doc.blocks) do
        table.insert(newBlocks, block)
    end

    return pandoc.Pandoc(newBlocks, doc.meta)
end