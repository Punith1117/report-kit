local figure_counter = 0
local current_h1 = 0
local excluded_section = false

local exclude_h1 = {
	["Index"] = true,
	["Bibliography"] = true,
	["Abstract"] = true,
	["Acknowledgement"] = true,
}

function Header(el)
	if el.level == 1 then
		local title = pandoc.utils.stringify(el.content)

		figure_counter = 0

		if exclude_h1[title] then
			excluded_section = true
		else
			excluded_section = false
			current_h1 = current_h1 + 1
		end
	end

	return el
end

function Figure(el)
	if excluded_section then
		return el
	end

	if #el.caption.long == 0 then
		return el
	end

	figure_counter = figure_counter + 1

	local prefix = "Figure " .. current_h1 .. "." .. figure_counter .. ":"

	local first_block = el.caption.long[1]

	table.insert(first_block.content, 1, pandoc.Str(prefix))
	table.insert(first_block.content, 2, pandoc.Space())

	return el
end
