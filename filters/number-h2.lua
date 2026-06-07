local h2_counter = 0
local current_h1 = 0

local exclude_h1 = {
    ["Index"] = true,
    ["Bibliography"] = true,
    ["Abstract"] = true,
    ["Acknowledgement"] = true
}

function Header(el)

    local title = pandoc.utils.stringify(el.content)

    -- detect H1 context (pure structural inference)
    if el.level == 1 then
        h2_counter = 0

        if not exclude_h1[title] then
            current_h1 = current_h1 + 1
        end

        return el
    end

    -- H2 numbering
    if el.level == 2 then

        h2_counter = h2_counter + 1

        local prefix = current_h1 .. "." .. h2_counter

        table.insert(el.content, 1, pandoc.Str(prefix))
        table.insert(el.content, 2, pandoc.Space())

        return el
    end

    return el
end