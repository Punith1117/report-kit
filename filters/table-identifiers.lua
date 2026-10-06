-- filters/table-identifiers.lua

local ID_PATTERN = "{#(tbl:[%w%-%_:%.]+)}$"

function Table(table)
	local caption = table.caption

	if not caption or not caption.long then
		return table
	end

	local text = pandoc.utils.stringify(caption.long)
	local id = text:match(ID_PATTERN)

	if not id then
		return table
	end

	-- Give the Table AST node its identifier.
	table.identifier = id

	local marker = "{#" .. id .. "}"
	local new_blocks = {}

	for _, block in ipairs(caption.long) do
		if block.t ~= "Plain" then
			new_blocks[#new_blocks + 1] = block
		else
			local new_inlines = {}

			for _, inline in ipairs(block.content) do
				if inline.t ~= "Str" or inline.text ~= marker then
					new_inlines[#new_inlines + 1] = inline
				end
			end

			-- Remove the Space immediately before the marker.
			if #new_inlines > 0 and new_inlines[#new_inlines].t == "Space" then
				local cleaned = {}

				for i = 1, #new_inlines - 1 do
					cleaned[#cleaned + 1] = new_inlines[i]
				end

				new_inlines = cleaned
			end

			new_blocks[#new_blocks + 1] = pandoc.Plain(new_inlines)
		end
	end

	caption.long = new_blocks

	return table
end
