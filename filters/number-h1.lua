local h1_counter = 0

local exclude = {
    ["BIBLIOGRAPHY"] = true,
    ["Acknowledgement"] = true,
    ["Abstract"] = true
}

function Header(el)

    local title = pandoc.utils.stringify(el.content)

    -- skip numbering for specific headings
    if el.level == 1 and not exclude[title] then
        h1_counter = h1_counter + 1

        table.insert(el.content, 1, pandoc.Str(h1_counter .. "."))
        table.insert(el.content, 2, pandoc.Space())
    end

    return el
end