local chapters = {}

-- Page numbers for each chapter.
-- Keep these as strings so ranges like "1-4" are supported.
local pageNumbers = {
	"1",
	"4-5",
	"6",
	"7-9",
	"10",
	"11-14",
	"15",
	"16",
}

function Header(el)
	if el.level == 1 and pandoc.utils.stringify(el.content) ~= "Index" then
		table.insert(chapters, pandoc.utils.stringify(el.content))
	end

	return el
end

function Pandoc(doc)
	local lines = {}

	table.insert(lines, '::: {custom-style="IndexTitle"}')
	table.insert(lines, "INDEX")
	table.insert(lines, ":::")
	table.insert(lines, "")

	table.insert(lines, "+--------+---------------------------------------------------------+----------+")
	table.insert(lines, "| Sl.No. | Chapter Name                                            | Page No. |")
	table.insert(lines, "+:======:+=========================================================+:========:+")

	for i, title in ipairs(chapters) do
		local pageNumber = pageNumbers[i] or tostring(i)

		local row = string.format("| %-6s | %-55s | %-8s |", tostring(i), string.upper(title), pageNumber)

		table.insert(lines, row)
		table.insert(lines, "+--------+---------------------------------------------------------+----------+")
	end

	local indexDoc = pandoc.read(table.concat(lines, "\n"), "markdown")

	return pandoc.Pandoc(indexDoc.blocks, doc.meta)
end
