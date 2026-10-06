-- ============================================================
-- Configuration
-- ============================================================

-- Available modes:
--   "roman"   → Table I, Table II, Table III...
--   "simple"  → Table 1, Table 2, Table 3...
--   "nested"  → Table 1.1, Table 1.2, Table 2.1...
--
-- Change this value to switch numbering mode.
local NUMBERING_MODE = "roman"

-- ============================================================
-- State
-- ============================================================

local table_counter = 0
local current_h1 = 0
local excluded_section = false

local exclude_h1 = {
	["Index"] = true,
	["Bibliography"] = true,
	["Abstract"] = true,
	["Acknowledgement"] = true,
}

-- ============================================================
-- Roman numeral conversion
-- ============================================================

local function to_roman(number)
	local numerals = {
		{ 1000, "M" },
		{ 900, "CM" },
		{ 500, "D" },
		{ 400, "CD" },
		{ 100, "C" },
		{ 90, "XC" },
		{ 50, "L" },
		{ 40, "XL" },
		{ 10, "X" },
		{ 9, "IX" },
		{ 5, "V" },
		{ 4, "IV" },
		{ 1, "I" },
	}

	local result = ""

	for _, pair in ipairs(numerals) do
		local value = pair[1]
		local symbol = pair[2]

		while number >= value do
			result = result .. symbol
			number = number - value
		end
	end

	return result
end

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

			-- Only nested numbering restarts at each H1.
			if NUMBERING_MODE == "nested" then
				table_counter = 0
			end
		end
	end

	return el
end

-- ============================================================
-- Table numbering
-- ============================================================

function Table(el)
	if excluded_section then
		return el
	end

	if #el.caption.long == 0 then
		return el
	end

	table_counter = table_counter + 1

	local number

	if NUMBERING_MODE == "roman" then
		-- Global: Table I, Table II, Table III...
		number = to_roman(table_counter)
	elseif NUMBERING_MODE == "simple" then
		-- Global: Table 1, Table 2, Table 3...
		number = tostring(table_counter)
	elseif NUMBERING_MODE == "nested" then
		-- Section-wise: Table 1.1, Table 1.2, Table 2.1...
		number = current_h1 .. "." .. table_counter
	else
		error("Invalid NUMBERING_MODE: " .. tostring(NUMBERING_MODE) .. ". Use 'roman', 'simple', or 'nested'.")
	end

	local prefix = "Table " .. number .. ":"

	local first_block = el.caption.long[1]

	table.insert(first_block.content, 1, pandoc.Str(prefix))
	table.insert(first_block.content, 2, pandoc.Space())

	return el
end
