local h3_counter = 0
local current_h1 = 0
local current_h2 = 0

local exclude_h1 = {
	["Index"] = true,
	["Bibliography"] = true,
	["Abstract"] = true,
	["Acknowledgement"] = true,
}

function Header(el)
	local title = pandoc.utils.stringify(el.content)

	-- Track H1 context
	if el.level == 1 then
		h3_counter = 0
		current_h2 = 0

		if not exclude_h1[title] then
			current_h1 = current_h1 + 1
		end

		return el
	end

	-- Track H2 context
	if el.level == 2 then
		h3_counter = 0
		current_h2 = current_h2 + 1

		return el
	end

	-- Number H3
	if el.level == 3 then
		h3_counter = h3_counter + 1

		local prefix = current_h1 .. "." .. current_h2 .. "." .. h3_counter

		table.insert(el.content, 1, pandoc.Str(prefix))
		table.insert(el.content, 2, pandoc.Space())

		return el
	end

	return el
end
