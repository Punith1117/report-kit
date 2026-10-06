-- ============================================================
-- Configuration
-- ============================================================

-- Available modes:
--   "global" → Fig. 1, Fig. 2, Fig. 3...
--   "nested" → Fig. 1.1, Fig. 1.2, Fig. 2.1...
--
-- Change this value to switch numbering mode.
local NUMBERING_MODE = "global"

-- ============================================================
-- State
-- ============================================================

local figure_counter = 0
local current_h1 = 0
local excluded_section = false

local exclude_h1 = {
	["Index"] = true,
	["Bibliography"] = true,
	["Abstract"] = true,
	["Acknowledgement"] = true,
}

-- ============================================================
-- Header handling
-- ============================================================

function Header(el)
	if el.level == 1 then
		local title = pandoc.utils.stringify(el.content)

		if exclude_h1[title] then
			excluded_section = true
		else
			excluded_section = false
			current_h1 = current_h1 + 1

			-- Only section-wise numbering restarts at each H1.
			if NUMBERING_MODE == "nested" then
				figure_counter = 0
			end
		end
	end

	return el
end

-- ============================================================
-- Figure numbering
-- ============================================================

function Figure(el)
	if excluded_section then
		return el
	end

	if #el.caption.long == 0 then
		return el
	end

	figure_counter = figure_counter + 1

	local number

	if NUMBERING_MODE == "global" then
		-- Global: Fig. 1, Fig. 2, Fig. 3...
		number = tostring(figure_counter)
	elseif NUMBERING_MODE == "nested" then
		-- Section-wise: Fig. 1.1, Fig. 1.2, Fig. 2.1...
		number = current_h1 .. "." .. figure_counter
	else
		error("Invalid NUMBERING_MODE: " .. tostring(NUMBERING_MODE) .. ". Use 'global' or 'nested'.")
	end

	local prefix = "Fig. " .. number .. ":"

	local first_block = el.caption.long[1]

	table.insert(first_block.content, 1, pandoc.Str(prefix))
	table.insert(first_block.content, 2, pandoc.Space())

	return el
end
